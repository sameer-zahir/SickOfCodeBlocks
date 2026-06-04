// Strip leading shell prompts so a copied terminal session pastes as just the
// commands and their output. Conservative on purpose: we only remove prompts
// that are unambiguous. In particular we do NOT touch a bare ">" (Markdown
// blockquote / redirection) or a bare "#" (heading / comment).
//
//   $ npm test            -> npm test
//   PS C:\Users\me> dir   -> dir
//   >>> print("hi")       -> print("hi")
//   me@host:~/p$ ls       -> ls

const PROMPTS: readonly RegExp[] = [
  /^\s*\$ (?=\S)/, // POSIX shell "$ " (space required, so "$var"/"$5" are safe)
  /^\s*PS [^>\n]*> ?/, // PowerShell "PS C:\path> "
  /^\s*>>> ?/, // Python REPL primary prompt
  /^\s*[\w.-]+@[\w.-]+:[^\s$#]*[$#] (?=\S)/, // user@host:path$ / user@host:path#
];

// Fast path: only worth scanning if a prompt-ish marker could be present.
const HAS_PROMPT = /^\s*(?:\$ |PS [^>\n]*>|>>>|[\w.-]+@[\w.-]+:)/m;

/** Remove conservative leading shell prompts from each line. */
export function stripPrompts(input: string): string {
  if (!HAS_PROMPT.test(input)) return input;
  return input
    .split("\n")
    .map((line) => {
      for (const re of PROMPTS) {
        const m = re.exec(line);
        if (m) return line.slice(m[0].length);
      }
      return line;
    })
    .join("\n");
}
