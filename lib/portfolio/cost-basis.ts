// Koszt zakupu monet metodą średniej ceny (average cost) — podstawa do liczenia zysku/straty.
//   Zakup:    ilość rośnie, koszt rośnie o zapłaconą kwotę (w USDT, razem z prowizją).
//   Sprzedaż: ilość maleje, koszt maleje proporcjonalnie (średnia cena się nie zmienia).
// Każda transakcja ma dwie strony: przy kupnie ETH za BTC przybywa ETH i ubywa BTC.
// USDT pomijamy — to „gotówka”, jej wartość jest stała.

export type TradeForCost = {
  base: string;
  quote: string;
  side: "BUY" | "SELL";
  quantity: number; // ilość monety bazowej
  value: number; // wartość w walucie kwotowania
  fee: number; // prowizja w walucie kwotowania
  quoteRateUsdt: number; // kurs waluty kwotowania w USDT w chwili transakcji
};

export type Position = { quantity: number; cost: number }; // cost = łączny koszt w USDT

export const computeCostBasis = (trades: TradeForCost[]) => {
  const positions = new Map<string, Position>();
  const positionOf = (asset: string) => positions.get(asset) ?? positions.set(asset, { quantity: 0, cost: 0 }).get(asset)!;

  const add = (asset: string, quantity: number, costUsdt: number) => {
    if (asset === "USDT") return;
    const p = positionOf(asset);
    p.quantity += quantity;
    p.cost += costUsdt;
  };

  const remove = (asset: string, quantity: number) => {
    if (asset === "USDT") return;
    const p = positionOf(asset);
    const averagePrice = p.quantity > 0 ? p.cost / p.quantity : 0;
    p.cost -= averagePrice * Math.min(quantity, p.quantity);
    p.quantity = Math.max(0, p.quantity - quantity);
  };

  for (const t of trades) {
    if (t.side === "BUY") {
      const paid = t.value + t.fee;
      add(t.base, t.quantity, paid * t.quoteRateUsdt);
      remove(t.quote, paid);
    } else {
      const received = t.value - t.fee;
      remove(t.base, t.quantity);
      add(t.quote, received, received * t.quoteRateUsdt);
    }
  }
  return positions;
};
