import { describe, it, expect } from "vitest";
import { normalizeTypography } from "../../src/transforms/typography.js";

const cp = (...n: number[]) => String.fromCodePoint(...n);

describe("normalizeTypography", () => {
  it("converts dashes", () => {
    expect(normalizeTypography("a" + cp(0x2014) + "b")).toBe("a--b");
    expect(normalizeTypography("a" + cp(0x2013) + "b")).toBe("a-b");
  });
  it("converts curly quotes", () => {
    expect(
      normalizeTypography(cp(0x201c) + "hi" + cp(0x201d)),
    ).toBe('"hi"');
    expect(normalizeTypography(cp(0x2018) + "x" + cp(0x2019))).toBe("'x'");
  });
  it("converts ellipsis and bullets", () => {
    expect(normalizeTypography("wait" + cp(0x2026))).toBe("wait...");
    expect(normalizeTypography(cp(0x2022) + " item")).toBe("* item");
  });
  it("leaves arrows alone by default", () => {
    expect(normalizeTypography("a" + cp(0x2192) + "b")).toBe(
      "a" + cp(0x2192) + "b",
    );
  });
  it("converts arrows when enabled", () => {
    expect(normalizeTypography("a" + cp(0x2192) + "b", true)).toBe("a->b");
  });
  it("leaves ASCII untouched", () => {
    expect(normalizeTypography("plain - text ...")).toBe("plain - text ...");
  });
});
