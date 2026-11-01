import { badRequest, dateParam, json, respond } from "@/lib/api";
import { assetByPair } from "@/lib/crypto-display";
import { chartLatest } from "@/lib/data/charts";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

// Every chart-library line for one pair on its latest day (or the latest on or before ?date=): ?pair=btcusd (the default).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = dateParam(url);
  if (date === null) return badRequest("date must be YYYY-MM-DD");
  const pair = url.searchParams.get("pair") ?? "btcusd";
  if (!assetByPair(pair)?.cycle) return json({ error: "not_found" }, 404);
  return respond("crypto_charts", await chartLatest(await getViewer(), pair, date));
}
