// ─── Silnik symulacji handlu ────────────────────────────────────
// Zlecenie rynkowe po bieżącej cenie z Binance.
//   Kupno:    podajesz kwotę w walucie kwotowania (np. 100 USDT) → dostajesz monetę.
//   Sprzedaż: podajesz ilość monety (np. 0.01 BTC) → dostajesz walutę kwotowania.
//   max:      całe saldo w chwili wykonania (przycisk 100%).
// Wszystko liczone na Decimal, żeby uniknąć błędów zaokrągleń liczb zmiennoprzecinkowych.

import { prisma } from "@/lib/db";
import { getBookTicker } from "@/lib/market/binance";
import { Prisma } from "@/src/generated/prisma/client";
import { FEE_RATE } from "./constants";
import { getOrCreateWallet } from "./wallet";

const Decimal = Prisma.Decimal;
type Decimal = Prisma.Decimal;

// Kolumny w bazie mają 18 miejsc po przecinku. Zawsze zaokrąglamy w dół,
// dzięki temu koszt z prowizją nigdy nie przekroczy kwoty, którą podał użytkownik.
const round = (d: Decimal) => d.toDecimalPlaces(18, Decimal.ROUND_DOWN);

export type Side = "BUY" | "SELL";
export type OrderInput = { market: string; side: Side; amount: string; max?: boolean };
export type TradeResult = { id: string; side: Side; base: string; quote: string; quantity: string; price: string; value: string };

// Błąd, którego treść można bezpiecznie pokazać użytkownikowi.
export class TradeError extends Error {}

// Kurs waluty w USDT (środek między bid i ask). Każda nasza waluta kwotowania ma parę z USDT.
const usdtRate = async (asset: string) => {
  if (asset === "USDT") return new Decimal(1);
  const { bid, ask } = await getBookTicker(`${asset}USDT`);
  return new Decimal(bid).add(ask).div(2);
};

const balanceOf = async (walletId: string, asset: string) => {
  const row = await prisma.balance.findUnique({ where: { walletId_assetSymbol: { walletId, assetSymbol: asset } } });
  return row?.amount ?? new Decimal(0);
};

export const executeMarketOrder = async (userId: string, input: OrderInput): Promise<TradeResult> => {
  const market = await prisma.market.findFirst({ where: { symbol: input.market, isActive: true } });
  if (!market) throw new TradeError("Ta para nie jest dostępna do handlu.");
  const wallet = await getOrCreateWallet(userId);

  const isBuy = input.side === "BUY";
  // Kupując płacisz walutą kwotowania (np. USDT), sprzedając oddajesz monetę (np. BTC).
  const payAsset = isBuy ? market.quoteSymbol : market.baseSymbol;
  const getAsset = isBuy ? market.baseSymbol : market.quoteSymbol;

  const amount = input.max ? await balanceOf(wallet.id, payAsset) : new Decimal(input.amount);
  if (amount.lte(0)) throw new TradeError(input.max ? `Brak środków w ${payAsset}.` : "Kwota musi być większa od zera.");

  // Cena z arkusza zleceń: kupujesz od sprzedających (ask), sprzedajesz kupującym (bid).
  // Cenę zawsze ustala serwer — nigdy nie ufamy cenie z przeglądarki.
  const [book, quoteRateUsdt] = await Promise.all([
    getBookTicker(market.symbol),
    usdtRate(market.quoteSymbol),
  ]).catch(() => [null, null]);
  if (!book || !quoteRateUsdt) throw new TradeError("Nie udało się pobrać ceny z giełdy. Spróbuj ponownie.");
  const price = new Decimal(isBuy ? book.ask : book.bid);
  const feeRate = new Decimal(FEE_RATE);

  // Ilość monety zaokrąglona w dół do kroku giełdy (np. 0.00001 BTC).
  // Przy kupnie dzielimy przez cenę powiększoną o prowizję, żeby całość zmieściła się w kwocie.
  const rawQty = isBuy ? amount.div(price.mul(feeRate.add(1))) : amount;
  const quantity = rawQty.div(market.stepSize).floor().mul(market.stepSize);
  const value = round(quantity.mul(price)); // wartość w walucie kwotowania
  const fee = round(value.mul(feeRate));

  if (quantity.lte(0) || quantity.lt(market.minQty)) {
    throw new TradeError(`Minimalna ilość to ${market.minQty} ${market.baseSymbol}.`);
  }
  if (value.lt(market.minNotional)) {
    throw new TradeError(`Minimalna wartość zlecenia to ${market.minNotional} ${market.quoteSymbol}.`);
  }

  // Prowizja zawsze w walucie kwotowania: przy kupnie dopłacasz, przy sprzedaży dostajesz mniej.
  const pay = isBuy ? value.add(fee) : quantity;
  const receive = isBuy ? quantity : value.sub(fee);

  // Jedna transakcja bazodanowa: wszystko albo nic.
  const trade = await prisma.$transaction(async (tx) => {
    // Odejmujemy tylko, jeśli saldo wystarcza (WHERE amount >= pay). Dwa równoległe
    // zlecenia nie wydadzą więc tych samych pieniędzy dwa razy.
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
      data: { walletId: wallet.id, marketSymbol: market.symbol, side: input.side, quantity, price, quoteAmount: value, fee, quoteRateUsdt },
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
