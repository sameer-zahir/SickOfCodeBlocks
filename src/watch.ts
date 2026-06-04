// Clipboard watch mode: run once and keep cleaning the clipboard in place, so
// users never have to invoke the tool per-copy. Copy messy output anywhere and
// it is sanitized (and optionally redacted) the next poll.

import { sanitize, type SanitizeOptions } from "./pipeline.js";
import { readClipboard, writeClipboard } from "./io/clipboard.js";
import { summarizeChange } from "./io/summary.js";

export interface WatchState {
  last: string;
}

export type TickResult = "skip" | "cleaned" | "already-clean";

export interface WatchTickHooks {
  /** If provided and it returns false, the clipboard value is left untouched. */
  shouldProcess?: (s: string) => boolean;
  /** Called with a one-line summary after a successful clean + write. */
  onClean?: (summary: string) => void;
}

// C0 controls (incl. ESC 0x1B; excludes \t \n \r) + box-drawing + Nerd-Font PUA.
const MESSY = new RegExp(
  "[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u2500-\\u257F\\uE000-\\uF8FF]",
);
const CR_REDRAW = new RegExp("\\r(?!\\n|$)"); // carriage return mid-line = progress redraw

/** Heuristic: does this clipboard text look like raw terminal output worth cleaning? */
export function looksMessy(s: string): boolean {
  return MESSY.test(s) || CR_REDRAW.test(s);
}

/**
 * One watch iteration. Pure w.r.t. its injected I/O so it can be unit-tested.
 * Loop-safe: after we write a cleaned value we remember it (sanitize is
 * idempotent), so our own write is never reprocessed.
 */
export async function watchTick(
  read: () => string,
  write: (s: string) => void,
  sanitizeFn: (s: string) => Promise<string>,
  state: WatchState,
  hooks: WatchTickHooks = {},
): Promise<TickResult> {
  let current: string;
  try {
    current = read();
  } catch {
    return "skip"; // transient clipboard read failure; try again next tick
  }
  if (current === "" || current === state.last) return "skip";

  if (hooks.shouldProcess && !hooks.shouldProcess(current)) {
    state.last = current; // remember so we don't re-evaluate the same value each tick
    return "skip";
  }

  const cleaned = await sanitizeFn(current);
  if (cleaned === current) {
    state.last = current; // already clean; don't rewrite
    return "already-clean";
  }
  write(cleaned);
  state.last = cleaned;
  hooks.onClean?.(summarizeChange(current, cleaned));
  return "cleaned";
}

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Run the watch loop until the process is interrupted (Ctrl+C). */
export async function runWatch(
  options: SanitizeOptions,
  intervalMs: number,
  quiet = false,
): Promise<void> {
  const state: WatchState = { last: "" };
  if (!quiet) {
    process.stderr.write(
      `socb: watching clipboard${options.redact ? " (redacting)" : ""}, every ${intervalMs}ms. Press Ctrl+C to stop.\n`,
    );
  }

  const stop = () => {
    if (!quiet) process.stderr.write("\nsocb: stopped.\n");
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  // When the user opted into content flattening (markdown/html) they want every
  // copy transformed; otherwise only act on text that looks like terminal output,
  // so a plain `socb --watch` left running never rewrites ordinary text copies.
  const hooks: WatchTickHooks = {
    shouldProcess: options.markdown || options.html ? undefined : looksMessy,
    onClean: quiet ? undefined : (summary) => process.stderr.write(`socb: ${summary}\n`),
  };

  for (;;) {
    await watchTick(
      readClipboard,
      writeClipboard,
      (s) => sanitize(s, options),
      state,
      hooks,
    );
    await delay(intervalMs);
  }
}
