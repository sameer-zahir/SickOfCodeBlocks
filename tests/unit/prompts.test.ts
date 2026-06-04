import { describe, it, expect } from "vitest";
import { stripPrompts } from "../../src/transforms/prompts.js";

describe("stripPrompts", () => {
  it("strips a POSIX '$ ' prompt", () => {
    expect(stripPrompts("$ npm test")).toBe("npm test");
  });

  it("strips a PowerShell 'PS path>' prompt", () => {
    expect(stripPrompts("PS C:\\Users\\me> dir")).toBe("dir");
  });

  it("strips a Python REPL '>>>' prompt", () => {
    expect(stripPrompts(">>> print(1)")).toBe("print(1)");
  });

  it("strips a user@host:path$ prompt", () => {
    expect(stripPrompts("me@host:~/proj$ ls -la")).toBe("ls -la");
  });

  it("does not strip a bare '$' with no following space (variables)", () => {
    expect(stripPrompts("$var = 5")).toBe("$var = 5");
  });

  it("does not strip a bare '>' (blockquote / redirection)", () => {
    expect(stripPrompts("> quoted")).toBe("> quoted");
  });

  it("handles multiple lines, only touching the prompt", () => {
    expect(stripPrompts("$ echo hi\nhi")).toBe("echo hi\nhi");
  });

  it("returns prompt-free text unchanged (fast path)", () => {
    expect(stripPrompts("plain line\nanother")).toBe("plain line\nanother");
  });
});
