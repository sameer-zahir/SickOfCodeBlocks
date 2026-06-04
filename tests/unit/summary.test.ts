import { describe, it, expect } from "vitest";
import { summarizeChange } from "../../src/io/summary.js";

describe("summarizeChange", () => {
  it("reports 'already clean' when nothing changed", () => {
    expect(summarizeChange("hello world", "hello world")).toBe("already clean");
  });

  it("counts removed escape sequences", () => {
    const raw = "\x1b[31mred\x1b[0m\r100%\x1b[K";
    const s = summarizeChange(raw, "100%");
    expect(s).toContain("cleaned:");
    expect(s).toContain("3 escape sequences removed");
  });

  it("notes a line-count reduction", () => {
    expect(summarizeChange("a\nb\nc", "a")).toContain("3 -> 1 lines");
  });

  it("uses singular wording for one escape", () => {
    expect(summarizeChange("\x1b[Kx", "x")).toContain("1 escape sequence removed");
  });
});
