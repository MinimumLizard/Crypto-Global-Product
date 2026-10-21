// Where each model's outputs can be seen: its API routes and the pages that show it. The tier-leak tests request
// every one of these as every tier. Adding a model means adding it here, and a unit test fails until it is.
import type { ModelName } from "./registry";

// The weekly e-mail (/email/crypto) is not listed here: it follows a stricter rule than pages (no delayed free
// preview in an e-mail), which its own leak test checks for every model.
export const MODEL_ROUTES: Record<ModelName, { api: string[]; pages: string[] }> = {
  crypto_market: { api: ["/api/v1/crypto/market"], pages: ["/", "/crypto"] },
  crypto_cycle: { api: ["/api/v1/crypto/cycle"], pages: ["/", "/crypto", "/crypto/btc"] },
  crypto_trend_bands: { api: ["/api/v1/crypto/trend-bands"], pages: ["/crypto/btc"] },
};

// Detail pages, at the assets the tier-leak seed writes (web/tests/leak/seed.py).
export const DETAIL_PAGES = ["/crypto/btc", "/crypto/eth", "/crypto/ethbtc"];

// Every page of the site, for the checks that apply to all of them (no paid data for free visitors, ever).
// The weekly e-mail's preview is a page like any other, so every e-mail is covered too.
export const ALL_PAGES = ["/", "/crypto", "/crypto/btc", "/crypto/eth", "/crypto/ethbtc", "/learn", "/plans", "/methods", "/about", "/feedback", "/feedback/thanks", "/email/crypto"];
