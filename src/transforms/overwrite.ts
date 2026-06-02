// Step 3 — resolve in-line redraws.
//
// This is the ONLY place \r (carriage return), \b (backspace) and the erase-line
// CSI (ESC[K / ESC[0K / ESC[1K / ESC[2K) are interpreted rather than deleted.
// We simulate a cursor over a mutable line buffer so a progress bar / spinner
// that redraws on the same line collapses to its FINAL visible state.
//
// Other escape sequences (color SGR, cursor moves, OSC, etc.) are zero-width and
// are simply skipped here (they get fully stripped in escapes.ts). We skip them so
// they don't wrongly advance the cursor column.
//
// Vertical/multi-line cursor redraws (ESC[1A then reprint) are NOT handled here —
// that requires a real screen model; use --emulate for those.

// Anchored matchers (match only at the start of the provided slice).
const A_CSI = /^(?:\x1b\[|\x9b)[0-?]*[ -\/]*[@-~]/;
const A_OSC = /^(?:\x1b\]|\x9d)[\s\S]*?(?:\x07|\x1b\\|\x9c)/;
const A_DCS = /^(?:\x1b[P_^X]|[\x90\x9f\x9e\x98])[\s\S]*?(?:\x1b\\|\x9c|\x07)/;
const A_ESC2 = /^\x1b[ -\/]*[0-~]/;

// Characters that introduce an escape sequence (ESC + the C1 introducers we handle).
const INTRODUCERS = "\x1b\x90\x9b\x9d\x9e\x9f\x98";

export function resolveOverwrites(input: string): string {
  if (!/[\r\b]/.test(input) && input.indexOf("\x1b[") === -1 && !/[\x9b]/.test(input)) {
    return input; // fast path: nothing to resolve
  }
  const lines = input.split("\n");
  for (let i = 0; i < lines.length; i++) {
    lines[i] = resolveLine(lines[i] ?? "");
  }
  return lines.join("\n");
}

function resolveLine(line: string): string {
  const buf: string[] = [];
  let col = 0;
  let i = 0;
  const n = line.length;

  while (i < n) {
    const c = line[i] as string;

    if (c === "\r") {
      col = 0;
      i += 1;
      continue;
    }
    if (c === "\b") {
      if (col > 0) col -= 1;
      i += 1;
      continue;
    }
    if (INTRODUCERS.indexOf(c) !== -1) {
      const rest = line.slice(i);
      const csi = A_CSI.exec(rest);
      if (csi) {
        const seq = csi[0];
        if (seq.endsWith("K")) applyEraseLine(buf, col, seq);
        i += seq.length;
        continue;
      }
      const other = A_OSC.exec(rest) ?? A_DCS.exec(rest) ?? A_ESC2.exec(rest);
      if (other) {
        i += other[0].length;
        continue;
      }
      // Lone ESC / C1 introducer with no valid sequence: drop the single char.
      i += 1;
      continue;
    }

    // Printable: pad any gap with spaces (e.g. after ESC[2K) then write.
    while (buf.length < col) buf.push(" ");
    buf[col] = c;
    col += 1;
    i += 1;
  }

  return buf.join("");
}

function applyEraseLine(buf: string[], col: number, seq: string): void {
  const m = /([0-9]*)K$/.exec(seq);
  const mode = m && m[1] ? m[1] : "0";
  if (mode === "0") {
    // erase from cursor to end of line
    if (buf.length > col) buf.length = col;
  } else if (mode === "1") {
    // erase from start of line to cursor (inclusive)
    for (let k = 0; k <= col; k++) buf[k] = " ";
  } else {
    // mode 2: erase the entire line (cursor column is unchanged)
    buf.length = 0;
  }
}
