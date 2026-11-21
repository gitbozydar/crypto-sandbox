"use client";

import { useEffect, useRef } from "react";
import { BINANCE_WS, makeTicker } from "./binance";

// Wiadomość strumienia <para>@miniTicker (statystyki 24h, co ~1 s).
export type MiniTickerMsg = { e: "24hrMiniTicker"; s: string; c: string; o: string; h: string; l: string; q: string };
// Wiadomość strumienia <para>@kline_<interwał> (bieżąca świeca).
export type KlineMsg = { e: "kline"; k: { t: number; o: string; h: string; l: string; c: string; v: string } };

export const tickerFromStream = (m: MiniTickerMsg) => makeTicker(m.s, m.c, m.o, m.h, m.l, m.q);

// Nasłuchuje strumieni Binance przez WebSocket, bezpośrednio z przeglądarki.
// Jedno połączenie obsługuje wiele strumieni naraz (/stream?streams=a/b/c).
// Po zerwaniu łączy się ponownie co 1 s, 2 s, 4 s… (maks. 30 s).
export const useBinanceStream = <T,>(streams: string[], onMessage: (data: T) => void) => {
  // Ref zamiast zależności efektu: nowa funkcja przy każdym renderze nie zrywa połączenia.
  const handler = useRef(onMessage);
  useEffect(() => {
    handler.current = onMessage;
  });

  const key = streams.join("/"); // połączenie zmieniamy tylko, gdy zmieni się lista strumieni

  useEffect(() => {
    if (!key) return;
    let ws: WebSocket;
    let retry = 0;
    let timer: ReturnType<typeof setTimeout>;
    let closed = false;

    const connect = () => {
      ws = new WebSocket(`${BINANCE_WS}/stream?streams=${key}`);
      ws.onopen = () => (retry = 0);
      ws.onmessage = (e) => handler.current(JSON.parse(e.data).data);
      ws.onclose = () => {
        if (!closed) timer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** retry++));
      };
    };
    connect();

    return () => {
      closed = true;
      clearTimeout(timer);
      ws.close();
    };
  }, [key]);
};
