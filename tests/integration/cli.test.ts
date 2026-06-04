import { describe, it, expect, beforeAll } from "vitest";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(here, "../../dist/cli.js");

function run(args: string[], input?: string): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [CLI, ...args], {
    input,
    encoding: "utf8",
  });
}

describe("cli integration (spawns the built binary)", () => {
  beforeAll(() => {
    if (!existsSync(CLI)) {
      throw new Error("dist/cli.js missing — run `npm run build` (npm test does this).");
    }
  });

  it("--version prints a semver", () => {
    const r = run(["--version"]);
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("--help prints usage", () => {
    const r = run(["--help"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("USAGE");
  });

  it("cleans piped stdin (ANSI + carriage-return redraw)", () => {
    const r = run([], "\x1b[31mred\x1b[0m text\r\x1b[31mred\x1b[0m TEXT");
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("red TEXT\n");
  });

  it("preserves UTF-8 through the stdin pipe (no mangling)", () => {
    const r = run([], "café " + String.fromCodePoint(0x1f680));
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("café " + String.fromCodePoint(0x1f680) + "\n");
  });

  it("redacts secrets with --redact", () => {
    const r = run(["--redact"], "key AKIAIOSFODNN7EXAMPLE end");
    expect(r.stdout).toBe("key [REDACTED:aws-key] end\n");
  });

  it("reconstructs a table with default options", () => {
    const r = run([], "| Name | Age |\n|------|-----|\n| Bob  | 30  |");
    expect(r.stdout).toBe("Name  Age\nBob   30\n");
  });

  it("flattens Markdown with the --email preset", () => {
    const r = run(["--email"], "# Title\n\n- **bold** item\n");
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("Title\n\n- bold item\n");
  });

  it("leaves Markdown literal by default (opt-in only)", () => {
    const r = run([], "# not a heading by default");
    expect(r.stdout).toBe("# not a heading by default\n");
  });

  it("lets --no-markdown override the --email preset", () => {
    const r = run(["--email", "--no-markdown"], "# Hi");
    expect(r.stdout).toBe("# Hi\n");
  });

  it("keeps fenced code verbatim (protected from flattening) under --email", () => {
    const r = run(["--email"], "```py\ncall(**kwargs)  # see [docs](url)\n```");
    expect(r.stdout).toBe("call(**kwargs)  # see [docs](url)\n");
  });

  it("--agent strips ANSI noise but keeps Markdown markup", () => {
    const r = run(["--agent"], "**bold** \x1b[31mred\x1b[0m");
    expect(r.stdout).toBe("**bold** red\n");
  });

  it("--ps tidies a PowerShell error block", () => {
    const r = run(["--ps"], "At line:1 char:1\n+ Get-Item foo\n+ ~~~~~~~~");
    expect(r.stdout).toBe("At line:1 char:1\nGet-Item foo\n");
  });

  it("--html strips tags and decodes entities", () => {
    const r = run(["--html"], "<p>a &amp; b</p>");
    expect(r.stdout).toBe("a & b\n");
  });

  it("exits 2 on an unknown flag", () => {
    const r = run(["--definitely-not-a-flag"]);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("error:");
  });

  it("does not hang on empty input", () => {
    const r = run([], "");
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
  });
});
