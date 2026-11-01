"""Bitcoin block headers: hashing, targets, the headers message, chain validation, the protocol's message framing,
and a collector run against a stand-in peer, on the real genesis, block 1 and block 2 headers."""
from __future__ import annotations

import datetime as dt

import pytest

from data_platform.collectors.bitcoin_network import collector as col
from data_platform.collectors.bitcoin_network import p2p, parse

BLOCK1 = bytes.fromhex("010000006fe28c0ab6f1b372c1a6a246ae63f74f931e8365e15a089c68d6190000000000982051fd1e4ba744bbbe680e1fee14677ba1a3c3540bf7b1cdb606e857233e0e61bc6649ffff001d01e36299")
BLOCK2 = bytes.fromhex("010000004860eb18bf1b1620e37e9490fc8a427514416fd75159ab86688e9a8300000000d5fdcc541e25de1c7a5addedf24858b8bb665c9f36ef744ee42c316022c90f9bb0bc6649ffff001d08d2bd61")


def headers_message(*headers: bytes) -> bytes:
    return p2p.varint(len(headers)) + b"".join(h + b"\0" for h in headers)


def test_hashes_targets_and_difficulty():
    assert parse.hash_hex(parse.block_hash(parse.GENESIS_HEADER)) == parse.GENESIS_HASH
    assert parse.hash_hex(parse.block_hash(BLOCK1)) == "00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048"
    assert parse.target(0x1D00FFFF) == 0xFFFF << (8 * 26)
    assert parse.difficulty(0x1D00FFFF) == 1.0
    assert parse.difficulty(0x1B0404CB) == pytest.approx(16307.42, rel=1e-6)    # a 2010 retarget, as published
    f = parse.fields(BLOCK1)
    assert f["time"] == 1231469665 and f["bits"] == 0x1D00FFFF and f["prev_hash"] == parse.block_hash(parse.GENESIS_HEADER)


def test_headers_message_and_chain_validation():
    g = parse.genesis_row()
    rows = parse.validate_chain(parse.parse_headers_message(headers_message(BLOCK1, BLOCK2)), 1, g["hash"], g["bits"])
    assert [r["height"] for r in rows] == [1, 2]
    assert rows[1]["time"] == dt.datetime(2009, 1, 9, 2, 55, 44, tzinfo=dt.timezone.utc)
    with pytest.raises(parse.InvalidHeaders, match="link"):
        parse.validate_chain([BLOCK2], 1, g["hash"], g["bits"])               # skips block 1
    tampered = BLOCK1[:-1] + bytes([BLOCK1[-1] ^ 1])                           # a different nonce: no proof of work
    with pytest.raises(parse.InvalidHeaders, match="proof of work"):
        parse.validate_chain([tampered], 1, g["hash"], g["bits"])
    with pytest.raises(parse.InvalidHeaders, match="difficulty"):
        parse.validate_chain([BLOCK1], 1, g["hash"], 0x1C00FFFF)               # bits changed between retargets
    with pytest.raises(parse.InvalidHeaders, match="trailing"):
        parse.parse_headers_message(headers_message(BLOCK1) + b"x")


def test_message_framing():
    assert p2p.message("verack") == bytes.fromhex("f9beb4d9") + b"verack" + b"\0" * 6 + bytes.fromhex("00000000" "5df6e0e2")
    assert p2p.varint(0xFC) == b"\xfc" and p2p.varint(0xFD) == b"\xfd\xfd\x00" and p2p.varint(70000) == b"\xfe\x70\x11\x01\x00"
    gh = p2p.getheaders_payload([parse.block_hash(parse.GENESIS_HEADER)])
    assert len(gh) == 4 + 1 + 32 + 32
    v = p2p.version_payload(now=0, nonce=1)
    assert len(v) == 4 + 8 + 8 + 26 + 26 + 8 + 1 + len(p2p.USER_AGENT) + 4 + 1
    assert p2p.start_height(v) == 0


class FakePeer:
    """Serves block 1 and block 2 after the genesis block, and nothing after block 2."""
    def __init__(self, host):
        self.host = host
    def headers_after(self, locator):
        after = locator[0]
        if after == parse.block_hash(parse.GENESIS_HEADER):
            return headers_message(BLOCK1, BLOCK2)
        if after == parse.block_hash(BLOCK1):
            return headers_message(BLOCK2)
        return headers_message()
    def close(self):
        pass


@pytest.mark.db
def test_a_run_stores_verified_headers_once(conn, store, monkeypatch):
    from data_platform.core.collector import Context

    hosts = iter(["198.51.100.1", "198.51.100.2", "198.51.100.3", "198.51.100.4"])
    monkeypatch.setattr(col.BitcoinNetworkCollector, "connect", lambda self, exclude=frozenset(), min_height=0: FakePeer(next(hosts)))
    monkeypatch.setattr(col, "CONFIRMATIONS", 0)
    c = col.BitcoinNetworkCollector(Context(conn, store, http=None))
    result = c.collect()
    conn.commit()
    assert result.rows_added == 2
    rows = conn.execute("select height, encode(hash, 'hex') h from bitcoin.block_headers order by height").fetchall()
    assert [r["height"] for r in rows] == [0, 1, 2]
    assert bytes.fromhex(rows[2]["h"])[::-1].hex() == "000000006a625f06636b8bb6ac7b960a8d03705d1ace08b1a19da3fdcc99ddbd"
    again = col.BitcoinNetworkCollector(Context(conn, store, http=None)).collect()     # nothing new
    assert again.rows_added == 0
    with pytest.raises(Exception):
        conn.execute("update bitcoin.block_headers set bits = 1 where height = 1")     # append-only


class SilentPeer(FakePeer):
    """Stops answering, as a peer still in its own initial sync does."""
    def headers_after(self, locator):
        raise TimeoutError("timed out")


@pytest.mark.db
def test_a_silent_peer_is_replaced(conn, store, monkeypatch):
    from data_platform.core.collector import Context

    peers = iter([SilentPeer("198.51.100.9"), FakePeer("198.51.100.1"), FakePeer("198.51.100.2")])
    monkeypatch.setattr(col.BitcoinNetworkCollector, "connect", lambda self, exclude=frozenset(), min_height=0: next(peers))
    monkeypatch.setattr(col, "CONFIRMATIONS", 0)
    result = col.BitcoinNetworkCollector(Context(conn, store, http=None)).collect()
    assert result.rows_added == 2
