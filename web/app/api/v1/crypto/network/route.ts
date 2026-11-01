import { badRequest, dateParam, respond } from "@/lib/api";
import { networkLatest } from "@/lib/data/charts";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

// The Bitcoin network's series on the latest published day (or the latest on or before ?date=).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = dateParam(url);
  if (date === null) return badRequest("date must be YYYY-MM-DD");
  return respond("btc_network", await networkLatest(await getViewer(), date));
}
