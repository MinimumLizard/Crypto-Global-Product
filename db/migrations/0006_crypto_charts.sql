-- 0006: the chart library's price-based series (decision 0025).
--
-- crypto_charts computes many lines per pair per day (long averages, momentum indicators, rolling returns, risk
-- ratios, relations to bitcoin) from the same daily closes as the other crypto models. They are stored in long form,
-- one row per (pair, series, day), so a new line is a new series name, not a new column. Each value for day D uses
-- closes up to D only (point in time, like every model output).

create table models.crypto_charts_series (
  method_version  text             not null,
  pair            text             not null,
  series          text             not null,   -- e.g. sma_350, rsi_14d, sharpe_365d (data_platform/models/crypto_charts/METHOD.md)
  day             date             not null,
  value           double precision not null,   -- days with no value (too little history) have no row
  run_id          bigint           not null references models.runs,
  primary key (method_version, pair, series, day)
);

alter table models.crypto_charts_series enable row level security;
create policy web_read on models.crypto_charts_series for select to web_reader using (true);
grant select on models.crypto_charts_series to web_reader;
