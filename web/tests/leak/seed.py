"""Seed a throwaway database for the tier-leak tests (web/tests/leak). Run from the repository root:

    TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:5432/postgres uv run python web/tests/leak/seed.py

Creates (or recreates) the database `cgp_leak` (or $LEAK_DB_NAME), applies every migration, and writes a small,
consistent set of model outputs in which certain values are MARKERS: numbers that appear nowhere else, so the tests
can tell exactly which model's data reached a page, an API response or an e-mail. Dates are UTC days, as on the site:
NEW (yesterday), OLD (seven days ago, the last day the crypto cycle model's 7-day free preview may show) and MID (six
days ago, inside that delay, which a preview must never show). Rows under a reference version, and an unpublished
statistic, must never be shown to anyone.

Prints the database URL the web app should use (as the read-only web_reader role).
"""
from __future__ import annotations

import datetime as dt
import json
import os
import sys
from pathlib import Path
from urllib.parse import quote

import psycopg
from psycopg.rows import dict_row

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

from data_platform.core import db  # noqa: E402
from data_platform.models.framework import write_table  # noqa: E402
from data_platform.models.registry import load_all  # noqa: E402

TODAY = dt.datetime.now(dt.timezone.utc).date()      # the site's day (web/lib/time.ts: UTC)
NEW = TODAY - dt.timedelta(days=1)
OLD = TODAY - dt.timedelta(days=7)    # the crypto cycle preview's last visible day (delay 7 days)
MID = TODAY - dt.timedelta(days=6)    # inside that delay: never visible to a free visitor
MARKERS = Path(__file__).with_name("markers.json")
DB_NAME = os.environ.get("LEAK_DB_NAME", "cgp_leak")   # another name lets two checkouts test at once


def seed(conn) -> dict:
    manifests = load_all()
    current = {name: m.current.method_version for name, m in manifests.items()}
    run_id = conn.execute("insert into models.runs (model, method_version, code_version) values ('seed', '0', 'leak') "
                          "returning run_id").fetchone()["run_id"]

    def put(model: str, table: str, rows: list[dict], version: str | None = None):
        write_table(conn, table, rows, method_version=version or current[model], run_id=run_id, model=model)

    # Crypto: prices (free), cycles (Plus, a 7-day free preview), trend bands (Pro).
    def market(day, close):
        return {"day": day, "close": close, "ret_1d": 0.01, "ret_7d": 0.02, "ret_30d": 0.03, "ret_1y": 0.04,
                "ath_close": 150000.0, "ath_day": "2025-10-06", "drawdown": close / 150000.0 - 1, "days_since_ath": 300,
                "vol_30d": 0.4, "vol_90d": 0.5}
    put("crypto_market", "models.crypto_market_daily", [
        {"pair": "btcusd", **market(d, c)} for d, c in ((OLD, 66666.21), (MID, 67676.21), (NEW, 77777.31))] + [
        {"pair": "ethusd", **market(d, c)} for d, c in ((OLD, 2222.41), (NEW, 2323.41))] + [
        {"pair": "ethbtc", **market(d, c)} for d, c in ((OLD, 0.031113), (NEW, 0.032223))])
    put("crypto_cycle", "models.crypto_cycle_daily", [
        {"pair": "btcusd", "day": d, "close": c, "sma_50": 70000.0, "sma_200": 71000.0, "mayer": 1.1, "sma_200w": w,
         "sma_200w_chg_4w": 0.02, "sma_20w": 72000.0, "ema_21w": 73000.0, "dist_20w": 0.05, "last_halving": "2024-04-20",
         "days_since_halving": 900, "roi_since_halving": 0.2, "ret_mtd": 0.01}
        for d, c, w in ((OLD, 66666.21, 33333.19), (MID, 67676.21, 44444.13), (NEW, 77777.31, 55555.17))])
    put("crypto_cycle", "models.crypto_cycle_anchor", [
        {"pair": "btcusd", "day": d, "kind": "halving", "epoch": 4, "anchor_day": "2024-04-20", "anchor_close": a,
         "roi": 0.1, "days_since": 900, "provisional": False}
        for d, a in ((OLD, 61616.11), (MID, 62626.11), (NEW, 63636.11))])
    put("crypto_trend_bands", "models.crypto_trend_band", [
        {"pair": "btcusd", "day": d, "fit": fit, "intercept": -16.2, "slope": 5.6, "n_obs": 5000, "resid_sd": 0.28,
         "close": 77777.31, "fitted": f, "lower_1": f / 2, "upper_1": f * 2, "lower_2": f / 4, "upper_2": f * 4,
         "position": 0.4}
        for d, f in ((OLD, 98765.43), (NEW, 123456.78)) for fit in ("power_law", "log_regression")])

    # A reference version beside the current one, and an unpublished statistic: shown to nobody.
    put("crypto_market", "models.crypto_market_daily", [{"pair": "btcusd", **market(NEW, 97979.79)}], version="0.9.0")
    put("crypto_cycle", "models.crypto_cycle_daily", [
        {"pair": "btcusd", "day": NEW, "close": 77777.31, "mayer": 1.1, "sma_200w": 96969.69}], version="0.9.0")
    put("crypto_cycle", "models.model_stats", [{"stat_key": "example_unpublished_stat", "value": 31.4159, "n": 99}])
    conn.commit()

    # What each model's data looks like in an API response (raw) and on a page (formatted, as lib/format.ts does).
    return {
        "today": TODAY.isoformat(), "new": NEW.isoformat(), "old": OLD.isoformat(), "mid": MID.isoformat(),
        # history beyond a model's recent window (config/entitlements.yaml); no current model has one
        "recent_window": {},
        "models": {
            "crypto_market": {"new": {"api": ["77777.31"], "page": ["$77,777.31"]}, "old": {"api": [], "page": []}},
            "crypto_cycle": {"new": {"api": ["55555.17", "63636.11"], "page": ["$55,555.17"]},
                             "mid": {"api": ["44444.13", "62626.11"], "page": ["$44,444.13"]},
                             "old": {"api": ["33333.19", "61616.11"], "page": ["$33,333.19"]}},
            "crypto_trend_bands": {"new": {"api": ["123456.78"], "page": ["$123,456.78"]},
                                  "old": {"api": ["98765.43"], "page": ["$98,765.43"]}},
        },
        # bitcoin's own page (formatted as that page shows it): each part only to the tiers that include it
        "crypto_page": {"crypto_market": {"new": ["$77,777.31"], "old": []},
                        "crypto_cycle": {"new": ["$55,555.17", "$63,636.11"], "mid": ["$44,444.13", "$62,626.11"],
                                         "old": ["$33,333.19", "$61,616.11"]},
                        "crypto_trend_bands": {"new": ["$123,456.78"], "old": ["$98,765.43"]}},
        # the weekly e-mail (as /email/crypto shows it): each tier's figures, and no delayed preview in an e-mail.
        # The first value is the one a subscriber with the tier sees; the rest must never appear.
        "email": {"crypto_market": ["$77,777.31"],
                  "crypto_cycle": ["$55,555.17", "$44,444.13", "$33,333.19"],
                  "crypto_trend_bands": ["$123,456.78", "$98,765.43"]},
        # reference versions and unpublished statistics: never shown to anyone, raw or formatted
        "never": ["97979.79", "$97,979.79", "96969.69", "$96,969.69", "31.4159", "31.42"],
    }


def main() -> int:
    admin = os.environ["TEST_DATABASE_URL"]
    with psycopg.connect(admin, autocommit=True) as c:
        c.execute(f'drop database if exists "{DB_NAME}" with (force)')
        c.execute(f'create database "{DB_NAME}"')
    url = psycopg.conninfo.make_conninfo(admin, dbname=DB_NAME)
    conn = psycopg.connect(url, row_factory=dict_row)
    db.migrate(conn)
    conn.execute("alter role web_reader with login")
    password = os.environ.get("WEB_READER_PASSWORD")
    if password:
        conn.execute(psycopg.sql.SQL("alter role web_reader with password {}").format(psycopg.sql.Literal(password)))
    markers = seed(conn)
    MARKERS.write_text(json.dumps(markers, indent=2) + "\n")
    parts = psycopg.conninfo.conninfo_to_dict(url)
    secret = f":{quote(password, safe='')}" if password else ""
    print(f"postgresql://web_reader{secret}@{parts.get('host', 'localhost')}:{parts.get('port', 5432)}/{DB_NAME}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
