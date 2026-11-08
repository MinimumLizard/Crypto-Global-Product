import "server-only";

import { submitFeedback, usefulCount } from "../db";
import type { FeedbackInput, Outcome } from "../feedback";
import type { Viewer } from "../entitlements";

/** Stores one piece of feedback through the database's checked function; never reads any back. */
export async function sendFeedback(viewer: Viewer, input: FeedbackInput, senderKey: string): Promise<Outcome> {
  try {
    return await submitFeedback(input, viewer.tier, senderKey);
  } catch {
    return "unavailable"; // the database is down: say so rather than pretend it was stored
  }
}

/** How many people found a page useful (a real count, or null below the database's minimum). Reads one number,
 * never the votes. */
export async function foundUseful(page: string): Promise<number | null> {
  return usefulCount(page);
}
