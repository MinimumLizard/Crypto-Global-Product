// The "recent window" rule (free sees only the last N days; config/entitlements.yaml) is generic, but no current model
// uses it. Tests switch it on for one model and restore the registry afterwards, so the rule stays covered.
import { type ModelName, registry } from "@/lib/registry";

export function withRecentWindow<T>(model: ModelName, window: { days: number; full_history_tier: "plus" | "pro" | "professional" }, run: () => T): T {
  const entry = registry.models[model];
  const before = entry.recent_window;
  entry.recent_window = window;
  try {
    return run();
  } finally {
    entry.recent_window = before;
  }
}
