"""The gap check classifies holes correctly: a real gap (2026-10-05-style), an unlisted holiday, an explained hole."""
from __future__ import annotations

import datetime as dt

import pytest

from data_platform.core import db
from data_platform.jobs import gapcheck


def test_calendar_skips_weekends_and_closures(tmp_path):
    (tmp_path / "x.yaml").write_text("name: X\nstarts: 2026-10-01\nclosures:\n  2026-10-06: {reason: test}\n")
    cal = gapcheck.load_calendar("x", tmp_path)
    assert cal.business_days(dt.date(2026, 10, 1), dt.date(2026, 10, 9)) == [
        dt.date(2026, 10, d) for d in (1, 2, 5, 7, 8, 9)]
    assert cal.back(dt.date(2026, 10, 7), 1) == dt.date(2026, 10, 5)      # skips the closure


def test_a_market_that_never_closes_counts_weekends(tmp_path):
    (tmp_path / "c.yaml").write_text("name: C\nstarts: 2026-10-01\nevery_day: true\nclosures: {}\n")
    cal = gapcheck.load_calendar("c", tmp_path)
    assert len(cal.business_days(dt.date(2026, 10, 1), dt.date(2026, 10, 7))) == 7
    assert cal.back(dt.date(2026, 10, 5), 1) == dt.date(2026, 10, 4)      # a Sunday


@pytest.mark.db
def test_a_missing_crypto_day_is_missing_not_a_holiday(conn, store, tmp_path):
    (tmp_path / "crypto.yaml").write_text("name: C\nstarts: 2026-10-01\nevery_day: true\nclosures: {}\n")
    now = dt.datetime.now(dt.timezone.utc)
    fetch_id, sha = db.record_fetch(conn, store, source_id="bitstamp", method="GET", url="https://x/", params={},
                                    http_status=200, body=b"{}", content_type=None, fetched_at=now)
    for d in (1, 2, 3, 5):                                                # the 4th (a Sunday) is missing
        conn.execute("""insert into crypto.ohlc_daily (pair, day, open, high, low, close, volume, raw_sha256, fetch_id,
                        fetched_at) values ('btcusd', %s, 1, 1, 1, 1, 0, %s, %s, %s)""",
                     (dt.date(2026, 10, d), sha, fetch_id, now))
    datasets = {"c": {"table": "crypto.ohlc_daily", "date_column": "day", "calendar": "crypto",
                      "starts": dt.date(2026, 10, 1), "grace_days": 1}}
    found = gapcheck.check(conn, dt.date(2026, 10, 6), datasets, tmp_path)
    assert [(f["day"].day, f["status"]) for f in found] == [(4, "missing")]


@pytest.mark.db
def test_gap_classification(conn, tmp_path):
    """A weekday market (as equity and macro data will be): a hole other datasets prove was a session is missing;
    a hole nothing has is an unconfirmed closure; a listed hole is acknowledged. Scratch tables stand in for them."""
    (tmp_path / "exchange.yaml").write_text("name: Exchange\nstarts: 2026-10-01\nclosures: {}\n")
    for t in ("t_prices", "t_market"):
        conn.execute(f"create temp table {t} (day date not null)")
    # market rows exist for every weekday 1-9 Oct but the 8th; prices are missing on the 5th (a real gap) and the
    # 7th (acknowledged); nothing at all exists for the 8th (an unlisted holiday?).
    for d in (1, 2, 5, 6, 7, 9):
        conn.execute("insert into t_market (day) values (%s)", (dt.date(2026, 10, d),))
    for d in (1, 2, 6, 9):
        conn.execute("insert into t_prices (day) values (%s)", (dt.date(2026, 10, d),))
    datasets = {
        "prices": {"table": "t_prices", "date_column": "day", "calendar": "exchange",
                   "starts": dt.date(2026, 10, 1), "grace_days": 1, "witnesses": ["market"],
                   "acknowledged": {dt.date(2026, 10, 7): "explained"}},
        "market": {"table": "t_market", "date_column": "day", "calendar": "exchange",
                   "starts": dt.date(2026, 10, 1), "grace_days": 1},
    }
    found = {(f["dataset"], f["day"].day): f["status"]
             for f in gapcheck.check(conn, dt.date(2026, 10, 12), datasets, tmp_path)}
    assert found[("prices", 5)] == "missing"
    assert found[("prices", 7)] == "acknowledged"
    assert found[("prices", 8)] == "unconfirmed_closure"
    assert found[("market", 8)] == "unconfirmed_closure"
    assert ("prices", 9) not in found and ("prices", 12) not in found       # present; and inside the grace period


def test_real_config_is_consistent():
    datasets = gapcheck.load_datasets()
    for key, cfg in datasets.items():
        gapcheck.load_calendar(cfg["calendar"])
        for w in cfg.get("witnesses", []):
            assert w in datasets, f"{key}: unknown witness {w}"
            assert datasets[w]["calendar"] == cfg["calendar"], f"{key}: witness {w} is another market"
