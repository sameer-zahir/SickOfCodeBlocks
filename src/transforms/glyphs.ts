// Step 6 — strip decorative glyphs that render as tofu (square box) outside a
// patched terminal: Nerd Font / Powerline icons (Private Use Area), IEC power
// symbols, and block-element bar fills.
//
// Implemented with numeric code-point checks so the source stays pure ASCII
// (no ambiguous invisible glyphs in the file).

function isStrippableGlyph(cp: number): boolean {
  return (
    (cp >= 0xe000 && cp <= 0xf8ff) || // BMP Private Use Area (Nerd Font / Powerline)
    (cp >= 0xf0000 && cp <= 0xffffd) || // Supplementary PUA-A
    (cp >= 0x100000 && cp <= 0x10fffd) || // Supplementary PUA-B
    (cp >= 0x23fb && cp <= 0x23fe) || // IEC power symbols (power/sleep)
    cp === 0x2b58 || // IEC power circle
    (cp >= 0x2580 && cp <= 0x259f) // Block Elements (bar fills)
  );
}

// Fast-path guard, built from \u{...} text so the source contains no literals.
const HAS_GLYPH = new RegExp(
  "[\\u{E000}-\\u{F8FF}\\u{F0000}-\\u{FFFFD}\\u{100000}-\\u{10FFFD}\\u{23FB}-\\u{23FE}\\u{2B58}\\u{2580}-\\u{259F}]",
  "u",
);

/** Strip PUA / Nerd Font / Powerline glyphs + block-element bar fills. */
export function stripGlyphs(input: string): string {
  if (!HAS_GLYPH.test(input)) return input; // fast path
  let out = "";
  // Array.from yields whole code points (handles astral PUA correctly).
  const chars = Array.from(input);
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i] as string;
    const cp = ch.codePointAt(0) as number;
    if (isStrippableGlyph(cp)) {
      // Eat one trailing space/tab (the usual icon gutter "<icon> file.txt").
      const next = chars[i + 1];
      if (next === " " || next === "\t") i += 1;
      continue;
    }
    out += ch;
  }
  return out;
}
