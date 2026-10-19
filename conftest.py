"""Shared test fixtures, for tests/ and for the tests inside each model plug-in folder (data_platform/models/*/tests).

Database tests need a Postgres server. Point TEST_DATABASE_URL at a database the tests may use to CREATE and DROP
throwaway databases (e.g. postgresql://postgres@127.0.0.1:54321/postgres). Without it, database tests are skipped,
never silently passed.
"""
from __future__ import annotations

import datetime as dt
import os
import uuid
from pathlib import Path

import psycopg
import pytest
from psycopg.rows import dict_row

from data_platform.core import db as dbmod
from data_platform.core.rawstore import LocalRawStore

FIXTURES = Path(__file__).parent / "tests" / "fixtures"


@pytest.fixture
def store(tmp_path) -> LocalRawStore:
    return LocalRawStore(tmp_path / "raw")


@pytest.fixture
def conn():
    admin_url = os.environ.get("TEST_DATABASE_URL")
    if not admin_url:
        pytest.skip("TEST_DATABASE_URL not set")
    name = f"cgp_t_{uuid.uuid4().hex[:10]}"
    with psycopg.connect(admin_url, autocommit=True) as admin:
        admin.execute(f'create database "{name}"')
    url = psycopg.conninfo.make_conninfo(admin_url, dbname=name)
    connection = psycopg.connect(url, row_factory=dict_row)
    dbmod.migrate(connection)
    try:
        yield connection
    finally:
        connection.close()
        with psycopg.connect(admin_url, autocommit=True) as admin:
            admin.execute(f'drop database "{name}" with (force)')


def run_models(conn, names, parameters: dict | None = None):
    """Run models (every active version) in dependency order, with optional parameter overrides per model.
    Returns {model: RunResult}."""
    from data_platform.models import registry
    from data_platform.models.framework import output_owners, run_version

    manifests = registry.load_all()
    owners = output_owners()
    results = {}
    for name in registry.order(manifests):
        if name not in names:
            continue
        for v in manifests[name].active_versions:
            v = v.model_copy(update={"parameters": {**v.parameters, **(parameters or {}).get(name, {})}})
            results[name] = run_version(conn, manifests[name], v, code_version="test", owners=owners)
    return results


# --- crypto models: closes served without a database, for the pure and point-in-time tests ----------------------

class CryptoInputs:
    """Stands in for the framework's Inputs for the crypto models: serves crypto.ohlc_daily rows from memory,
    honouring the two filters those models use (day <= as_of, pair = any(pairs))."""

    def __init__(self, closes: dict[str, dict], params: dict | None = None):
        self.closes = closes                       # {pair: {date: close}}
        self.params = dict(params or {})

    def rows(self, dataset, columns="*", where="", params=(), order_by="", group_by=""):
        assert dataset == "crypto.ohlc_daily", dataset
        args = list(params)
        as_of = args.pop(0) if "day <= %s" in where else None
        pairs = args.pop(0) if "pair = any(%s)" in where else None
        out = []
        for pair in sorted(self.closes):
            if pairs is not None and pair not in pairs:
                continue
            for day in sorted(self.closes[pair]):
                if as_of is None or day <= as_of:
                    out.append({"pair": pair, "day": day, "close": self.closes[pair][day]})
        return out


def synthetic_btc(start=dt.date(2011, 9, 14), end=dt.date(2026, 10, 17), seed=7) -> dict:
    """A bitcoin-like history: a power-law trend, four-year swings and daily noise (deterministic)."""
    import numpy as np

    rng = np.random.default_rng(seed)
    n = (end - start).days + 1
    days = [start + dt.timedelta(days=i) for i in range(n)]
    t = np.array([(d - dt.date(2009, 1, 3)).days for d in days], dtype=float)
    log10 = (-17.0 + 5.8 * np.log10(t) + 0.45 * np.sin(2 * np.pi * (t - 1700) / 1458)
             + np.cumsum(rng.normal(0, 0.004, n)))
    return dict(zip(days, (10.0 ** log10).tolist()))


def model_parameters(name: str) -> dict:
    from data_platform.models.framework import load_manifest

    return dict(load_manifest(name).current.parameters)


def assert_point_in_time(compute, closes: dict, params: dict, cut: dt.date, tables: dict[str, list[str]]):
    """A row for day D must not change when later days arrive: compute on the closes up to `cut` and on all of them,
    and require every row up to `cut` to be identical (and present in both). tables: {table: its key columns}."""
    import math

    before = compute(CryptoInputs(closes, params), cut)
    after = compute(CryptoInputs(closes, params), None)

    def same(a, b):
        if isinstance(a, float) and isinstance(b, float):
            return (math.isnan(a) and math.isnan(b)) or a == b
        return a == b

    for table, key in tables.items():
        early = {tuple(r[k] for k in key): r for r in before[table]}
        late = {tuple(r[k] for k in key): r for r in after[table] if r["day"] <= cut}
        assert early and early.keys() == late.keys(), table
        for k, row in early.items():
            other = late[k]
            assert set(row) == set(other) and all(same(row[c], other[c]) for c in row), (table, k, row, other)
