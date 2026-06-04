// The sanitization pipeline: composes the pure transforms in the required order.
// Order is load-bearing — see the comments at each step and the project plan.

import { rewriteHyperlinks } from "./transforms/hyperlinks.js";
import { resolveOverwrites } from "./transforms/overwrite.js";
import { stripEscapes, stripLooseControls } from "./transforms/escapes.js";
import { stripGlyphs } from "./transforms/glyphs.js";
import { stripFences } from "./transforms/fences.js";
import { cleanPowerShell } from "./transforms/powershell.js";
import { stripPrompts } from "./transforms/prompts.js";
import { protectCode, flattenMarkdownText, restoreCodes } from "./transforms/markdown.js";
import { htmlToText } from "./transforms/html.js";
import { transformTables } from "./transforms/tables.js";
import { stripEmoji } from "./transforms/emoji.js";
import { normalizeTypography } from "./transforms/typography.js";
import { reflowParagraphs } from "./transforms/reflow.js";
import { redact } from "./transforms/redact.js";
import { normalizeWhitespace } from "./transforms/whitespace.js";
import { emulate } from "./transforms/emulate.js";

export type TableMode = "reconstruct" | "ascii" | "strip" | "keep";
export type Newline = "lf" | "crlf";

export interface SanitizeOptions {
  /** Step 2: replay through a headless terminal before stripping. */
  emulate: boolean;
  emulateCols: number;
  emulateRows: number;
  /** Step 1: rewrite OSC 8 links to "text (url)". */
  hyperlinks: boolean;
  /** Step 7. */
  tableMode: TableMode;
  /** Step 6. */
  stripGlyphs: boolean;
  /** Step 6b: drop Markdown code fences + PowerShell tilde underlines. */
  stripFences: boolean;
  /** Step 5b: tidy pasted PowerShell errors (~ underlines + "+ " gutter). */
  powershell: boolean;
  /** Step 5c: strip leading shell prompts ($, PS>, >>>). */
  prompts: boolean;
  /** Step 6c: flatten Markdown to readable text (code kept verbatim). */
  markdown: boolean;
  /** Step 6b': strip HTML tags + decode entities. */
  html: boolean;
  /** Step 8. */
  stripEmoji: boolean;
  /** Step 9. */
  typographic: boolean;
  arrows: boolean;
  /** Step 9a: rejoin hard-wrapped prose into flowing paragraphs. */
  reflow: boolean;
  /** Step 10. */
  redact: boolean;
  /** Step 11. */
  expandTabs: number | false;
  collapseBlankLines: boolean;
  newline: Newline;
  /** Perf guard for the redaction generic-token sweep on pathological lines. */
  maxLineLength: number;
}

export const DEFAULTS: SanitizeOptions = {
  emulate: false,
  emulateCols: 200,
  emulateRows: 600,
  hyperlinks: true,
  tableMode: "reconstruct",
  stripGlyphs: true,
  stripFences: true,
  powershell: false,
  prompts: false,
  markdown: false,
  html: false,
  stripEmoji: false,
  typographic: true,
  arrows: false,
  reflow: false,
  redact: false,
  expandTabs: false,
  collapseBlankLines: true,
  newline: "lf",
  maxLineLength: 100_000,
};

// Vertical/absolute cursor moves or alt-screen => regex flattening is inaccurate.
const CURSOR_MOVE = /\x1b\[[0-9;]*[ABCDEFGHJf]/;
const ALT_SCREEN = /\x1b\[\?1049[hl]/;

/** Returns true when the input likely needs --emulate for an accurate result. */
export function shouldSuggestEmulate(input: string): boolean {
  return CURSOR_MOVE.test(input) || ALT_SCREEN.test(input);
}

/** Convert raw terminal output into clean plain text. */
export async function sanitize(
  input: string,
  options: Partial<SanitizeOptions> = {},
): Promise<string> {
  const o: SanitizeOptions = { ...DEFAULTS, ...options };

  // step 0: strip a leading BOM (U+FEFF) without putting the literal char in source
  let s = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;

  if (o.hyperlinks) s = rewriteHyperlinks(s); // step 1

  if (o.emulate) {
    s = await emulate(s, { cols: o.emulateCols, rows: o.emulateRows }); // step 2
  } else {
    s = resolveOverwrites(s); // step 3
    s = stripEscapes(s); // step 4
    s = stripLooseControls(s); // step 5
  }

  if (o.powershell) s = cleanPowerShell(s); // step 5b
  if (o.prompts) s = stripPrompts(s); // step 5c
  if (o.stripGlyphs) s = stripGlyphs(s); // step 6

  // Markdown owns fence handling and protects code from later passes. When it is
  // off we fall back to the line-level fence/underline strip (step 6b).
  let codes: string[] = [];
  if (o.markdown) {
    const protectedCode = protectCode(s); // step 6a
    s = protectedCode.text;
    codes = protectedCode.codes;
  }
  // Reflow before markup is stripped, so raw #/>/list/rule markers still mark
  // paragraph boundaries (code is already protected as sentinels).
  if (o.reflow) s = reflowParagraphs(s); // step 6r
  if (o.html) s = htmlToText(s); // step 6b' (inside the code bracket)
  if (o.markdown) s = flattenMarkdownText(s); // step 6c
  else if (o.stripFences) s = stripFences(s); // step 6b

  s = transformTables(s, o.tableMode); // step 7
  if (o.stripEmoji) s = stripEmoji(s); // step 8
  if (o.typographic) s = normalizeTypography(s, o.arrows); // step 9
  if (o.markdown) s = restoreCodes(s, codes); // step 9b: code back, verbatim
  if (o.redact) s = redact(s, o.maxLineLength); // step 10

  s = normalizeWhitespace(s, {
    expandTabs: o.expandTabs,
    newline: o.newline,
    collapseBlankLines: o.collapseBlankLines,
  }); // step 11

  return s;
}
