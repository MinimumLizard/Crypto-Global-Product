"""community.useful_count: one vote per sender (their latest), nothing below the minimum, callable by the website."""
from __future__ import annotations

import pytest


def vote(conn, page, key, useful):
    conn.execute("select community.submit_feedback(%s, 'page_vote', %s, null, null, 'free', %s)", (page, useful, key))


@pytest.mark.db
def test_counts_each_sender_once_and_hides_small_numbers(conn):
    page = "/learn/basics/scams"
    keys = [f"{i:032x}" for i in range(30)]
    for k in keys[:24]:
        vote(conn, page, k, True)
    assert conn.execute("select community.useful_count(%s) n", (page,)).fetchone()["n"] is None      # 24: below 25
    vote(conn, page, keys[24], True)
    vote(conn, page, keys[0], True)                                                                   # a repeat: still once
    assert conn.execute("select community.useful_count(%s) n", (page,)).fetchone()["n"] == 25
    vote(conn, page, keys[1], False)                                                                  # changed their mind
    assert conn.execute("select community.useful_count(%s) n", (page,)).fetchone()["n"] is None
    assert conn.execute("select community.useful_count('/elsewhere') n").fetchone()["n"] is None


@pytest.mark.db
def test_the_website_role_can_call_it_but_not_read_the_votes(conn):
    conn.execute("set role web_reader")
    assert conn.execute("select community.useful_count('/') n").fetchone()["n"] is None
    with pytest.raises(Exception):
        conn.execute("select count(*) from community.feedback")
    conn.rollback()
