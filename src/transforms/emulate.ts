// Step 2 — headless-terminal emulation (opt-in: --emulate).
//
// The only correct way to flatten MULTI-LINE redraws (docker pull layer lists,
// cargo live status, pip multi-bar, full-screen TUIs) is to replay the bytes
// through a real terminal screen model and read back the final grid.
//
// @xterm/headless is an OPTIONAL dependency, loaded lazily so the common pipe
// path never pays for it. If it isn't installed we throw EmulateUnavailableError.

export class EmulateUnavailableError extends Error {
  constructor() {
    super(
      "--emulate requires the optional package '@xterm/headless'.\n" +
        "Install it with:  npm install -g @xterm/headless   (or: npm install @xterm/headless)",
    );
    this.name = "EmulateUnavailableError";
  }
}

export interface EmulateOptions {
  cols: number;
  rows: number;
}

export async function emulate(
  input: string,
  opts: EmulateOptions,
): Promise<string> {
  let mod: any;
  try {
    mod = await import("@xterm/headless");
  } catch {
    throw new EmulateUnavailableError();
  }

  const Terminal = mod.Terminal ?? mod.default?.Terminal;
  if (typeof Terminal !== "function") throw new EmulateUnavailableError();

  const term = new Terminal({
    cols: opts.cols,
    rows: opts.rows,
    scrollback: opts.rows,
    allowProposedApi: true,
  });

  // write() parses asynchronously; its callback fires once the data is consumed.
  await new Promise<void>((resolve) => term.write(input, resolve));

  const buffer = term.buffer.active;
  const total = buffer.length; // includes scrollback so long output isn't clipped
  const lines: string[] = [];
  for (let y = 0; y < total; y++) {
    const line = buffer.getLine(y);
    lines.push(line ? line.translateToString(true) : ""); // trimRight = true
  }
  if (typeof term.dispose === "function") term.dispose();

  // Drop trailing empty rows left by the fixed-height grid.
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}
