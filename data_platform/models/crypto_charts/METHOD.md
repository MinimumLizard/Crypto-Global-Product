# Chart library: long averages, momentum, returns and risk (crypto_charts)

**What it is.** The lines behind the chart library's price-based charts, for every coin the site follows, computed
each day from that coin's daily closes in US dollars. Each line is a standard, published measure; none is a signal or a forecast.
Every value for a day uses closes up to that day only, so a value never changes once it is published.

**Inputs.** Daily closes (the last trade of each UTC day) for each coin against the US dollar.

## Long averages

- **350-day average** (`sma_350`): the average of the last 350 daily closes. The multiplier bands chart draws it
  together with fixed multiples of it (1.6, 2, 3, 5, 8, 13 and 21 times), a way of showing how far above its long
  average a price has stretched in the past. The multiples are a convention popularised in 2019 (the Fibonacci
  sequence and the golden ratio, 1.6); they have no economic meaning.
- **Two-year average** (`sma_730`): the average of the last 730 daily closes, drawn with five times its value.

## Momentum

- **Relative strength index, 14 days** (`rsi_14d`), J. Welles Wilder (1978): the average gain on up days against
  the average loss on down days over the last 14 daily changes, scaled from 0 to 100:
  `RSI = 100 − 100 / (1 + average gain / average loss)`. The first averages are simple averages of the first 14
  changes; after that each new change gets weight 1/14 (Wilder's smoothing). 100 when there were no losses.
- **Relative strength index, 14 weeks** (`rsi_14w`): the same on weekly closes. Weeks run Monday to Sunday (UTC); a
  completed week's close is its Sunday close, and the week in progress closes at the day's close, as a weekly chart
  shows it.
- **MACD** (`macd`, `macd_signal`, `macd_hist`), Gerald Appel (1970s): the 12-day exponential average of closes minus
  the 26-day one; its signal line is the 9-day exponential average of MACD; the histogram is MACD minus its signal.
  Exponential averages use weight 2 / (n + 1) and start from the simple average of their first n values.
- **Bollinger bands** (`bb_mid`, `bb_upper`, `bb_lower`, `bb_width`), John Bollinger (1980s): the 20-day average,
  and that average plus and minus two standard deviations of the same 20 closes (population standard deviation).
  Width is the distance between the bands divided by the average.

## Returns

- **Running returns over two and four years** (`roi_730d`, `roi_1460d`): the close against the close 730 and 1,460
  days earlier. (The one-year return is in "Crypto prices, returns and drawdowns".)
- **Year to date** (`ret_ytd`): the close against the previous year's last close (31 December).
- **Quarterly returns** (`ret_quarter`): each completed calendar quarter's last close against the previous quarter's,
  dated on the quarter's last day. A quarter appears only once it has ended.

## Risk

- **Volatility, one year** (`vol_365d`): the standard deviation of daily log returns over the last 365 days, times
  √365.
- **Sharpe ratio, one year** (`sharpe_365d`), William Sharpe (1966): the average daily log return over the last 365
  days, times 365, divided by that volatility. The risk-free rate is taken as zero, so the figure is return per unit
  of volatility, not excess return.
- **Sortino ratio, one year** (`sortino_365d`), Frank Sortino (1980s): the same average return divided by the downside
  deviation: the square root of the average of squared negative daily log returns (positive ones count as zero),
  times √365.

## Against bitcoin (every coin but bitcoin)

- **Price in bitcoin** (`price_btc`): the coin's US-dollar close divided by bitcoin's on the same day.
- **Correlation with bitcoin, 90 days** (`corr_btc_90d`): the Pearson correlation of the two coins' daily log returns
  over the last 90 days, from −1 to 1.
- **Beta to bitcoin, one year** (`beta_btc_365d`): the covariance of the coin's daily log returns with bitcoin's over
  the last 365 days, divided by the variance of bitcoin's. A beta of 2 means the coin's daily moves have been about
  twice bitcoin's, on average, in that window.

## Limits

- All of these describe past prices. None says what a price will do next, and none is meant as a reason to act.
- Rolling windows need enough history: a line starts only once its window is full (for example, the four-year return
  starts four years after a coin's first close).
- Correlation and beta describe how prices moved together in one window; they change over time and say nothing
  about cause.
- Prices are one exchange's closes (see the data source on each page); other venues differ slightly.
