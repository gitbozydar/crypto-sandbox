import { NextResponse, type NextRequest } from "next/server";
import { getKlines, KLINE_INTERVALS, type KlineInterval } from "@/lib/market/binance";
import { getMarket } from "@/lib/market/markets";

// Endpoint zwracający historię świec dla pary.
export const GET = async (request: NextRequest) => {
  const symbol = request.nextUrl.searchParams.get("market")?.toUpperCase() ?? "";
  const interval = request.nextUrl.searchParams.get("interval") as KlineInterval;

  if (!KLINE_INTERVALS.includes(interval)) {
    return NextResponse.json({ error: "Nieprawidłowy interwał" }, { status: 400 });
  }
  if (!(await getMarket(symbol))) {
    return NextResponse.json({ error: "Nieznana para" }, { status: 404 });
  }

  const candles = await getKlines(symbol, interval);
  return NextResponse.json(candles);
};
