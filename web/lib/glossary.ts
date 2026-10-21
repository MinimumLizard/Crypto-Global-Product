// The terms the Learn page explains, in the order it teaches them (the first six are the front page's path of
// lessons). Their text is in messages (learn.terms.<id>).
export const GLOSSARY = [
  "drawdown", "volatility", "movingAverage", "logScale", "halving", "marketCap", "mayer", "powerLaw", "methodVersion",
] as const;
export type GlossaryTerm = (typeof GLOSSARY)[number];
