import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const HOOK = resolve(here, "../../hooks/socb-clean.mjs");

/** Run the hook with a PreToolUse event, return parsed stdout JSON. */
function runHook(event: unknown): any {
  const r = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(event),
    encoding: "utf8",
  });
  expect(r.status).toBe(0);
  return JSON.parse(r.stdout);
}

const bash = (command: string) => ({ tool_name: "Bash", tool_input: { command } });

describe("socb-clean PreToolUse hook", () => {
  it("wraps a noisy command through 'socb --agent', preserving it", () => {
    const out = runHook(bash("npm test"));
    const cmd = out.hookSpecificOutput.updatedInput.command;
    expect(out.hookSpecificOutput.hookEventName).toBe("PreToolUse");
    expect(cmd).toContain("npm test");
    expect(cmd).toContain("socb --agent");
    expect(cmd).toContain("exit $__socb_rc"); // original exit code preserved
  });

  it("looks past leading env assignments to find the tool", () => {
    const out = runHook(bash("CI=1 NODE_ENV=test pytest -q"));
    expect(out.hookSpecificOutput.updatedInput.command).toContain("pytest -q");
  });

  it("leaves a non-noisy command untouched", () => {
    expect(runHook(bash("ls -la"))).toEqual({});
    expect(runHook(bash("cat file.txt"))).toEqual({});
  });

  it("does not double-wrap a command that already uses socb", () => {
    expect(runHook(bash("npm test | socb"))).toEqual({});
  });

  it("skips multi-line scripts and heredocs", () => {
    expect(runHook(bash("npm test\nnpm run build"))).toEqual({});
    expect(runHook(bash("cat <<EOF\nhi\nEOF"))).toEqual({});
  });

  it("ignores non-Bash tools", () => {
    expect(runHook({ tool_name: "Read", tool_input: { file_path: "x" } })).toEqual({});
  });
});
