"""btc_network: supply, issuance, difficulty and hash rate per UTC day, from the block headers alone (and the
Puell multiple, with bitcoin's daily close). See METHOD.md. A day is published only once no later block can still
carry a timestamp on it (the median time of the last 11 blocks is past the day's end), so a published day never
changes."""
from __future__ import annotations

import datetime as dt

import numpy as np
import pandas as pd

from .._lib.crypto import closes, sma

HASHES_PER_DIFFICULTY = 2 ** 32     # expected hashes to find a block at difficulty 1
POW_LIMIT = 0xFFFF << (8 * 26)


def target(bits: int) -> int:
    exponent, mantissa = bits >> 24, bits & 0x007FFFFF
    return mantissa << (8 * (exponent - 3)) if exponent >= 3 else mantissa >> (8 * (3 - exponent))


def supply_sats(height: int, interval: int, initial: int) -> int:
    """Coins issued by the schedule up to and including block `height` (the genesis block's 50 counted)."""
    total, era, start = 0, 0, 0
    n = height + 1
    while start < n:
        reward = initial >> era
        if reward == 0:
            break
        count = min(n, start + interval) - start
        total += count * reward
        start += interval
        era += 1
    return total


def headers_frame(inputs, as_of: dt.date | None) -> pd.DataFrame:
    where, params = "", ()
    if as_of:
        end = dt.datetime.combine(as_of + dt.timedelta(days=1), dt.time(), dt.timezone.utc)
        where, params = "time < %s", (end,)
    rows = inputs.rows("bitcoin.block_headers", "height, time, bits", where=where, params=params, order_by="height")
    df = pd.DataFrame(rows, columns=["height", "time", "bits"])
    return df


def final_days(df: pd.DataFrame) -> tuple[pd.Timestamp, pd.Timestamp] | None:
    """The first and last UTC day that can no longer change: no future block may carry a time at or below the
    median time of the last 11 blocks (a consensus rule), so every day ending at or before that median is final."""
    if len(df) < 11:
        return None
    mtp = pd.Timestamp(sorted(df["time"].iloc[-11:])[5])
    last = (mtp.tz_convert("UTC").normalize() - pd.Timedelta(days=1)).tz_localize(None)
    first = pd.Timestamp(df["time"].min()).tz_convert("UTC").normalize().tz_localize(None)
    return (first, last) if last >= first else None


def daily(df: pd.DataFrame, p: dict) -> pd.DataFrame:
    span = final_days(df)
    if span is None:
        return pd.DataFrame()
    first, last = span
    days = pd.date_range(first, last, freq="D")
    d = df.copy()
    d["day"] = pd.to_datetime(d["time"], utc=True).dt.normalize().dt.tz_localize(None)
    d = d[d["day"] <= last]
    d["difficulty"] = [POW_LIMIT / target(int(b)) for b in d["bits"]]
    d["work"] = d["difficulty"] * HASHES_PER_DIFFICULTY
    g = d.groupby("day")
    out = pd.DataFrame(index=days)
    out["blocks"] = g.size().reindex(days, fill_value=0).astype(float)
    # the highest block dated on or before each day (timestamps are not strictly in height order)
    out["height"] = g["height"].max().reindex(days).cummax().ffill()
    last_bits = d.sort_values("height").groupby("day")["difficulty"].last().reindex(days).ffill()
    out["difficulty"] = last_bits
    out["hash_rate"] = g["work"].sum().reindex(days, fill_value=0.0) / 86400 / 1e18     # EH/s, that day's blocks
    for n in p["hash_rate_windows"]:
        out[f"hash_rate_{n}d"] = sma(out["hash_rate"], n)
    sats = out["height"].map(lambda h: supply_sats(int(h), p["halving_interval"], p["initial_subsidy_sats"]))
    out["supply"] = sats / 1e8
    out["issuance"] = out["supply"].diff()
    y = p["year_days"]
    year_ago = out["supply"].shift(y)
    out["issuance_365d"] = out["supply"] - year_ago
    out["inflation_365d"] = out["issuance_365d"] / year_ago
    out["stock_to_flow"] = out["supply"] / out["issuance_365d"]
    nxt = (out["height"] // p["halving_interval"] + 1) * p["halving_interval"]
    out["blocks_to_halving"] = nxt - out["height"]
    rate = out["blocks"].rolling(p["countdown_days"], min_periods=p["countdown_days"]).mean()
    out["days_to_halving"] = out["blocks_to_halving"] / rate
    return out


def compute(inputs, as_of):
    p = inputs.params
    out = daily(headers_frame(inputs, as_of), p)
    if out.empty:
        return {"models.btc_network_series": []}
    price = closes(inputs, as_of, [p["price_pair"]]).get(p["price_pair"])
    if price is not None:
        close = price.reindex(out.index)
        value = out["issuance"] * close
        out["issuance_usd"] = value
        out["puell"] = value / sma(value, p["year_days"])
        out["market_cap"] = out["supply"] * close
    rows = []
    for name in out.columns:
        for day, v in out[name].dropna().items():
            if np.isfinite(v):
                rows.append({"series": name, "day": day.date(), "value": float(v)})
    return {"models.btc_network_series": rows}
