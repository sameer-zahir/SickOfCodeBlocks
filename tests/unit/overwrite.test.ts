import { describe, it, expect } from "vitest";
import { resolveOverwrites } from "../../src/transforms/overwrite.js";

describe("resolveOverwrites", () => {
  it("collapses CR progress redraws to the final frame", () => {
    expect(resolveOverwrites("10%\r55%\r100%")).toBe("100%");
  });
  it("CR overwrite leaves the longer previous tail (no erase)", () => {
    expect(resolveOverwrites("longtext\rABC")).toBe("ABCgtext");
  });
  it("honors erase-line ESC[K after a CR redraw", () => {
    expect(resolveOverwrites("longtext\rABC\x1b[K")).toBe("ABC");
  });
  it("applies backspace", () => {
    expect(resolveOverwrites("abcXY\b\b12")).toBe("abc12");
  });
  it("ESC[2K erases the whole line", () => {
    expect(resolveOverwrites("garbage\x1b[2K\rdone")).toBe("done");
  });
  it("treats SGR as zero-width so colored progress collapses correctly", () => {
    // SGR is dropped here (escapes.ts would strip it anyway); the point is it
    // must not advance the cursor column, so the final colored frame wins.
    expect(resolveOverwrites("\x1b[32m10%\x1b[0m\r\x1b[32m100%\x1b[0m")).toBe(
      "100%",
    );
  });
  it("keeps multiple real lines", () => {
    expect(resolveOverwrites("a\nb\nc")).toBe("a\nb\nc");
  });
  it("is a no-op on a normal line", () => {
    expect(resolveOverwrites("hello world")).toBe("hello world");
  });
});
