// HTML -> plain text. Clipboards frequently hold HTML (copying from a browser,
// Slack, Teams, rendered docs), which otherwise pastes as raw markup. We drop
// script/style bodies and comments, turn <br> and block-level tags into line
// breaks, strip the remaining tags, and decode character references LAST (so a
// decoded "<" is never re-read as a tag).
//
// This is opt-in (presets --email/--plain, or --html) because terminal output
// legitimately contains "<" / ">" (redirections like 2>&1, C++ <int>). In the
// Markdown pipeline this runs after code has been pulled out to sentinels, so
// angle brackets inside code are safe.

const SCRIPT_STYLE = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
const COMMENT = /<!--[\s\S]*?-->/g;
const BR = /<br\s*\/?>/gi;
// Block-level elements become a newline so structure survives as line breaks.
const BLOCK =
  /<\/?(?:p|div|li|ul|ol|tr|table|thead|tbody|tfoot|h[1-6]|section|article|header|footer|nav|aside|main|blockquote|pre|hr|figure|figcaption|form|dl|dt|dd)\b[^>]*>/gi;
// A remaining tag: "<" / "</" then a letter, a tag-ish name, optional attrs, ">".
// Requiring a letter right after "<" leaves "a < b" and "2 > 1" untouched.
const TAG = /<\/?[a-z][a-z0-9-]*(?:\s[^<>]*?)?\/?>/gi;

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "--",
  ndash: "-",
  hellip: "...",
  copy: "(C)",
  reg: "(R)",
  trade: "(TM)",
  ldquo: '"',
  rdquo: '"',
  lsquo: "'",
  rsquo: "'",
};

const ENTITY = /&(#x?[0-9a-f]+|[a-z][a-z0-9]*);/gi;

function decodeEntities(input: string): string {
  return input.replace(ENTITY, (m, body: string) => {
    if (body[0] === "#") {
      const hex = body[1] === "x" || body[1] === "X";
      const cp = parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (Number.isFinite(cp) && cp > 0 && cp <= 0x10ffff) {
        try {
          return String.fromCodePoint(cp);
        } catch {
          return m;
        }
      }
      return m;
    }
    const named = NAMED[body.toLowerCase()];
    return named ?? m;
  });
}

/** Convert HTML markup to readable plain text. */
export function htmlToText(input: string): string {
  if (input.indexOf("<") === -1 && input.indexOf("&") === -1) return input; // fast path
  let s = input.replace(SCRIPT_STYLE, "");
  s = s.replace(COMMENT, "");
  s = s.replace(BR, "\n");
  s = s.replace(BLOCK, "\n");
  s = s.replace(TAG, "");
  return decodeEntities(s);
}
