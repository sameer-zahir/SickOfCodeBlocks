// Step 9 — normalize "smart" typography to ASCII (on by default).
// Many CLIs/banners emit curly quotes, em dashes, ellipses, etc. that turn into
// mojibake in some plain-text contexts. Fold them to ASCII equivalents.
//
// Keys are built from numeric code points so the source stays pure ASCII.

const cp = (n: number): string => String.fromCodePoint(n);

const MAP: Record<string, string> = {
  [cp(0x2014)]: "--", // em dash
  [cp(0x2015)]: "--", // horizontal bar
  [cp(0x2013)]: "-", // en dash
  [cp(0x2010)]: "-", // hyphen
  [cp(0x2011)]: "-", // non-breaking hyphen
  [cp(0x2012)]: "-", // figure dash
  [cp(0x2043)]: "-", // hyphen bullet
  [cp(0x2018)]: "'", // left single quote
  [cp(0x2019)]: "'", // right single quote
  [cp(0x201a)]: "'", // single low-9 quote
  [cp(0x201b)]: "'", // single high-reversed-9 quote
  [cp(0x2032)]: "'", // prime
  [cp(0x201c)]: '"', // left double quote
  [cp(0x201d)]: '"', // right double quote
  [cp(0x201e)]: '"', // double low-9 quote
  [cp(0x201f)]: '"', // double high-reversed-9 quote
  [cp(0x2033)]: '"', // double prime
  [cp(0x2026)]: "...", // ellipsis
  [cp(0x2022)]: "*", // bullet
  [cp(0x00b7)]: "*", // middle dot
  [cp(0x2023)]: "*", // triangular bullet
  [cp(0x00a9)]: "(C)", // copyright
  [cp(0x00ae)]: "(R)", // registered
  [cp(0x2122)]: "(TM)", // trade mark
  [cp(0x00bd)]: "1/2",
  [cp(0x00bc)]: "1/4",
  [cp(0x00be)]: "3/4",
  [cp(0x00d7)]: "x", // multiplication sign
  [cp(0x00f7)]: "/", // division sign
};

const ARROWS: Record<string, string> = {
  [cp(0x2192)]: "->",
  [cp(0x2190)]: "<-",
  [cp(0x2194)]: "<->",
  [cp(0x21d2)]: "=>",
  [cp(0x21d0)]: "<=",
  [cp(0x2191)]: "^",
  [cp(0x2193)]: "v",
};

const MAP_RE = new RegExp("[" + Object.keys(MAP).join("") + "]", "gu");
const ALL_RE = new RegExp(
  "[" + Object.keys(MAP).join("") + Object.keys(ARROWS).join("") + "]",
  "gu",
);

/** Convert smart punctuation to ASCII. When `arrows` is true, arrows too. */
export function normalizeTypography(input: string, arrows = false): string {
  if (arrows) {
    return input.replace(ALL_RE, (ch) => MAP[ch] ?? ARROWS[ch] ?? ch);
  }
  return input.replace(MAP_RE, (ch) => MAP[ch] ?? ch);
}
