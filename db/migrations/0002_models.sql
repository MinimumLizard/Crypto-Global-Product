-- 0002: layer 4, model outputs (docs/architecture.md §7, decision 0015).
--
-- Models are recomputed from the facts, so their tables are NOT append-only like the fact tables. They are made
-- auditable instead:
--   * every row carries the method_version that produced it, and versions never mix: version 2 of a model is a
--     separate series beside version 1, and version 1 stays;
--   * every row carries the run that first wrote its current value (models.runs: code version, inputs fingerprint);
--   * a value that changes on a later run (because a late or amended source file changed the inputs) is not
--     silently overwritten: the old row is copied to models.revisions first, which is itself append-only. So
--     "what did the site show for this day, and when did it change?" always has an answer.

create schema if not exists models;

-- One row per model run. Updated once, to close it.
create table models.runs (
  run_id          bigserial   primary key,
  model           text        not null,
  method_version  text        not null,
  code_version    text        not null,
  as_of           date,
  inputs_sha256   text,                    -- fingerprint of every input row the model read
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  status          text        not null default 'running'
                  check (status in ('running', 'ok', 'failed')),
  rows_inserted   integer,
  rows_updated    integer,
  rows_deleted    integer,
  rows_unchanged  integer,
  message         text
);
create index on models.runs (model, method_version, started_at);

-- The validated manifests, published by data_platform.models.registry so the database, the API and the site all
-- read the same description of each model.
create table models.registry (
  model           text        not null,
  method_version  text        not null,
  status          text        not null check (status in ('current', 'reference', 'retired')),
  manifest        jsonb       not null,
  manifest_sha256 text        not null,
  published_at    timestamptz not null default now(),
  primary key (model, method_version)
);

-- Old values of model rows that a later run changed or removed. Append-only.
create table models.revisions (
  revision_id     bigserial   primary key,
  run_id          bigint      not null references models.runs,
  table_name      text        not null,
  method_version  text        not null,
  row_key         jsonb       not null,
  old_row         jsonb       not null,
  new_row         jsonb,                   -- null: the row was removed
  revised_at      timestamptz not null default now()
);
create index on models.revisions (table_name, method_version);
create trigger revisions_append_only before update or delete on models.revisions
  for each row execute function ops.forbid_change();

-- Small named figures a model measures from its own outputs (e.g. how often a reading was followed by a given
-- move). Measured on every run, never typed in, and unpublished: the website's login cannot read it (0003), because
-- such figures beside a live reading would read as a performance claim (decision 0010 point 5).
create table models.model_stats (
  model           text             not null,
  method_version  text             not null,
  stat_key        text             not null,
  value           double precision not null,
  n               integer,
  run_id          bigint           not null references models.runs,
  primary key (model, method_version, stat_key)
);

-- Each model's output tables are created by the migration that adds the model (0005 for crypto). That migration
-- enables row-level security on them, adds the web_reader read policy and grants select, as 0003 does here.
alter table models.runs        enable row level security;
alter table models.registry    enable row level security;
alter table models.revisions   enable row level security;
alter table models.model_stats enable row level security;
