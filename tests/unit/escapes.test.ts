import { describe, it, expect } from "vitest";
import { stripEscapes, stripLooseControls } from "../../src/transforms/escapes.js";

describe("stripEscapes", () => {
  it("removes SGR color codes", () => {
    expect(stripEscapes("\x1b[31mred\x1b[0m")).toBe("red");
  });
  it("removes 256-color and truecolor SGR", () => {
    expect(stripEscapes("\x1b[38;5;208mA\x1b[38;2;255;128;0mB\x1b[0m")).toBe("AB");
  });
  it("removes cursor-movement and erase CSI", () => {
    expect(stripEscapes("a\x1b[2Cb\x1b[1A\x1b[2K")).toBe("ab");
  });
  it("removes OSC title (BEL- and ST-terminated)", () => {
    expect(stripEscapes("\x1b]0;title\x07X")).toBe("X");
    expect(stripEscapes("\x1b]0;title\x1b\\X")).toBe("X");
  });
  it("removes DCS payloads (sixel) — the ansi-regex gap", () => {
    expect(stripEscapes("A\x1bPq#0;2;payload\x1b\\B")).toBe("AB");
  });
  it("removes APC payloads (Kitty graphics) — the ansi-regex gap", () => {
    expect(stripEscapes("A\x1b_Gf=100;base64==\x1b\\B")).toBe("AB");
  });
  it("removes 2-byte ESC (charset designation, RIS reset)", () => {
    expect(stripEscapes("\x1b(BX\x1bcY")).toBe("XY");
  });
  it("removes C1 CSI introducer (0x9b)", () => {
    expect(stripEscapes("\x9b31mhi")).toBe("hi");
  });
  it("is a no-op on plain text", () => {
    expect(stripEscapes("plain text")).toBe("plain text");
  });
});

describe("stripLooseControls", () => {
  it("drops NUL/BEL/DEL", () => {
    expect(stripLooseControls("a\x00b\x07c\x7fd")).toBe("abcd");
  });
  it("converts VT/FF to newline", () => {
    expect(stripLooseControls("a\x0bb\x0cc")).toBe("a\nb\nc");
  });
  it("keeps tab and newline", () => {
    expect(stripLooseControls("a\tb\nc")).toBe("a\tb\nc");
  });
});
