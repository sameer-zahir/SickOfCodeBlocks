// Library entry point: the same logic the CLI uses, reusable as a module.

export {
  sanitize,
  DEFAULTS,
  shouldSuggestEmulate,
  type SanitizeOptions,
  type TableMode,
  type Newline,
} from "./pipeline.js";

export { rewriteHyperlinks } from "./transforms/hyperlinks.js";
export { resolveOverwrites } from "./transforms/overwrite.js";
export { stripEscapes, stripLooseControls } from "./transforms/escapes.js";
export { stripGlyphs } from "./transforms/glyphs.js";
export { stripFences } from "./transforms/fences.js";
export { cleanPowerShell } from "./transforms/powershell.js";
export { stripPrompts } from "./transforms/prompts.js";
export {
  flattenMarkdown,
  flattenMarkdownText,
  protectCode,
  restoreCodes,
} from "./transforms/markdown.js";
export { htmlToText } from "./transforms/html.js";
export { transformTables } from "./transforms/tables.js";
export { stripEmoji } from "./transforms/emoji.js";
export { normalizeTypography } from "./transforms/typography.js";
export { reflowParagraphs } from "./transforms/reflow.js";
export { normalizeWhitespace } from "./transforms/whitespace.js";
export { decodeInput } from "./io/decode.js";
export { redact } from "./transforms/redact.js";
export { emulate, EmulateUnavailableError } from "./transforms/emulate.js";
export { presetPatch, type Preset } from "./presets.js";
export { loadConfig, validate as validateConfig, configPaths } from "./config.js";
export { watchTick, runWatch, type WatchState, type TickResult } from "./watch.js";
