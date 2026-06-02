import { describe, it, expect } from "vitest";
import { rewriteHyperlinks } from "../../src/transforms/hyperlinks.js";

describe("rewriteHyperlinks", () => {
  it("rewrites an OSC 8 link to 'text (url)'", () => {
    expect(
      rewriteHyperlinks("\x1b]8;;https://example.com\x07click\x1b]8;;\x07"),
    ).toBe("click (https://example.com)");
  });
  it("collapses when visible text equals the URL", () => {
    expect(
      rewriteHyperlinks(
        "\x1b]8;;https://example.com\x07https://example.com\x1b]8;;\x07",
      ),
    ).toBe("https://example.com");
  });
  it("handles the ST-terminated form", () => {
    expect(
      rewriteHyperlinks("\x1b]8;;https://example.com\x1b\\click\x1b]8;;\x1b\\"),
    ).toBe("click (https://example.com)");
  });
  it("is a no-op when there are no links", () => {
    expect(rewriteHyperlinks("no links here")).toBe("no links here");
  });
});
