// Tidy pasted PowerShell error / transcript output. A PS error record looks like:
//
//   Get-Item : Cannot find path 'C:\nope' because it does not exist.
//   At line:1 char:1
//   + Get-Item C:\nope
//   + ~~~~~~~~~~~~~~~~
//       + CategoryInfo          : ObjectNotFound: (C:\nope:String) [Get-Item], ...
//       + FullyQualifiedErrorId : PathNotFound,Microsoft.PowerShell.Commands.GetItemCommand
//
// We remove the "~~~~" underline lines and strip the leading "+ " continuation
// gutter, keeping the readable text (and the useful "At line:N char:M"). To avoid
// mangling unrelated input (e.g. a unified-diff "+added" line), this only acts
// when the text actually looks like PowerShell output, and the gutter form "+ "
// (plus a space) never matches a column-0 diff marker like "+added".

const AT_LINE = /^\s*At line:\d+ char:\d+\s*$/;
// Underline run, with or without the "+" gutter (matches fences.ts PS_UNDERLINE).
const PS_UNDERLINE = /^\s*(?:\+[ \t]*~[~ \t]*|~~[~ \t]*)$/;
// Leading "+ " continuation gutter (indent allowed), followed by real content.
const GUTTER = /^\s*\+ (?=\S)(.*)$/;

/** True when the text carries PowerShell error-record markers. */
function looksLikePowerShell(lines: string[]): boolean {
  return lines.some((l) => AT_LINE.test(l) || PS_UNDERLINE.test(l));
}

/** Remove PowerShell underline lines and the "+ " gutter from error output. */
export function cleanPowerShell(input: string): string {
  if (input.indexOf("~") === -1 && !/At line:\d+/.test(input)) return input; // fast path
  const lines = input.split("\n");
  if (!looksLikePowerShell(lines)) return input;

  const out: string[] = [];
  for (const line of lines) {
    if (PS_UNDERLINE.test(line)) continue; // drop the caret/tilde underline
    const m = GUTTER.exec(line);
    out.push(m ? (m[1] as string) : line);
  }
  return out.join("\n");
}
