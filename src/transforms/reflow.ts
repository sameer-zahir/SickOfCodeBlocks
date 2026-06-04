// Rejoin hard-wrapped prose so it flows in a proportional-font destination
// (email, Docs) instead of breaking at the original ~72-80 column wrap.
//
// Deliberately conservative — under-joining is far better than gluing unrelated
// lines together. We only join a line onto the previous one when the previous
// line looks like a *filled* wrap line: long, plain prose, not ending in
// sentence/clause punctuation. That leaves list items, code (sentinel lines from
// the Markdown pass), blockquotes/indented blocks, table rows, and paragraph
// breaks (blank lines) untouched.

const MIN_WRAP_LEN = 60; // shorter "prev" lines are likely headings / standalone
const NUL = String.fromCharCode(0); // protected-code sentinel delimiter (markdown.ts)

function isStructured(line: string): boolean {
  if (line.trim() === "") return true; // blank = paragraph break
  if (/^\s/.test(line)) return true; // indented: code / quote / nested list
  if (line.indexOf("|") !== -1) return true; // table row
  if (line.indexOf(NUL) !== -1) return true; // protected code sentinel
  if (/^#{1,6}(?:\s|$)/.test(line)) return true; // ATX heading (raw)
  if (/^>/.test(line)) return true; // blockquote (raw)
  if (/^(?:[-*+]|\d+[.)])\s/.test(line)) return true; // list item (raw or normalized)
  if (/^[-=*_ ]{3,}$/.test(line)) return true; // horizontal rule / setext underline
  return false;
}

function canJoin(prev: string, cur: string): boolean {
  if (isStructured(prev) || isStructured(cur)) return false;
  const p = prev.replace(/\s+$/, "");
  if (p.length < MIN_WRAP_LEN) return false; // short => not a wrapped continuation
  if (/[.!?:;,)\]]$/.test(p)) return false; // clause/sentence end => keep the break
  return true;
}

/** Join hard-wrapped prose lines into flowing paragraphs (conservative). */
export function reflowParagraphs(input: string): string {
  if (input.indexOf("\n") === -1) return input;
  const lines = input.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    const prev = out[out.length - 1];
    if (prev !== undefined && canJoin(prev, line)) {
      out[out.length - 1] = prev.replace(/\s+$/, "") + " " + line.replace(/^\s+/, "");
    } else {
      out.push(line);
    }
  }
  return out.join("\n");
}
