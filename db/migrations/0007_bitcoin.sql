-- 0007: the Bitcoin network's own record (decision 0025).
--
-- Facts: every block header, downloaded from peers of the Bitcoin network and verified by its proof of work and
-- its link to the previous block before it is stored (collectors/bitcoin_network). Only headers at least six
-- blocks deep are stored, so a stored block cannot be reorganised away; the table is append-only like every fact
-- table. Hashes are stored as 32 raw bytes in the protocol's internal order (display form: byte-reversed hex).

create schema if not exists bitcoin;

create table bitcoin.block_headers (
  height       integer      primary key check (height >= 0),
  hash         bytea        not null unique check (length(hash) = 32),
  prev_hash    bytea        not null check (length(prev_hash) = 32),
  time         timestamptz  not null,            -- the time the miner wrote in the header (can be off by up to ~2 hours)
  bits         bigint       not null,            -- the difficulty target, in compact form
  version      integer      not null,
  raw_sha256   text         not null references ops.raw_objects,
  fetch_id     bigint       not null references ops.raw_fetches,
  fetched_at   timestamptz  not null,
  ingested_at  timestamptz  not null default now()
);

create trigger block_headers_append_only before update or delete on bitcoin.block_headers
  for each row execute function ops.forbid_change();

alter table bitcoin.block_headers enable row level security;

-- btc_network: supply, issuance, difficulty and hash rate per UTC day, in long form (one row per series and day).
create table models.btc_network_series (
  method_version  text             not null,
  series          text             not null,
  day             date             not null,
  value           double precision not null,
  run_id          bigint           not null references models.runs,
  primary key (method_version, series, day)
);

alter table models.btc_network_series enable row level security;
create policy web_read on models.btc_network_series for select to web_reader using (true);
grant select on models.btc_network_series to web_reader;
