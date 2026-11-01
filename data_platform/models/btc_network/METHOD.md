# The Bitcoin network: supply, issuance, difficulty and hash rate (btc_network)

**What it is.** Measures of the Bitcoin network itself, per UTC day, computed from the header of every block (and,
for the Puell multiple and market value, bitcoin's daily close). The headers come straight from the Bitcoin
network and are checked block by block (their proof of work, their link to the block before, and the difficulty
rules) before they are stored. Nobody owns this record; it is free to use and show.

**When a day is published.** A block's time is written by its miner and can be off by up to about two hours, and
blocks are not always in time order. A day is published only once the median time of the last 11 blocks is past
the day's end: Bitcoin's rules forbid any later block from carrying a time at or below that median, so no later
block can be dated on a published day, and a published value never changes.

## Supply and issuance

- **Supply** (`supply`): the bitcoin issued by the schedule up to the highest block dated on or before the day.
  Each block's subsidy started at 50 bitcoin and halves every 210,000 blocks (rounded down to whole satoshis). The
  genesis block's 50, which can never be spent, are counted; coins lost since are counted too, and the few blocks
  whose miners claimed less than the full subsidy are not corrected for, so this is the scheduled supply.
- **Issuance** (`issuance`, `issuance_365d`): the supply's change over the day and over the last 365 days.
- **Inflation, one year** (`inflation_365d`): issuance over the last 365 days divided by the supply a year earlier.
- **Stock-to-flow** (`stock_to_flow`): supply divided by issuance over the last 365 days (years of current issuance
  that the existing supply represents). It roughly doubles at each halving. This is the ratio only; we do not show
  the price model once fitted to it.
- **Halving countdown** (`blocks_to_halving`, `days_to_halving`): blocks left until the next multiple of 210,000,
  and that number divided by the average number of blocks per day over the last 14 days (an estimate).

## Mining

- **Difficulty** (`difficulty`): how many times harder than the easiest allowed target the last block of the day was
  to find. It is adjusted every 2,016 blocks to keep blocks about ten minutes apart.
- **Hash rate** (`hash_rate`, in EH/s: 10^18 hashes a second): the computing work the day's blocks represent
  (each block at difficulty D takes about D × 2^32 hashes to find on average) divided by the seconds in a day. A
  single day's estimate is noisy because blocks arrive at random; the 7-, 30- and 60-day averages
  (`hash_rate_7d`, `hash_rate_30d`, `hash_rate_60d`) are steadier. The 30- and 60-day averages together are often
  called "hash ribbons" (Charles Edwards, 2019); we show them as a description of mining activity.

## With the price

- **Issuance in US dollars** (`issuance_usd`): the day's issuance times bitcoin's close.
- **Puell multiple** (`puell`), David Puell (2019): that value divided by its 365-day average. It falls sharply at
  each halving, when issuance halves overnight.
- **Market value** (`market_cap`): supply times the close.

## Limits

- Block times are set by miners and can be off by hours; daily counts and the hash rate inherit that noise.
- The hash rate is an estimate from difficulty and block times, not a measurement.
- Measures that use the price inherit the price data's source and licence (see the chart's data note).
