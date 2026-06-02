// Step 8 — optional emoji removal (off by default; --strip-emoji).
//
// Removes emoji plus their joiners so no invisible cruft survives:
// ZWJ (U+200D), variation selector-16 (U+FE0F) and skin-tone modifiers
// (U+1F3FB-1F3FF). Pure-ASCII source: the base set uses the Unicode property
// \p{Extended_Pictographic}; the joiners/modifiers are matched by code point.

const PICTOGRAPHIC = /\p{Extended_Pictographic}/gu;

function isJoinerOrModifier(cp: number): boolean {
  return (
    cp === 0x200d || // zero-width joiner
    cp === 0xfe0f || // variation selector-16
    (cp >= 0x1f3fb && cp <= 0x1f3ff) // skin-tone modifiers
  );
}

/** Remove emoji, ZWJ sequences, variation selectors and skin-tone modifiers. */
export function stripEmoji(input: string): string {
  const withoutBase = input.replace(PICTOGRAPHIC, "");
  let out = "";
  for (const ch of withoutBase) {
    if (!isJoinerOrModifier(ch.codePointAt(0) as number)) out += ch;
  }
  return out;
}
