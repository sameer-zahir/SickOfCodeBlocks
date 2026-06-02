// Step 11 — whitespace / newline normalization. Runs LAST: earlier steps (ANSI
// strip, glyph removal, table rebuild) all leave ragged trailing spaces and
// blank lines that only a final pass can clean.
//
// The Unicode-space / zero-width classes are built from "\\u..." strings so the
// source file stays pure ASCII (no ambiguous invisible characters).

export interface WhitespaceOptions {
  expandTabs: number | false;
  newline: "lf" | "crlf";
  collapseBlankLines: boolean;
}

// NBSP + ogham space + en/em quad..hair space + narrow/medium/ideographic space.
const EXOTIC_SPACE = new RegExp(
  "[\\u00A0\\u1680\\u2000-\\u200A\\u202F\\u205F\\u3000]",
  "g",
);
// Truly invisible: ZWSP, word-joiner, BOM/ZWNBSP, soft hyphen.
// We deliberately keep ZWJ (U+200D) and ZWNJ (U+200C) so kept emoji
// ZWJ-sequences survive.
const ZERO_WIDTH = new RegExp("[\\u200B\\u2060\\uFEFF\\u00AD]", "g");

export function normalizeWhitespace(
  input: string,
  opts: WhitespaceOptions,
): string {
  let s = input.replace(EXOTIC_SPACE, " ").replace(ZERO_WIDTH, "");

  if (opts.expandTabs !== false) {
    const width = opts.expandTabs;
    s = s.replace(/\t/g, " ".repeat(width));
  }

  // Normalize newlines to \n (safe now: overwrite resolution already consumed CRs).
  s = s.replace(/\r\n?/g, "\n");
  // Trim trailing whitespace per line.
  s = s.replace(/[ \t]+$/gm, "");
  // Collapse 3+ blank lines to a single blank line.
  if (opts.collapseBlankLines) s = s.replace(/\n{3,}/g, "\n\n");
  // Trim leading/trailing blank lines.
  s = s.replace(/^\n+/, "").replace(/\n+$/, "");

  if (opts.newline === "crlf") s = s.replace(/\n/g, "\r\n");
  return s;
}
