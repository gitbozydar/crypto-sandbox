import { prisma } from "@/lib/db";
import { getBookTicker } from "@/lib/market/binance";
import { Prisma } from "@/src/generated/prisma/client";
import { FEE_RATE } from "./constants";
import { balanceOf, getOrCreateWallet } from "./wallet";

const Decimal = Prisma.Decimal;
type Decimal = Prisma.Decimal;

// Funkcja zaokrąglająca w dół do 18 miejsc po przecinku.
const round = (d: Decimal) => d.toDecimalPlaces(18, Decimal.ROUND_DOWN);

export type Side = "BUY" | "SELL";
type OrderInput = { market: string; side: Side; amount: string; max?: boolean };
export type TradeResult = {
  id: string;
  side: Side;
  base: string;
  quote: string;
  quantity: string;
  price: string;
  value: string;
};

export class TradeError extends Error {}

// Funkcja pobierająca kurs waluty w USDT.
const usdtRate = async (asset: string) => {
  if (asset === "USDT") return new Decimal(1);
  const { bid, ask } = await getBookTicker(`${asset}USDT`);
  return new Decimal(bid).add(ask).div(2);
};

// Funkcja wykonująca zlecenie rynkowe po bieżącej cenie.
export const executeMarketOrder = async (userId: string, input: OrderInput): Promise<TradeResult> => {
  const market = await prisma.market.findFirst({ where: { symbol: input.market, isActive: true } });
  if (!market) throw new TradeError("Ta para nie jest dostępna do handlu.");
  const wallet = await getOrCreateWallet(userId);

  const isBuy = input.side === "BUY";
  const payAsset = isBuy ? market.quoteSymbol : market.baseSymbol;
  const getAsset = isBuy ? market.baseSymbol : market.quoteSymbol;

  const amount = input.max ? await balanceOf(wallet.id, payAsset) : new Decimal(input.amount);
  if (amount.lte(0))
    throw new TradeError(input.max ? `Brak środków w ${payAsset}.` : "Kwota musi być większa od zera.");

  const [book, quoteRateUsdt] = await Promise.all([getBookTicker(market.symbol), usdtRate(market.quoteSymbol)]).catch(
    () => [null, null],
  );
  if (!book || !quoteRateUsdt) throw new TradeError("Nie udało się pobrać ceny z giełdy. Spróbuj ponownie.");
  const price = new Decimal(isBuy ? book.ask : book.bid);
  const feeRate = new Decimal(FEE_RATE);

  const rawQty = isBuy ? amount.div(price.mul(feeRate.add(1))) : amount;
  const quantity = rawQty.div(market.stepSize).floor().mul(market.stepSize);
  const value = round(quantity.mul(price));
  const fee = round(value.mul(feeRate));

  if (quantity.lte(0) || quantity.lt(market.minQty)) {
    throw new TradeError(`Minimalna ilość to ${market.minQty} ${market.baseSymbol}.`);
  }
  if (value.lt(market.minNotional)) {
    throw new TradeError(`Minimalna wartość zlecenia to ${market.minNotional} ${market.quoteSymbol}.`);
  }

  const pay = isBuy ? value.add(fee) : quantity;
  const receive = isBuy ? quantity : value.sub(fee);

  const trade = await prisma.$transaction(async (tx) => {
    const { count } = await tx.balance.updateMany({
      where: { walletId: wallet.id, assetSymbol: payAsset, amount: { gte: pay } },
      data: { amount: { decrement: pay } },
    });
    if (count === 0) throw new TradeError(`Za mało ${payAsset} — potrzeba ${pay.toSignificantDigits(8)}.`);

    await tx.balance.upsert({
      where: { walletId_assetSymbol: { walletId: wallet.id, assetSymbol: getAsset } },
      update: { amount: { increment: receive } },
      create: { walletId: wallet.id, assetSymbol: getAsset, amount: receive },
    });

    return tx.trade.create({
      data: {
        walletId: wallet.id,
        marketSymbol: market.symbol,
        side: input.side,
        quantity,
        price,
        quoteAmount: value,
        fee,
        quoteRateUsdt,
      },
    });
  });

  return {
    id: trade.id,
    side: input.side,
    base: market.baseSymbol,
    quote: market.quoteSymbol,
    quantity: quantity.toString(),
    price: price.toString(),
    value: value.toString(),
  };
};
