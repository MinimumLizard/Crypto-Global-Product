"""btc_network: the issuance schedule, a synthetic chain's daily measures, the final-day rule, and rows that never
change when later blocks arrive."""
from __future__ import annotations

import datetime as dt

import pytest

from conftest import CryptoInputs, model_parameters
from data_platform.models.btc_network import compute as bn

GENESIS = dt.datetime(2009, 1, 3, 18, 15, 5, tzinfo=dt.timezone.utc)


class NetworkInputs(CryptoInputs):
    """Headers every ten minutes from the genesis time (difficulty 1), plus optional closes."""

    def __init__(self, blocks: int, closes=None, params=None, step_minutes=10):
        super().__init__(closes or {}, params or model_parameters("btc_network"))
        self.headers = [{"height": h, "time": GENESIS + dt.timedelta(minutes=step_minutes * h), "bits": 0x1D00FFFF}
                        for h in range(blocks)]

    def rows(self, dataset, columns="*", where="", params=(), order_by="", group_by=""):
        if dataset == "bitcoin.block_headers":
            end = params[0] if "time < %s" in where else None
            return [r for r in self.headers if end is None or r["time"] < end]
        return super().rows(dataset, columns, where, params, order_by, group_by)


def test_the_issuance_schedule():
    assert bn.supply_sats(0, 210000, 50 * 10**8) == 50 * 10**8
    assert bn.supply_sats(209999, 210000, 50 * 10**8) == 210000 * 50 * 10**8
    assert bn.supply_sats(210000, 210000, 50 * 10**8) == 210000 * 50 * 10**8 + 25 * 10**8
    total = bn.supply_sats(10**8, 210000, 50 * 10**8)              # long after the last halving
    assert total == 2099999997690000                               # the well-known final supply in satoshis


def test_daily_measures_on_a_regular_chain():
    p = model_parameters("btc_network")
    out = bn.compute(NetworkInputs(144 * 40), None)                 # 40 days of blocks
    rows = {(r["series"], r["day"]): r["value"] for r in out["models.btc_network_series"]}
    d = dt.date(2009, 1, 20)
    assert rows[("blocks", d)] == 144
    h = rows[("height", d)]
    assert rows[("supply", d)] == pytest.approx((h + 1) * 50)
    assert rows[("issuance", d)] == pytest.approx(144 * 50)
    assert rows[("difficulty", d)] == 1.0
    assert rows[("hash_rate", d)] == pytest.approx(144 * 2**32 / 86400 / 1e18)
    assert rows[("blocks_to_halving", d)] == 210000 - h
    assert rows[("days_to_halving", d)] == pytest.approx((210000 - h) / 144)
    days = sorted({k[1] for k in rows})
    last_time = GENESIS + dt.timedelta(minutes=10 * (144 * 40 - 1))
    assert days[-1] < last_time.date()                              # the day still open is not published
    assert ("inflation_365d", d) not in rows and p["year_days"] == 365


def test_puell_and_market_value_use_the_close():
    closes = {"btcusd": {dt.date(2009, 1, 3) + dt.timedelta(days=k): 1.0 + k for k in range(60)}}
    out = bn.compute(NetworkInputs(144 * 40, closes=closes, params=model_parameters("btc_network")), None)
    rows = {(r["series"], r["day"]): r["value"] for r in out["models.btc_network_series"]}
    d = dt.date(2009, 1, 20)
    assert rows[("market_cap", d)] == pytest.approx(rows[("supply", d)] * closes["btcusd"][d])
    assert rows[("issuance_usd", d)] == pytest.approx(144 * 50 * closes["btcusd"][d])


def test_rows_never_change_when_later_blocks_arrive():
    p = model_parameters("btc_network")

    full = NetworkInputs(144 * 120, params=p)
    early = bn.compute(full, dt.date(2009, 3, 1))["models.btc_network_series"]
    late = {(r["series"], r["day"]): r["value"] for r in bn.compute(full, None)["models.btc_network_series"]}
    assert early
    for r in early:
        assert late[(r["series"], r["day"])] == r["value"], r
