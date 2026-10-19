// The terms the Learn page explains, in the order it shows them. Their text is in messages (learn.terms.<id>).
export const GLOSSARY = [
  "drawdown", "volatility", "movingAverage", "mayer", "halving", "logScale", "powerLaw", "marketCap", "methodVersion",
] as const;
export type GlossaryTerm = (typeof GLOSSARY)[number];
