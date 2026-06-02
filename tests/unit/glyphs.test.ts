import { describe, it, expect } from "vitest";
import { stripGlyphs } from "../../src/transforms/glyphs.js";

const cp = (...n: number[]) => String.fromCodePoint(...n);

describe("stripGlyphs", () => {
  it("strips a BMP PUA (Nerd Font) icon and its gutter space", () => {
    expect(stripGlyphs(cp(0xf015) + " home")).toBe("home");
  });
  it("strips Powerline separators", () => {
    expect(stripGlyphs("a" + cp(0xe0b0) + "b")).toBe("ab");
  });
  it("strips supplementary-plane PUA", () => {
    expect(stripGlyphs(cp(0xf0001) + "x")).toBe("x");
  });
  it("strips block-element bar fills (eating the gutter space)", () => {
    expect(stripGlyphs(cp(0x2588, 0x2588, 0x2591) + " 50%")).toBe("50%");
  });
  it("strips IEC power symbols", () => {
    expect(stripGlyphs(cp(0x23fb) + "power")).toBe("power");
  });
  it("keeps ordinary text", () => {
    expect(stripGlyphs("hello world")).toBe("hello world");
  });
});
