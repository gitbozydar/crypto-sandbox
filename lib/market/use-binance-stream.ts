"use client";

import { useEffect, useRef } from "react";
import { BINANCE_WS, makeTicker } from "./binance";

export type MiniTickerMsg = { e: "24hrMiniTicker"; s: string; c: string; o: string; h: string; l: string; q: string };
export type KlineMsg = { e: "kline"; k: { t: number; o: string; h: string; l: string; c: string; v: string } };

// Funkcja zamieniająca wiadomość WebSocket na statystyki 24h.
export const tickerFromStream = (m: MiniTickerMsg) => makeTicker(m.s, m.c, m.o, m.h, m.l, m.q);

// Hook nasłuchujący strumieni Binance przez WebSocket.
export const useBinanceStream = <T>(streams: string[], onMessage: (data: T) => void) => {
  const handler = useRef(onMessage);
  useEffect(() => {
    handler.current = onMessage;
  });

  const key = streams.join("/");

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
