import { describe, it, expect } from "vitest";
import { sanitize, shouldSuggestEmulate } from "../../src/pipeline.js";

const cp = (...n: number[]) => String.fromCodePoint(...n);

describe("sanitize (pipeline)", () => {
  it("preserves the OSC 8 URL even when wrapped in color (step 1 before 4)", async () => {
    expect(
      await sanitize(
        "\x1b[34m\x1b]8;;https://x.com\x07link\x1b]8;;\x07\x1b[0m",
      ),
    ).toBe("link (https://x.com)");
  });

  it("collapses a colored progress bar to its final frame (step 3 before 4)", async () => {
    expect(await sanitize("\x1b[32m10%\x1b[0m\r\x1b[32m100%\x1b[0m")).toBe("100%");
  });

  it("cleans a realistic mixed sample", async () => {
    const input =
      "\x1b[1;32mBuild\x1b[0m " +
      cp(0xf015) +
      " step\r\x1b[1;32mBuild done\x1b[0m\x1b[K\n\n\n\nbye" +
      cp(0x2026);
    expect(await sanitize(input)).toBe("Build done\n\nbye...");
  });

  it("is idempotent (running twice equals once)", async () => {
    const samples = [
      "\x1b[31mred\x1b[0m\r100%\x1b[K",
      "| a | b |\n|---|---|\n| 1 | 2 |",
      cp(0xe0b0) + " prompt " + cp(0x2192),
      "smart " + cp(0x201c) + "quote" + cp(0x201d) + cp(0x2026),
    ];
    for (const s of samples) {
      const once = await sanitize(s);
      const twice = await sanitize(once);
      expect(twice).toBe(once);
    }
  });

  it("honors options (strip-emoji)", async () => {
    expect(await sanitize("hi " + cp(0x1f44d), { stripEmoji: true })).toBe("hi");
  });

  it("flags input that needs --emulate", () => {
    expect(shouldSuggestEmulate("line\x1b[1Aredraw")).toBe(true);
    expect(shouldSuggestEmulate("plain text")).toBe(false);
  });

  it("handles a 5MB single line within the perf budget", async () => {
    const big = "x".repeat(5_000_000);
    const start = performance.now();
    const out = await sanitize(big);
    expect(out.length).toBe(5_000_000);
    expect(performance.now() - start).toBeLessThan(1000);
  });
});
