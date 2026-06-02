import { describe, it, expect } from "vitest";
import { stripEmoji } from "../../src/transforms/emoji.js";

const cp = (...n: number[]) => String.fromCodePoint(...n);

describe("stripEmoji", () => {
  it("removes a basic emoji", () => {
    expect(stripEmoji("ok " + cp(0x1f44d) + " done")).toBe("ok  done");
  });
  it("removes ZWJ family sequences entirely", () => {
    const family = cp(0x1f468, 0x200d, 0x1f469, 0x200d, 0x1f467);
    expect(stripEmoji("a" + family + "b")).toBe("ab");
  });
  it("removes skin-tone modifiers and variation selectors", () => {
    expect(stripEmoji(cp(0x1f44d, 0x1f3fb) + cp(0x2714, 0xfe0f))).toBe("");
  });
  it("leaves plain text untouched", () => {
    expect(stripEmoji("just text")).toBe("just text");
  });
});
