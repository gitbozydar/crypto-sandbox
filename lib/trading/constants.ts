// Stałe handlu — współdzielone przez silnik (serwer) i formularz zlecenia (klient).

// Prowizja jak w standardowej taryfie Binance: 0,1% wartości zlecenia, pobierana w walucie kwotowania.
export const FEE_RATE = "0.001";

// Kapitał startowy nowego portfela (w USDT).
export const STARTING_BALANCE = 10_000;

// Zlecenia warunkowe: co robią i w którą stronę musi pójść cena, żeby się wykonały.
export const TRIGGERS = {
  STOP_LOSS: { side: "SELL", when: "below", label: "Stop-loss", hint: "Sprzedaj, gdy cena spadnie do" },
  TAKE_PROFIT: { side: "SELL", when: "above", label: "Take-profit", hint: "Sprzedaj, gdy cena wzrośnie do" },
  LIMIT_BUY: { side: "BUY", when: "below", label: "Kup po cenie", hint: "Kup, gdy cena spadnie do" },
} as const;
export type TriggerType = keyof typeof TRIGGERS;

// Automatyczne kupowanie: dostępne odstępy między zakupami (w godzinach).
export const DCA_INTERVALS = { 24: "Codziennie", 168: "Co tydzień", 720: "Co 30 dni" } as const;
export type DcaInterval = keyof typeof DCA_INTERVALS;

// Limity na użytkownika — żeby nikt nie zasypał bazy tysiącami zleceń.
export const MAX_ACTIVE_ORDERS = 20;
export const MAX_ACTIVE_PLANS = 10;
