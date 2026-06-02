import { describe, it, expect } from "vitest";
import { emulate } from "../../src/transforms/emulate.js";
import { sanitize } from "../../src/pipeline.js";

// @xterm/headless is an optional dependency; skip gracefully if it's absent.
let available = true;
try {
  await import("@xterm/headless");
} catch {
  available = false;
}

describe.skipIf(!available)("emulate (headless terminal)", () => {
  it("flattens a cursor-up multi-line redraw to the final frame", async () => {
    const input =
      "layer1 downloading\nlayer2 downloading\n" + // two live lines
      "\x1b[2A\rlayer1 done\x1b[K\n" + // up 2, rewrite row 0
      "\rlayer2 done\x1b[K\n"; // rewrite row 1
    const out = await emulate(input, { cols: 80, rows: 24 });
    expect(out).toContain("layer1 done");
    expect(out).toContain("layer2 done");
    expect(out).not.toContain("downloading");
  });

  it("works through sanitize({ emulate: true })", async () => {
    const input = "a\nb\n\x1b[2A\rX\x1b[K\n\rY\x1b[K\n";
    const out = await sanitize(input, { emulate: true });
    expect(out).toBe("X\nY");
  });
});
