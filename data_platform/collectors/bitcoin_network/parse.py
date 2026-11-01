"""Bitcoin block headers: pure functions, bytes in, rows out (no network, no database).

A block header is 80 bytes: version, the previous block's hash, the merkle root, the time, the difficulty target in
compact form ("bits") and the nonce. Its hash is SHA-256 applied twice. Headers are self-proving: anyone can check
that each one carries enough proof of work for its own target and links to the one before, so they can be taken
from any peer of the Bitcoin network and verified here, without trusting the peer and without anyone's licence.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import struct

HEADER_BYTES = 80
RETARGET_BLOCKS = 2016
POW_LIMIT_BITS = 0x1D00FFFF
GENESIS_HEADER = bytes.fromhex(
    "01000000" + "00" * 32
    + "3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a" + "29ab5f49" + "ffff001d" + "1dac2b7c")
GENESIS_HASH = "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"


class InvalidHeaders(ValueError):
    """Headers that fail a check: never stored."""


def sha256d(b: bytes) -> bytes:
    return hashlib.sha256(hashlib.sha256(b).digest()).digest()


def block_hash(header: bytes) -> bytes:
    """The hash in internal byte order (as the next header's prev-hash field holds it)."""
    return sha256d(header)


def hash_hex(h: bytes) -> str:
    """The usual display form: byte-reversed hex."""
    return h[::-1].hex()


def target(bits: int) -> int:
    """The 256-bit target encoded by a compact 'bits' value."""
    exponent, mantissa = bits >> 24, bits & 0x007FFFFF
    if bits & 0x00800000:
        raise InvalidHeaders(f"negative target in bits {bits:#x}")
    return mantissa << (8 * (exponent - 3)) if exponent >= 3 else mantissa >> (8 * (3 - exponent))


def difficulty(bits: int) -> float:
    """How many times harder than the easiest allowed target (bits 0x1d00ffff, difficulty 1)."""
    return target(POW_LIMIT_BITS) / target(bits)


def fields(header: bytes) -> dict:
    if len(header) != HEADER_BYTES:
        raise InvalidHeaders(f"a header is {HEADER_BYTES} bytes, got {len(header)}")
    version, = struct.unpack_from("<i", header, 0)
    time, bits, nonce = struct.unpack_from("<III", header, 68)
    return {"version": version, "prev_hash": header[4:36], "merkle_root": header[36:68], "time": time,
            "bits": bits, "nonce": nonce}


def read_varint(b: bytes, i: int) -> tuple[int, int]:
    first = b[i]
    if first < 0xFD:
        return first, i + 1
    size = {0xFD: 2, 0xFE: 4, 0xFF: 8}[first]
    return int.from_bytes(b[i + 1:i + 1 + size], "little"), i + 1 + size


def parse_headers_message(payload: bytes) -> list[bytes]:
    """The 80-byte headers in a `headers` message: a count, then each header followed by a zero transaction count."""
    count, i = read_varint(payload, 0)
    out = []
    for _ in range(count):
        header = payload[i:i + HEADER_BYTES]
        if len(header) != HEADER_BYTES:
            raise InvalidHeaders("truncated headers message")
        out.append(header)
        tx_count, i = read_varint(payload, i + HEADER_BYTES)
        if tx_count != 0:
            raise InvalidHeaders("a headers message carries no transactions")
    if i != len(payload):
        raise InvalidHeaders("trailing bytes after the headers")
    return out


def validate_chain(headers: list[bytes], start_height: int, prev_hash: bytes, prev_bits: int) -> list[dict]:
    """Rows for headers that extend the block (prev_hash, prev_bits) at start_height - 1. Each header must link to
    the one before, carry proof of work for its own target, and follow the difficulty rule: the target changes only
    every 2,016 blocks, and then by at most a factor of four, never above the easiest allowed target. Faking a chain
    that passes would need as much computing work as the real one."""
    rows = []
    for k, header in enumerate(headers):
        height = start_height + k
        f = fields(header)
        h = block_hash(header)
        if f["prev_hash"] != prev_hash:
            raise InvalidHeaders(f"block {height} does not link to block {height - 1}")
        t = target(f["bits"])
        if int.from_bytes(h, "little") > t:
            raise InvalidHeaders(f"block {height} lacks the proof of work for its target")
        if height % RETARGET_BLOCKS:
            if f["bits"] != prev_bits:
                raise InvalidHeaders(f"block {height} changes the difficulty between retargets")
        else:
            old = target(prev_bits)
            if not (old // 4 <= t <= old * 4) or t > target(POW_LIMIT_BITS):
                raise InvalidHeaders(f"block {height} retargets by more than the rules allow")
        rows.append({"height": height, "hash": h, "prev_hash": f["prev_hash"],
                     "time": dt.datetime.fromtimestamp(f["time"], dt.timezone.utc), "bits": f["bits"],
                     "version": f["version"]})
        prev_hash, prev_bits = h, f["bits"]
    return rows


def genesis_row() -> dict:
    h = block_hash(GENESIS_HEADER)
    if hash_hex(h) != GENESIS_HASH:
        raise InvalidHeaders("genesis header does not hash to the genesis hash")
    f = fields(GENESIS_HEADER)
    return {"height": 0, "hash": h, "prev_hash": f["prev_hash"],
            "time": dt.datetime.fromtimestamp(f["time"], dt.timezone.utc), "bits": f["bits"], "version": f["version"]}
