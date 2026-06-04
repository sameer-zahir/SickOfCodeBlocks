import { describe, it, expect } from "vitest";
import { flattenMarkdown } from "../../src/transforms/markdown.js";

describe("flattenMarkdown - block structure", () => {
  it("strips ATX headings", () => {
    expect(flattenMarkdown("# Title")).toBe("Title");
    expect(flattenMarkdown("### H3 ###")).toBe("H3");
  });

  it("handles setext === headings (not ---)", () => {
    expect(flattenMarkdown("Title\n====")).toBe("Title");
  });

  it("strips blockquote markers, including nesting", () => {
    expect(flattenMarkdown("> quote")).toBe("quote");
    expect(flattenMarkdown(">> deep")).toBe("deep");
  });

  it("turns horizontal rules into a blank line", () => {
    expect(flattenMarkdown("---")).toBe("");
    expect(flattenMarkdown("***")).toBe("");
    expect(flattenMarkdown("___")).toBe("");
  });

  it("normalizes bullet markers to '-'", () => {
    expect(flattenMarkdown("* a\n+ b\n- c")).toBe("- a\n- b\n- c");
  });

  it("normalizes ordered list punctuation to '.'", () => {
    expect(flattenMarkdown("1. a\n2) b")).toBe("1. a\n2. b");
  });

  it("keeps task list checkboxes", () => {
    expect(flattenMarkdown("- [ ] todo\n- [x] done")).toBe("- [ ] todo\n- [x] done");
  });

  it("preserves nested-list indentation", () => {
    expect(flattenMarkdown("- a\n  - b")).toBe("- a\n  - b");
  });
});

describe("flattenMarkdown - inline", () => {
  it("strips bold, italic, and strikethrough", () => {
    expect(flattenMarkdown("**b** and *i* and ~~s~~")).toBe("b and i and s");
    expect(flattenMarkdown("__b__")).toBe("b");
  });

  it("keeps inline code content verbatim (no backticks)", () => {
    expect(flattenMarkdown("a `b*c` d")).toBe("a b*c d");
    expect(flattenMarkdown("use `npm test` now")).toBe("use npm test now");
  });

  it("rewrites links to 'text (url)' and collapses when equal", () => {
    expect(flattenMarkdown("[Anthropic](https://x.com)")).toBe("Anthropic (https://x.com)");
    expect(flattenMarkdown("[https://x.com](https://x.com)")).toBe("https://x.com");
  });

  it("unwraps autolinks and images", () => {
    expect(flattenMarkdown("<https://x.com>")).toBe("https://x.com");
    expect(flattenMarkdown("![alt](u)")).toBe("alt (u)");
  });

  it("unescapes backslash-escaped punctuation without re-interpreting it", () => {
    expect(flattenMarkdown("\\*not bold\\*")).toBe("*not bold*");
  });
});

describe("flattenMarkdown - fenced code", () => {
  it("removes fences and keeps the body verbatim", () => {
    expect(flattenMarkdown("```bash\nls *.py\n```")).toBe("ls *.py");
  });

  it("keeps emphasis-looking characters inside code intact", () => {
    expect(flattenMarkdown("```\nconst a_b = x->y;\n```")).toBe("const a_b = x->y;");
  });

  it("does not let a stray unclosed tilde fence swallow the document", () => {
    // A bare tilde underline must not be read as a fence opener.
    expect(flattenMarkdown("text\n~~~~~~\nmore")).toContain("more");
  });
});

describe("flattenMarkdown - false-positive guards", () => {
  it("leaves identifiers with underscores intact", () => {
    expect(flattenMarkdown("my_var_name")).toBe("my_var_name");
  });

  it("leaves globs and multiplication intact", () => {
    expect(flattenMarkdown("ls *.py")).toBe("ls *.py");
    expect(flattenMarkdown("area = 2 * 3")).toBe("area = 2 * 3");
  });

  it("does not treat code-span content as markup", () => {
    expect(flattenMarkdown("`**x**`")).toBe("**x**");
    expect(flattenMarkdown("`a_b_c`")).toBe("a_b_c");
  });

  it("does not treat '#' without a space as a heading", () => {
    expect(flattenMarkdown("#nospace")).toBe("#nospace");
    expect(flattenMarkdown("#!/bin/sh")).toBe("#!/bin/sh");
  });

  it("does not eat a Markdown pipe-table delimiter as a rule", () => {
    expect(flattenMarkdown("|---|---|")).toBe("|---|---|");
  });

  it("returns plain prose unchanged (fast path)", () => {
    expect(flattenMarkdown("just a normal sentence.")).toBe("just a normal sentence.");
  });
});

describe("flattenMarkdown - idempotence", () => {
  const samples = [
    "# Title",
    "**bold** and *italic*",
    "- a\n- b",
    "[x](https://y.com)",
    "a `code` span",
    "```\ncode -> here\n```",
    "> quote",
  ];
  for (const s of samples) {
    it(`is idempotent for ${JSON.stringify(s)}`, () => {
      const once = flattenMarkdown(s);
      expect(flattenMarkdown(once)).toBe(once);
    });
  }
});
