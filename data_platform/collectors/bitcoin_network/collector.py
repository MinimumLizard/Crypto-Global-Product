"""Bitcoin block headers from the Bitcoin network itself:  python -m data_platform.jobs.collect bitcoin_network

Connects to peers found through the DNS seeds the Bitcoin software uses, asks for headers after the last one
stored (2,000 per message), archives every message before parsing it, verifies every header (parse.validate_chain),
and stores the headers that are at least CONFIRMATIONS blocks below the peer's tip, so a stored block cannot be
reorganised away. Before storing, a second, independent peer must agree on the newest header to be stored.

First run: the whole chain from block 1 (about 975,000 headers, some 80 MB, a few minutes). Later runs: the day's
new blocks. Nobody owns the network's record and no terms apply (config/sources.yaml: bitcoin_network).
"""
from __future__ import annotations

import datetime as dt

from ...core import db
from ...core.collector import Collector, Result
from . import p2p, parse

CONFIRMATIONS = 6
MAX_MESSAGES = 600          # a full first run needs about 490


def store(conn, rows: list[dict], fetch_id: int, sha256: str, fetched_at: dt.datetime) -> tuple[int, int]:
    rows = [dict(r, raw_sha256=sha256, fetch_id=fetch_id, fetched_at=fetched_at) for r in rows]
    return db.insert_facts(conn, "bitcoin.block_headers", rows, key=["height"], fetch_id=fetch_id,
                           compare_ignore=("fetch_id", "fetched_at", "ingested_at", "raw_sha256"))


class BitcoinNetworkCollector(Collector):
    source_id = "bitcoin_network"
    job = "collect"

    def tip(self) -> dict | None:
        return self.ctx.conn.execute(
            "select height, hash, bits from bitcoin.block_headers order by height desc limit 1").fetchone()

    def archive(self, peer: str, locator: bytes, payload: bytes) -> tuple[int, str]:
        fetch_id, sha = db.record_fetch(
            self.ctx.conn, self.ctx.store, source_id=self.source_id, method="P2P getheaders",
            url=f"bitcoin-p2p://{peer}", params={"after": parse.hash_hex(locator)}, http_status=200, body=payload,
            content_type="application/octet-stream", fetched_at=dt.datetime.now(dt.timezone.utc),
            run_id=self.ctx.run_id, ext="bin")
        self.ctx.conn.commit()          # raw first: a later failure can never lose what was fetched
        self.fetches += 1
        return fetch_id, sha

    def connect(self, exclude: set[str] = frozenset()) -> p2p.Peer:
        errors = []
        for host in p2p.peer_addresses():
            if host in exclude:
                continue
            try:
                peer = p2p.Peer(host)
                peer.handshake()
                return peer
            except OSError as exc:
                errors.append(f"{host}: {type(exc).__name__}")
            except p2p.P2PError as exc:
                errors.append(f"{host}: {exc}")
            if len(errors) >= 12:
                break
        raise RuntimeError("no Bitcoin peer answered: " + "; ".join(errors[:6]))

    def collect(self) -> Result:
        tip = self.tip()
        if tip is None:
            g = parse.genesis_row()
            fetch_id, sha = db.record_fetch(
                self.ctx.conn, self.ctx.store, source_id=self.source_id, method="constant", url="bitcoin-genesis",
                params={}, http_status=200, body=parse.GENESIS_HEADER, content_type="application/octet-stream",
                fetched_at=self.ctx.now, run_id=self.ctx.run_id, ext="bin")
            store(self.ctx.conn, [g], fetch_id, sha, self.ctx.now)
            self.ctx.conn.commit()
            tip = {"height": 0, "hash": g["hash"], "bits": g["bits"]}

        peer = self.connect()
        try:
            batches = []          # (fetch_id, sha256, rows)
            height, prev_hash, prev_bits = tip["height"] + 1, bytes(tip["hash"]), tip["bits"]
            for _ in range(MAX_MESSAGES):
                payload = peer.headers_after([prev_hash])
                fetch_id, sha = self.archive(peer.host, prev_hash, payload)
                rows = parse.validate_chain(parse.parse_headers_message(payload), height, prev_hash, prev_bits)
                if not rows:
                    break
                batches.append((fetch_id, sha, rows))
                height += len(rows)
                prev_hash, prev_bits = rows[-1]["hash"], rows[-1]["bits"]
                if len(rows) < 2000:
                    break
        finally:
            peer.close()

        all_rows = [r for _, _, rows in batches for r in rows]
        keep_to = (all_rows[-1]["height"] - CONFIRMATIONS) if all_rows else tip["height"]
        if keep_to <= tip["height"]:
            return Result(rows_added=0, new_data=False, message=f"no new headers deeper than {CONFIRMATIONS} blocks (tip {tip['height']})")

        # a second, independent peer must have the same block at the newest height we are about to store
        newest = next(r for r in all_rows if r["height"] == keep_to)
        before = next((r for r in all_rows if r["height"] == keep_to - 1), None)
        check = self.connect(exclude={peer.host})
        try:
            reply = parse.parse_headers_message(check.headers_after([before["hash"] if before else bytes(tip["hash"])]))
        finally:
            check.close()
        if not reply or parse.block_hash(reply[0]) != newest["hash"]:
            raise RuntimeError(f"a second peer ({check.host}) disagrees about block {keep_to}; nothing stored")

        added = 0
        for fetch_id, sha, rows in batches:
            kept = [r for r in rows if r["height"] <= keep_to]
            if kept:
                n, _ = store(self.ctx.conn, kept, fetch_id, sha, self.ctx.now)
                added += n
        return Result(rows_added=added, new_data=bool(added),
                      message=f"{added} block headers added up to block {keep_to} ({self.fetches} messages; peers {peer.host}, {check.host})")
