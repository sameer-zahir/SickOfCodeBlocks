import { describe, it, expect } from "vitest";
import {
  normalizeWhitespace,
  type WhitespaceOptions,
} from "../../src/transforms/whitespace.js";

const cp = (...n: number[]) => String.fromCodePoint(...n);
const base: WhitespaceOptions = {
  expandTabs: false,
  newline: "lf",
  collapseBlankLines: true,
};

describe("normalizeWhitespace", () => {
  it("trims trailing whitespace per line", () => {
    expect(normalizeWhitespace("a  \nb\t", base)).toBe("a\nb");
  });
  it("collapses 3+ blank lines to one", () => {
    expect(normalizeWhitespace("a\n\n\n\n\nb", base)).toBe("a\n\nb");
  });
  it("trims leading/trailing blank lines", () => {
    expect(normalizeWhitespace("\n\nhi\n\n", base)).toBe("hi");
  });
  it("converts NBSP to a normal space", () => {
    expect(normalizeWhitespace("a" + cp(0x00a0) + "b", base)).toBe("a b");
  });
  it("deletes zero-width spaces but keeps ZWJ", () => {
    expect(normalizeWhitespace("a" + cp(0x200b) + "b", base)).toBe("ab");
    expect(normalizeWhitespace("a" + cp(0x200d) + "b", base)).toBe(
      "a" + cp(0x200d) + "b",
    );
  });
  it("normalizes CRLF to LF", () => {
    expect(normalizeWhitespace("a\r\nb", base)).toBe("a\nb");
  });
  it("emits CRLF when requested", () => {
    expect(normalizeWhitespace("a\nb", { ...base, newline: "crlf" })).toBe(
      "a\r\nb",
    );
  });
  it("expands tabs when requested", () => {
    expect(normalizeWhitespace("a\tb", { ...base, expandTabs: 2 })).toBe("a  b");
  });
});
