"""A minimal Bitcoin peer-to-peer client: just enough of the protocol (version handshake, getheaders, headers,
ping/pong) to download block headers. The Bitcoin network is open: any computer may connect to its peers, and the
protocol is public (developer reference at developer.bitcoin.org). Headers are verified in parse.py, so a peer
is never trusted."""
from __future__ import annotations

import os
import random
import socket
import struct
import time

from .parse import sha256d

MAGIC = bytes.fromhex("f9beb4d9")             # mainnet
PROTOCOL_VERSION = 70016
DNS_SEEDS = ["seed.bitcoin.sipa.be", "dnsseed.bluematt.me", "seed.bitcoin.jonasschnelli.ch",
             "seed.btc.petertodd.net", "seed.bitcoin.sprovoost.nl", "dnsseed.emzy.de", "seed.bitcoin.wiz.biz"]
PORT = 8333
USER_AGENT = b"/cointrigue-headers:0.1/"


class P2PError(RuntimeError):
    pass


def message(command: str, payload: bytes = b"") -> bytes:
    """A framed message: magic, command (12 bytes, zero-padded), payload length, checksum, payload."""
    return (MAGIC + command.encode().ljust(12, b"\0") + struct.pack("<I", len(payload))
            + sha256d(payload)[:4] + payload)


def varint(n: int) -> bytes:
    if n < 0xFD:
        return bytes([n])
    if n <= 0xFFFF:
        return b"\xfd" + struct.pack("<H", n)
    if n <= 0xFFFFFFFF:
        return b"\xfe" + struct.pack("<I", n)
    return b"\xff" + struct.pack("<Q", n)


def version_payload(now: int | None = None, nonce: int | None = None) -> bytes:
    addr = struct.pack("<Q", 0) + b"\0" * 10 + b"\xff\xff" + b"\0\0\0\0" + struct.pack(">H", 0)
    return (struct.pack("<iQq", PROTOCOL_VERSION, 0, now if now is not None else int(time.time()))
            + addr + addr + struct.pack("<Q", nonce if nonce is not None else random.getrandbits(64))
            + varint(len(USER_AGENT)) + USER_AGENT + struct.pack("<i", 0) + b"\0")


def getheaders_payload(locator: list[bytes]) -> bytes:
    """Ask for up to 2,000 headers after the first locator hash the peer knows (hashes in internal byte order)."""
    return struct.pack("<I", PROTOCOL_VERSION) + varint(len(locator)) + b"".join(locator) + b"\0" * 32


def read_message(sock: socket.socket) -> tuple[str, bytes]:
    header = _recv(sock, 24)
    if header[:4] != MAGIC:
        raise P2PError("not a Bitcoin mainnet message")
    command = header[4:16].rstrip(b"\0").decode("ascii", "replace")
    length, = struct.unpack("<I", header[16:20])
    if length > 32 * 1024 * 1024:
        raise P2PError("message too large")
    payload = _recv(sock, length)
    if sha256d(payload)[:4] != header[20:24]:
        raise P2PError(f"bad checksum on {command}")
    return command, payload


def _recv(sock: socket.socket, n: int) -> bytes:
    buf = bytearray()
    while len(buf) < n:
        chunk = sock.recv(n - len(buf))
        if not chunk:
            raise P2PError("peer closed the connection")
        buf += chunk
    return bytes(buf)


def peer_addresses(rng: random.Random | None = None) -> list[str]:
    """IPv4 addresses from the DNS seeds the Bitcoin software itself uses, shuffled. PEERS (comma-separated) overrides."""
    if os.environ.get("BITCOIN_PEERS"):
        return [p.strip() for p in os.environ["BITCOIN_PEERS"].split(",") if p.strip()]
    found: set[str] = set()
    for seed in DNS_SEEDS:
        try:
            found |= {a[4][0] for a in socket.getaddrinfo(seed, PORT, socket.AF_INET, socket.SOCK_STREAM)}
        except OSError:
            continue
    out = sorted(found)
    (rng or random.Random()).shuffle(out)
    return out


class Peer:
    def __init__(self, host: str, timeout: float = 20.0):
        self.host = host
        self.sock = socket.create_connection((host, PORT), timeout=timeout)

    def close(self) -> None:
        self.sock.close()

    def send(self, command: str, payload: bytes = b"") -> None:
        self.sock.sendall(message(command, payload))

    def handshake(self) -> None:
        self.send("version", version_payload())
        got_version = got_verack = False
        while not (got_version and got_verack):
            command, payload = read_message(self.sock)
            if command == "version":
                got_version = True
                self.send("verack")
            elif command == "verack":
                got_verack = True
            elif command == "ping":
                self.send("pong", payload)

    def headers_after(self, locator: list[bytes]) -> bytes:
        """The raw payload of the peer's `headers` reply (up to 2,000 headers)."""
        self.send("getheaders", getheaders_payload(locator))
        while True:
            command, payload = read_message(self.sock)
            if command == "headers":
                return payload
            if command == "ping":
                self.send("pong", payload)
