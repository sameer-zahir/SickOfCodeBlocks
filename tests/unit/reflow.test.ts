import { describe, it, expect } from "vitest";
import { reflowParagraphs } from "../../src/transforms/reflow.js";

const long = "This is a sufficiently long line of ordinary prose that wraps over"; // > 60 chars

describe("reflowParagraphs", () => {
  it("joins a long, unpunctuated wrap line with its continuation", () => {
    expect(reflowParagraphs(long + "\nhere onto the next line.")).toBe(
      long + " here onto the next line.",
    );
  });

  it("does not join a short standalone line (e.g. a heading)", () => {
    expect(reflowParagraphs("Title\nbody text follows")).toBe("Title\nbody text follows");
  });

  it("does not join across a blank line (paragraph break)", () => {
    expect(reflowParagraphs(long + "\n\nnext paragraph")).toBe(long + "\n\nnext paragraph");
  });

  it("does not join when the previous line ends a sentence", () => {
    const sentence = long + ".";
    expect(reflowParagraphs(sentence + "\nnext")).toBe(sentence + "\nnext");
  });

  it("does not join into a following list item", () => {
    expect(reflowParagraphs(long + "\n- a list item")).toBe(long + "\n- a list item");
  });

  it("does not join an indented (code/quote) continuation", () => {
    expect(reflowParagraphs(long + "\n    indented")).toBe(long + "\n    indented");
  });

  it("returns single-line input unchanged", () => {
    expect(reflowParagraphs("one line only")).toBe("one line only");
  });
});
