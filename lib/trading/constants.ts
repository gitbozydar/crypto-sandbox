export const FEE_RATE = "0.001";

export const STARTING_BALANCE = 10_000;

export const TRIGGERS = {
  STOP_LOSS: { side: "SELL", when: "below", label: "Stop-loss", hint: "Sprzedaj, gdy cena spadnie do" },
  TAKE_PROFIT: { side: "SELL", when: "above", label: "Take-profit", hint: "Sprzedaj, gdy cena wzrośnie do" },
  LIMIT_BUY: { side: "BUY", when: "below", label: "Kup po cenie", hint: "Kup, gdy cena spadnie do" },
} as const;
export type TriggerType = keyof typeof TRIGGERS;

export const DCA_INTERVALS = { 24: "Codziennie", 168: "Co tydzień", 720: "Co 30 dni" } as const;
export type DcaInterval = keyof typeof DCA_INTERVALS;

export const MAX_ACTIVE_ORDERS = 20;
export const MAX_ACTIVE_PLANS = 10;
