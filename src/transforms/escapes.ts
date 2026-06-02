// Steps 4 & 5 — strip remaining escape sequences and loose control chars.
//
// Augmented beyond the well-known `ansi-regex` (MIT) pattern: stock ansi-regex
// matches only CSI and OSC, and deliberately MISSES DCS (ESC P ... sixel),
// APC (ESC _ ... Kitty graphics) and PM/SOS. We add those string classes plus
// 2-byte ESC sequences (ESC c reset, ESC (B charset) so nothing leaks through.

// 4a. OSC string: ESC ] (or C1 0x9D) ... payload non-greedy to ST | BEL | 0x9C
const OSC = /(?:\x1b\]|\x9d)[\s\S]*?(?:\x07|\x1b\\|\x9c)/g;
// 4b. DCS / APC / PM / SOS: ESC P/_/^/X (or C1) ... to ST/BEL  -- the ansi-regex gap
const DCS = /(?:\x1b[P_^X]|[\x90\x9f\x9e\x98])[\s\S]*?(?:\x1b\\|\x9c|\x07)/g;
// 4c. CSI: ESC [ (or C1 0x9B), params, intermediates, final byte 0x40-0x7E
const CSI = /(?:\x1b\[|\x9b)[0-?]*[ -\/]*[@-~]/g;
// 4d. charset designators + other 2-byte ESC (ESC (B, ESC )0, ESC c, ESC =, ESC 7/8)
const ESC2 = /\x1b[ -\/]*[0-~]/g;
// 4e. lone / incomplete ESC sweep (truncated input)
const ESC_LONE = /\x1b/g;
// 4f. orphan C1 controls -- safe ONLY post-UTF-8-decode (here we operate on a JS string)
const C1 = /[\x80-\x9f]/g;

/** Strip all ANSI/VT/OSC/DCS escape sequences (step 4). */
export function stripEscapes(input: string): string {
  if (input.indexOf("\x1b") === -1 && !/[\x80-\x9f]/.test(input)) return input;
  return input
    .replace(OSC, "")
    .replace(DCS, "")
    .replace(CSI, "")
    .replace(ESC2, "")
    .replace(ESC_LONE, "")
    .replace(C1, "");
}

// 5. Loose C0 controls.
const C0_TO_NL = /[\x0b\x0c]/g; // VT, FF -> newline
const C0_DROP = /[\x00-\x08\x0e-\x1f\x7f]/g; // keep \t (09) and \n (0A)

/** Handle leftover C0 control characters (step 5). */
export function stripLooseControls(input: string): string {
  return input
    .replace(C0_TO_NL, "\n")
    .replace(/\r/g, "") // stray CR not consumed by overwrite resolution
    .replace(C0_DROP, "");
}
