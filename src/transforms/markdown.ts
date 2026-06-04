// Markdown -> readable plain text. The goal is a paste that reads as prose, not
// as marked-up source: no fences, no inline backticks, no `**` / `_` / `#`, and
// links written as "text (url)" (same convention as the OSC 8 rewriter).
//
// The hard requirement is that CODE survives verbatim — both fenced blocks and
// inline `code` spans must NOT be touched by the inline flattener OR by the later
// typography pass (which would turn `->` into a smart arrow, `--` into a dash,
// etc. inside code). We solve this by EXTRACTING code to sentinel tokens up front
// (protectCode), running every text transform over the sentinel'd string, then
// restoring the verbatim code at the end (restoreCodes). The pipeline interleaves
// HTML stripping and typography between the two; flattenMarkdown() is the
// all-in-one convenience used by the library and unit tests.
//
// Sentinels use U+0000 as a delimiter: it is a C0 control already removed by
// stripLooseControls (pipeline step 5, which runs before this), so it cannot
// collide with real input, and no later step (typography, whitespace) rewrites
// it. We build it via String.fromCharCode so this source file stays pure ASCII.

const NUL = String.fromCharCode(0);
const FENCE_OPEN = /^( {0,3})(`{3,}|~{3,})(.*)$/;
// Inline code: a run of N backticks, content (single line, runs of < N backticks
// allowed), then a matching run of exactly N backticks.
const INLINE_CODE = /(`+)([^\n]*?)\1(?!`)/g;
const SENTINEL = new RegExp(NUL + "(\\d+)" + NUL, "g");
const SENTINEL_LINE = new RegExp("^" + NUL + "\\d+" + NUL + "$");
const ESCAPE_TOKEN = new RegExp(NUL + "e(\\d+)" + NUL, "g");

function sentinel(i: number): string {
  return NUL + i + NUL;
}

/**
 * Pull fenced code blocks and inline code spans out into `codes`, replacing each
 * with a sentinel token so downstream text transforms leave the code alone.
 */
export function protectCode(input: string): { text: string; codes: string[] } {
  const codes: string[] = [];
  const lines = input.split("\n");
  const out: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const m = FENCE_OPEN.exec(lines[i] as string);
    if (m) {
      const indent = (m[1] as string).length;
      const fenceChar = (m[2] as string)[0] as string; // "`" or "~"
      const fenceLen = (m[2] as string).length;
      const closeRe = new RegExp("^ {0,3}" + fenceChar + "{" + fenceLen + ",}[ \\t]*$");
      const dedent = new RegExp("^ {0," + indent + "}");
      const body: string[] = [];
      let j = i + 1;
      let closed = false;
      while (j < lines.length) {
        if (closeRe.test(lines[j] as string)) {
          closed = true;
          break;
        }
        body.push((lines[j] as string).replace(dedent, ""));
        j += 1;
      }
      if (closed) {
        codes.push(body.join("\n"));
        out.push(sentinel(codes.length - 1));
        i = j + 1; // skip the closing fence
      } else {
        // No closing fence: treat the opener as an ordinary line rather than
        // swallowing the rest of the document (safer for stray "~~~" underlines).
        out.push(lines[i] as string);
        i += 1;
      }
      continue;
    }
    out.push(lines[i] as string);
    i += 1;
  }

  const text = out.join("\n").replace(INLINE_CODE, (_match, _ticks: string, content: string) => {
    codes.push(content);
    return sentinel(codes.length - 1);
  });
  return { text, codes };
}

/** Restore code sentinels produced by protectCode to their verbatim text. */
export function restoreCodes(text: string, codes: string[]): string {
  if (codes.length === 0) return text;
  return text.replace(SENTINEL, (_m, i: string) => codes[Number(i)] ?? "");
}

const ESCAPED = /\\([!-/:-@[-`{-~])/g; // backslash-escaped ASCII punctuation
const IMAGE = /!\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*"|\s+'[^']*')?\s*\)/g;
const LINK = /\[([^\]]+)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*"|\s+'[^']*')?\s*\)/g;
const AUTOLINK = /<((?:https?|ftp|mailto):[^>\s]+)>/g;
const STRIKE = /~~(?=\S)([^~]+?)~~/g;
const BOLD_STAR = /\*\*(?=\S)([^*]+?)\*\*/g;
const BOLD_UNDER = /__(?=\S)([^_]+?)__/g;
const ITALIC_STAR = /\*(?=\S)([^*\n]+?)\*/g;
// Underscore emphasis only at word boundaries, so identifiers like my_var_name
// (and the sentinel tokens) are left intact.
const ITALIC_UNDER = /(^|[^A-Za-z0-9_])_(?=\S)([^_\n]+?)_(?![A-Za-z0-9_])/g;

/** Strip inline Markdown markup from a single line; code sentinels pass through. */
function flattenInline(input: string): string {
  const escapes: string[] = [];
  let s = input.replace(ESCAPED, (_m, ch: string) => {
    escapes.push(ch);
    return NUL + "e" + (escapes.length - 1) + NUL;
  });

  s = s.replace(IMAGE, (_m, alt: string, url: string) => (alt ? `${alt} (${url})` : url));
  s = s.replace(LINK, (_m, text: string, url: string) => (text === url ? text : `${text} (${url})`));
  s = s.replace(AUTOLINK, "$1");
  s = s.replace(STRIKE, "$1");
  s = s.replace(BOLD_STAR, "$1").replace(BOLD_UNDER, "$1");
  s = s.replace(ITALIC_STAR, "$1").replace(ITALIC_UNDER, "$1$2");

  return s.replace(ESCAPE_TOKEN, (_m, i: string) => escapes[Number(i)] ?? "");
}

const BLOCKQUOTE = /^(\s*)(?:> ?)+/;
const HR = /^ {0,3}([-*_])( *\1){2,} *$/;
const ATX = /^ {0,3}(#{1,6})\s+(.*?)(?:\s+#+)?\s*$/;
const SETEXT_UNDERLINE = /^ {0,3}=+\s*$/;
const TASK = /^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/;
const BULLET = /^(\s*)[-*+]\s+(.*)$/;
const ORDERED = /^(\s*)(\d{1,9})[.)]\s+(.*)$/;

/**
 * Flatten Markdown block + inline structure to readable text. Assumes code has
 * already been replaced with sentinels by protectCode.
 */
export function flattenMarkdownText(text: string): string {
  const lines = text.split("\n");
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] as string;
    if (SENTINEL_LINE.test(raw)) {
      out.push(raw);
      continue;
    }

    // Strip blockquote markers (any nesting), keeping leading indent.
    const line = raw.replace(BLOCKQUOTE, "$1");

    // Setext heading: text on this line, "===" underline on the next.
    const next = lines[i + 1];
    if (
      /\S/.test(line) &&
      !/^\s*#/.test(line) &&
      !HR.test(line) &&
      next !== undefined &&
      SETEXT_UNDERLINE.test(next)
    ) {
      out.push(flattenInline(line.trim()));
      i += 1; // consume the underline
      continue;
    }

    if (HR.test(line)) {
      out.push(""); // horizontal rule -> blank separator
      continue;
    }

    const atx = ATX.exec(line);
    if (atx) {
      out.push(flattenInline(atx[2] as string));
      continue;
    }

    let m = TASK.exec(line);
    if (m) {
      const mark = (m[2] as string).toLowerCase() === "x" ? "x" : " ";
      out.push(`${m[1]}- [${mark}] ${flattenInline(m[3] as string)}`);
      continue;
    }
    m = BULLET.exec(line);
    if (m) {
      out.push(`${m[1]}- ${flattenInline(m[2] as string)}`);
      continue;
    }
    m = ORDERED.exec(line);
    if (m) {
      out.push(`${m[1]}${m[2]}. ${flattenInline(m[3] as string)}`);
      continue;
    }

    out.push(flattenInline(line));
  }

  return out.join("\n");
}

// Trigger the full pass on any inline marker, a list line, or a rule/setext
// underline line (all dashes or all equals). "*"/"_" rules already match the
// inline class, so only the all-dash / all-equals cases need adding here.
const MD_TRIGGER = /[`*_#>[\]~<]|^[ \t]*(?:[-+]\s|\d{1,9}[.)]\s|[-=][-= \t]*$)/m;

/** Flatten Markdown to readable plain text, keeping code verbatim. */
export function flattenMarkdown(input: string): string {
  if (!MD_TRIGGER.test(input)) return input; // fast path: no markup at all
  const { text, codes } = protectCode(input);
  return restoreCodes(flattenMarkdownText(text), codes);
}
