// Step 1 — OSC 8 hyperlinks.
//
// Terminals embed clickable links as:
//   ESC ] 8 ; params ; URI  (ST|BEL)  <visible text>  ESC ] 8 ; ; (ST|BEL)
// The generic OSC strip in escapes.ts would delete the whole thing (including the
// URL), so we MUST extract the link first and rewrite it to plain "text (url)".

const OSC8 =
  /\x1b\]8;[^;]*;([^\x07\x1b]*)(?:\x07|\x1b\\)([\s\S]*?)\x1b\]8;;(?:\x07|\x1b\\)/g;

/** Rewrite OSC 8 hyperlinks to "text (url)". Collapses when text === url. */
export function rewriteHyperlinks(input: string): string {
  if (input.indexOf("\x1b]8;") === -1) return input;
  return input.replace(OSC8, (_match, url: string, text: string) => {
    const u = url.trim();
    if (!text) return u; // no visible text -> just the URL
    if (text === u) return text; // bare URL auto-linked -> show once
    return `${text} (${u})`;
  });
}
