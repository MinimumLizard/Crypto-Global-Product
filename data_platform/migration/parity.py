"""Parity: prove that a ported model reproduces the old tool it replaces (docs/architecture.md §15).

The shared pieces every parity check uses:
  * close() / compare(): the tolerance rule. Text, counts and dates must match exactly; floating point within 1e-9
    (absolute or relative), unless a model states otherwise with a reason.
  * run_chain(): run models in dependency order, in memory. Nothing is written to the model tables: each model's
    outputs go to a temporary table its dependants read instead. Also used by `jobs.models --as-of`.

The per-tool parity check for the old Crypto terminal (docs/audit.md §8) is added beside this module when its port
is approved; it compares against the old code run from a read-only clone, as the shared platform's earlier parity
checks did. Reports (counts and differences only, never data) go to docs/migration/.
"""
from __future__ import annotations

import datetime as dt
import math

from ..models import registry
from ..models.framework import Inputs, _coerce, compute_function, output_owners, table_info

TOL = 1e-9


def close(a, b, tol: float = TOL) -> bool:
    if a is None or b is None:
        return a is None and b is None
    if isinstance(a, bool) or isinstance(b, bool):
        return bool(a) == bool(b)
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        a, b = float(a), float(b)
        if math.isnan(a) or math.isnan(b):
            return math.isnan(a) and math.isnan(b)
        return abs(a - b) <= tol or abs(a - b) <= tol * max(abs(a), abs(b))
    return _text(a) == _text(b)


def _text(v):
    return v.isoformat() if isinstance(v, (dt.date, dt.datetime)) else v


def compare(name: str, old: dict, new: dict, columns: list[str], tol: float = TOL) -> dict:
    """old/new: {key: {column: value}}. Every key and every value must agree."""
    missing = [k for k in old if k not in new]
    extra = [k for k in new if k not in old]
    differ, worst = [], 0.0
    for k in old:
        if k not in new:
            continue
        for c in columns:
            a, b = old[k].get(c), new[k].get(c)
            if isinstance(a, (int, float)) and isinstance(b, (int, float)) and not isinstance(a, bool):
                worst = max(worst, abs(float(a) - float(b)))
            if not close(a, b, tol):
                differ.append((k, c, a, b))
    return {"table": name, "old_rows": len(old), "new_rows": len(new), "missing_in_new": len(missing),
            "extra_in_new": len(extra), "values_differ": len(differ), "max_abs_difference": worst,
            "examples": {"missing": [list(map(str, k)) for k in missing[:3]],
                         "extra": [list(map(str, k)) for k in extra[:3]],
                         "differ": [[list(map(str, k)), c, str(a), str(b)] for k, c, a, b in differ[:5]]},
            "ok": not missing and not extra and not differ}


# --- running the models in memory -----------------------------------------------------------------------------

def run_chain(conn, names: list[str], parameter_overrides: dict[str, dict] | None = None, *,
              as_of=None, pick=None) -> dict[str, list[dict]]:
    """Run models in dependency order, in memory: nothing is written; each model's outputs go to a temporary table
    its dependants read instead. By default each model's parity version (the one with a `parity` block); `pick`
    chooses another (e.g. the current one), `as_of` limits every input to that date."""
    manifests = registry.load_all()
    owners = output_owners()
    relations: dict[str, str] = {}
    results: dict[str, list[dict]] = {}
    for name in registry.order(manifests):
        if name not in names:
            continue
        m = manifests[name]
        version = pick(m) if pick else next(v for v in m.versions if v.parity is not None)
        params = {**version.parameters, **(parameter_overrides or {}).get(name, {})}
        version = version.model_copy(update={"parameters": params})
        outputs = compute_function(name)(Inputs(conn, m, version, owners, relations), as_of)
        for table, rows in outputs.items():
            results[table] = rows
            if table == "models.model_stats":
                continue
            temp = "parity_" + table.split(".", 1)[1]
            conn.execute(f"create temp table if not exists {temp} (like {table})")
            conn.execute(f"alter table {temp} alter column run_id drop not null")
            conn.execute(f"truncate {temp}")
            info = table_info(conn, table)
            cols = [c for c in info.columns if c != "run_id"]
            with conn.cursor() as cur, cur.copy(f"copy {temp} ({', '.join(cols)}) from stdin") as cp:
                for r in rows:
                    full = {**r, "method_version": version.method_version}
                    cp.write_row([_coerce(full.get(c), info.columns[c]) for c in cols])
            relations[table] = temp
    return results
