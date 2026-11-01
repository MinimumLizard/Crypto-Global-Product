"""crypto_charts: the chart library's price-based lines, per pair per day, in long form (one row per pair, series and
day). Long averages, momentum indicators (RSI, MACD, Bollinger bands), running and calendar returns, risk ratios, and
each pair's relation to bitcoin. Every value for day D uses closes up to D only. See METHOD.md for each definition."""
from __future__ import annotations

import numpy as np
import pandas as pd

from .._lib.crypto import closes, ema, sma


def wilder_rsi(values: np.ndarray, n: int) -> np.ndarray:
    """Wilder's RSI at each index: average gain and loss over n changes, started from their simple averages over the
    first n changes, then smoothed with weight 1/n. NaN until n changes exist. Values must have no gaps."""
    out = np.full(len(values), np.nan)
    if len(values) <= n:
        return out
    change = np.diff(values)
    gain, loss = np.clip(change, 0, None), np.clip(-change, 0, None)
    g, l = gain[:n].mean(), loss[:n].mean()
    out[n] = _rsi(g, l)
    for i in range(n, len(change)):
        g = (g * (n - 1) + gain[i]) / n
        l = (l * (n - 1) + loss[i]) / n
        out[i + 1] = _rsi(g, l)
    return out


def _rsi(g: float, l: float) -> float:
    return 100.0 if l == 0 else 100.0 - 100.0 / (1.0 + g / l)


def weekly_rsi(s: pd.Series, n: int) -> pd.Series:
    """Wilder's RSI on weekly closes as a weekly chart shows it on each day: weeks run Monday to Sunday (UTC), a
    completed week's close is its Sunday close, and the week in progress closes at day D's close (as
    _lib.crypto.weekly_sma_and_ema)."""
    filled = s.ffill()
    days = s.index
    sundays = filled[days.dayofweek == 6]
    sun = sundays.to_numpy()
    before = np.searchsorted(sundays.index.values, days.values, side="left")   # Sundays strictly before each day
    change = np.diff(sun)
    gain, loss = np.clip(change, 0, None), np.clip(-change, 0, None)
    # the smoothed averages after each Sunday's change j (1-based: change j is sun[j] - sun[j - 1])
    g_after = np.full(len(sun), np.nan)
    l_after = np.full(len(sun), np.nan)
    if len(change) >= n:
        g, l = gain[:n].mean(), loss[:n].mean()
        g_after[n], l_after[n] = g, l
        for j in range(n + 1, len(sun)):
            g = (g * (n - 1) + gain[j - 1]) / n
            l = (l * (n - 1) + loss[j - 1]) / n
            g_after[j], l_after[j] = g, l
    close = filled.to_numpy()
    out = np.full(len(days), np.nan)
    for i, b in enumerate(before):
        if b < n or np.isnan(close[i]):
            continue                            # fewer than n weekly changes up to today
        today = close[i] - sun[b - 1]
        tg, tl = max(today, 0.0), max(-today, 0.0)
        if b == n:                              # today's change is the n-th: the seed, a simple average
            g = (gain[: n - 1].sum() + tg) / n
            l = (loss[: n - 1].sum() + tl) / n
        else:                                   # the state after the previous Sunday, one more step with today
            g = (g_after[b - 1] * (n - 1) + tg) / n
            l = (l_after[b - 1] * (n - 1) + tl) / n
        out[i] = _rsi(g, l)
    return pd.Series(out, index=days)


def ema_series(s: pd.Series, n: int) -> pd.Series:
    """EMA (lib.ema's convention) over the series' defined stretch, NaN before it."""
    valid = s.dropna()
    out = pd.Series(np.nan, index=s.index)
    if len(valid):
        out.loc[valid.index] = ema(valid.to_numpy(), n)
    return out


def quarterly(s: pd.Series) -> pd.Series:
    """Completed calendar quarters only, dated on the quarter's last day: close / the previous quarter's close - 1."""
    data = s.dropna()
    if data.empty:
        return pd.Series(dtype=float)
    last_day = data.index[-1]
    out, prev = {}, None
    for period, group in data.groupby(data.index.to_period("Q")):
        end = period.to_timestamp(how="end").normalize()
        if end > last_day:
            break
        close = float(group.iloc[-1])
        if prev is not None:
            out[end] = close / prev - 1
        prev = close
    return pd.Series(out, dtype=float)


def year_to_date(s: pd.Series) -> pd.Series:
    """close / the previous year's last close (31 December) - 1; NaN where that close does not exist."""
    filled_year_end = {}
    for year in sorted(set(s.index.year)):
        day = pd.Timestamp(year - 1, 12, 31)
        v = s.get(day)
        filled_year_end[year] = float(v) if v is not None and not np.isnan(v) else np.nan
    base = np.array([filled_year_end[y] for y in s.index.year])
    return s / base - 1


def lines(s: pd.Series, p: dict) -> dict[str, pd.Series]:
    year = p["annualisation_days"]
    out: dict[str, pd.Series] = {}
    for n in p["sma_days"]:
        out[f"sma_{n}"] = sma(s, n)
    for n in p["roi_days"]:
        out[f"roi_{n}d"] = s / s.shift(n) - 1
    out["ret_ytd"] = year_to_date(s)
    out["ret_quarter"] = quarterly(s).reindex(s.index)

    valid = s.dropna()
    out["rsi_14d"] = pd.Series(wilder_rsi(valid.to_numpy(), p["rsi_days"]), index=valid.index).reindex(s.index)
    out["rsi_14w"] = weekly_rsi(s, p["rsi_weeks"])
    fast, slow, signal = p["macd"]
    macd = ema_series(s, fast) - ema_series(s, slow)
    macd_signal = ema_series(macd, signal)
    out["macd"], out["macd_signal"], out["macd_hist"] = macd, macd_signal, macd - macd_signal
    n, k = p["bollinger"]
    mid = sma(s, n)
    sd = s.rolling(n, min_periods=n).std(ddof=0)
    out["bb_mid"], out["bb_upper"], out["bb_lower"] = mid, mid + k * sd, mid - k * sd
    out["bb_width"] = (out["bb_upper"] - out["bb_lower"]) / mid

    r = p["risk_days"]
    log_ret = np.log(s / s.shift(1))
    mean = log_ret.rolling(r, min_periods=r).mean() * year
    vol = log_ret.rolling(r, min_periods=r).std(ddof=1) * np.sqrt(year)
    downside = np.sqrt((np.minimum(log_ret, 0.0) ** 2).rolling(r, min_periods=r).mean()) * np.sqrt(year)
    out["vol_365d"] = vol
    out["sharpe_365d"] = mean / vol
    out["sortino_365d"] = mean / downside
    return out


def relations(s: pd.Series, btc: pd.Series, p: dict) -> dict[str, pd.Series]:
    """The pair against bitcoin: its price in bitcoin, the correlation of daily log returns, and beta."""
    btc = btc.reindex(s.index)
    r, rb = np.log(s / s.shift(1)), np.log(btc / btc.shift(1))
    c, b = p["corr_days"], p["risk_days"]
    return {
        "price_btc": s / btc,
        "corr_btc_90d": r.rolling(c, min_periods=c).corr(rb),
        "beta_btc_365d": r.rolling(b, min_periods=b).cov(rb) / rb.rolling(b, min_periods=b).var(),
    }


def compute(inputs, as_of):
    p = inputs.params
    series = closes(inputs, as_of, p["pairs"])
    btc = series.get(p["btc_pair"])
    rows = []
    for pair, s in sorted(series.items()):
        out = lines(s, p)
        if btc is not None and pair != p["btc_pair"]:
            out.update(relations(s, btc, p))
        for name, values in out.items():
            for day, v in values.dropna().items():
                if np.isfinite(v):
                    rows.append({"pair": pair, "series": name, "day": day.date(), "value": float(v)})
    return {"models.crypto_charts_series": rows}
