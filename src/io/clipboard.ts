// Cross-platform clipboard via native OS tools (no third-party dependency).

import { spawnSync, type SpawnSyncReturns } from "node:child_process";

export class ClipboardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClipboardError";
  }
}

const NO_TOOL =
  "No clipboard tool found. Install wl-clipboard (Wayland), xclip, or xsel.";

function run(
  cmd: string,
  args: string[],
  input?: string,
): SpawnSyncReturns<string> {
  return spawnSync(cmd, args, { encoding: "utf8", input, windowsHide: true });
}

function ok(r: SpawnSyncReturns<string>): boolean {
  return !r.error && r.status === 0;
}

/** Read text from the system clipboard. */
export function readClipboard(): string {
  if (process.platform === "win32") {
    const r = run("powershell", [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      "[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-Clipboard -Raw",
    ]);
    if (!ok(r)) throw new ClipboardError("Failed to read clipboard (Get-Clipboard).");
    return (r.stdout ?? "").replace(/\r?\n$/, "");
  }
  if (process.platform === "darwin") {
    const r = run("pbpaste", []);
    if (!ok(r)) throw new ClipboardError("Failed to read clipboard (pbpaste).");
    return r.stdout ?? "";
  }
  // Linux / BSD
  const tries: Array<[string, string[]]> = [];
  if (process.env.WAYLAND_DISPLAY) tries.push(["wl-paste", ["--no-newline"]]);
  tries.push(["xclip", ["-selection", "clipboard", "-o"]]);
  tries.push(["xsel", ["--clipboard", "--output"]]);
  for (const [cmd, args] of tries) {
    const r = run(cmd, args);
    if (ok(r)) return r.stdout ?? "";
  }
  throw new ClipboardError(NO_TOOL);
}

/** Write text to the system clipboard. */
export function writeClipboard(text: string): void {
  if (process.platform === "win32") {
    const r = run(
      "powershell",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "[Console]::InputEncoding=[Text.Encoding]::UTF8; Set-Clipboard -Value ([Console]::In.ReadToEnd())",
      ],
      text,
    );
    if (!ok(r)) throw new ClipboardError("Failed to write clipboard (Set-Clipboard).");
    return;
  }
  if (process.platform === "darwin") {
    const r = run("pbcopy", [], text);
    if (!ok(r)) throw new ClipboardError("Failed to write clipboard (pbcopy).");
    return;
  }
  const tries: Array<[string, string[]]> = [];
  if (process.env.WAYLAND_DISPLAY) tries.push(["wl-copy", []]);
  tries.push(["xclip", ["-selection", "clipboard"]]);
  tries.push(["xsel", ["--clipboard", "--input"]]);
  for (const [cmd, args] of tries) {
    const r = run(cmd, args, text);
    if (ok(r)) return;
  }
  throw new ClipboardError(NO_TOOL);
}
