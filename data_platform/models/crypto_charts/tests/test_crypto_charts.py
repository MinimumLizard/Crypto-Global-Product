"""crypto_charts: each line checked against a calculation by hand, and rows that never change when later days arrive."""
from __future__ import annotations

import datetime as dt

import numpy as np
import pandas as pd
import pytest

from conftest import CryptoInputs, assert_point_in_time, model_parameters, run_models, synthetic_btc
from data_platform.models.crypto_charts import compute as cc


def daily(values, start=dt.date(2026, 1, 5)) -> pd.Series:      # 2026-01-05 is a Monday
    return pd.Series(values, index=pd.date_range(start, periods=len(values), freq="D"), dtype=float)


def test_wilder_rsi_by_hand():
    v = np.array([10.0, 11.0, 10.0, 12.0, 11.0])                    # changes +1, -1, +2, -1
    r = cc.wilder_rsi(v, 2)
    assert np.isnan(r[:2]).all()
    assert r[2] == pytest.approx(100 - 100 / (1 + 0.5 / 0.5))         # seed: gains (1, 0), losses (0, 1)
    g, l = (0.5 * 1 + 2) / 2, (0.5 * 1 + 0) / 2                        # one Wilder step with +2
    assert r[3] == pytest.approx(100 - 100 / (1 + g / l))
    assert cc.wilder_rsi(np.array([1.0, 2.0, 3.0]), 2)[2] == 100.0     # no losses


def test_weekly_rsi_uses_sunday_closes_and_todays_close():
    rng = np.random.default_rng(1)
    s = daily(100 + np.cumsum(rng.normal(0, 1, 7 * 30)))
    w = cc.weekly_rsi(s, 3)
    sundays = s[s.index.dayofweek == 6]
    on_sundays = cc.wilder_rsi(sundays.to_numpy(), 3)
    for i, day in enumerate(sundays.index):
        if not np.isnan(on_sundays[i]):
            assert w.loc[day] == pytest.approx(on_sundays[i])          # a Sunday: the completed week's RSI
    wed = pd.Timestamp("2026-04-15")                                    # a Wednesday: previous Sundays + today
    seq = np.append(sundays[sundays.index < wed].to_numpy(), s.loc[wed])
    assert w.loc[wed] == pytest.approx(cc.wilder_rsi(seq, 3)[-1])
    assert np.isnan(w.iloc[: 7 * 2]).all()                              # too few weekly changes


def test_macd_bollinger_returns_and_risk_on_a_long_history():
    closes = synthetic_btc()
    s = pd.Series(closes).sort_index()
    s.index = pd.DatetimeIndex(s.index)
    p = model_parameters("crypto_charts")
    out = cc.lines(s.asfreq("D"), p)
    day = pd.Timestamp("2024-06-03")
    v = s.loc[:day].to_numpy()

    def ema(x, n):
        e = x[:n].mean()
        for y in x[n:]:
            e = 2 / (n + 1) * y + (1 - 2 / (n + 1)) * e
        return e
    assert out["macd"].loc[day] == pytest.approx(ema(v, 12) - ema(v, 26))
    window = v[-20:]
    assert out["bb_upper"].loc[day] == pytest.approx(window.mean() + 2 * window.std(ddof=0))
    assert out["bb_width"].loc[day] == pytest.approx(4 * window.std(ddof=0) / window.mean())
    assert out["sma_350"].loc[day] == pytest.approx(v[-350:].mean())
    assert out["roi_1460d"].loc[day] == pytest.approx(v[-1] / v[-1461] - 1)
    assert out["ret_ytd"].loc[day] == pytest.approx(v[-1] / s.loc["2023-12-31"] - 1)
    lr = np.diff(np.log(v))[-365:]
    assert out["sharpe_365d"].loc[day] == pytest.approx(lr.mean() * 365 / (lr.std(ddof=1) * np.sqrt(365)))
    downside = np.sqrt(np.mean(np.minimum(lr, 0) ** 2)) * np.sqrt(365)
    assert out["sortino_365d"].loc[day] == pytest.approx(lr.mean() * 365 / downside)
    q = out["ret_quarter"].dropna()
    assert pd.Timestamp("2024-03-31") in q.index and pd.Timestamp("2024-04-30") not in q.index
    assert q.loc["2024-03-31"] == pytest.approx(s.loc["2024-03-31"] / s.loc["2023-12-31"] - 1)
    assert np.isnan(out["macd_signal"].iloc[:26 + 9 - 2]).all() and not np.isnan(out["macd_signal"].iloc[26 + 9 - 2])


def test_quarters_appear_only_once_complete():
    s = daily(np.linspace(100, 200, 120), start=dt.date(2026, 1, 1))  # Q1 and part of Q2
    q = cc.quarterly(s)
    assert list(q.index) == []                                          # Q1 is the first: no previous quarter
    s2 = daily(np.linspace(100, 300, 200), start=dt.date(2025, 10, 1))  # Q4 2025, Q1 2026, part of Q2
    q2 = cc.quarterly(s2)
    assert list(q2.index) == [pd.Timestamp("2026-03-31")]


def test_relations_to_bitcoin():
    btc = synthetic_btc(start=dt.date(2020, 1, 1), end=dt.date(2022, 12, 31))
    eth = synthetic_btc(start=dt.date(2020, 1, 1), end=dt.date(2022, 12, 31), seed=3)
    out = cc.compute(CryptoInputs({"btcusd": btc, "ethusd": eth}, model_parameters("crypto_charts")), None)
    rows = {(r["pair"], r["series"], r["day"]): r["value"] for r in out["models.crypto_charts_series"]}
    d = dt.date(2022, 6, 30)
    assert rows[("ethusd", "price_btc", d)] == pytest.approx(eth[d] / btc[d])
    days = [d - dt.timedelta(days=k) for k in range(91)][::-1]
    re = np.diff(np.log([eth[x] for x in days]))
    rb = np.diff(np.log([btc[x] for x in days]))
    assert rows[("ethusd", "corr_btc_90d", d)] == pytest.approx(np.corrcoef(re, rb)[0, 1])
    assert ("btcusd", "price_btc", d) not in rows and ("btcusd", "rsi_14d", d) in rows


def test_rows_never_change_when_later_days_arrive():
    closes = {"btcusd": synthetic_btc(start=dt.date(2016, 1, 1)), "ethusd": synthetic_btc(start=dt.date(2017, 8, 16), seed=3)}
    tables = {"models.crypto_charts_series": ["pair", "series", "day"]}
    for cut in (dt.date(2021, 11, 30), dt.date(2025, 10, 7)):
        assert_point_in_time(cc.compute, closes, model_parameters("crypto_charts"), cut, tables)


@pytest.mark.db
def test_the_model_runs_on_the_database(conn, store):
    from data_platform.collectors.bitstamp.collector import store as store_candles
    from data_platform.core import db

    now = dt.datetime(2026, 10, 18, 1, tzinfo=dt.timezone.utc)
    fetch_id, sha = db.record_fetch(conn, store, source_id="bitstamp", method="GET", url="https://x/", params={},
                                    http_status=200, body=b"{}", content_type="application/json", fetched_at=now)
    history = synthetic_btc(start=dt.date(2020, 1, 1), end=dt.date(2025, 6, 30))   # long enough for every line
    store_candles(conn, [{"pair": "btcusd", "day": d, "open": c, "high": c, "low": c, "close": c, "volume": 1.0}
                         for d, c in history.items()], fetch_id, sha, now)
    conn.commit()
    run_models(conn, ["crypto_charts"])
    n = conn.execute("select count(distinct series) n from models.crypto_charts_series").fetchone()["n"]
    assert n == 18                                       # every line but the three against bitcoin
