#!/usr/bin/env node
// EXPERIMENTAL, opt-in PreToolUse hook for Claude Code.
//
// Goal: denoise the output of noisy Bash commands through `socb --agent` BEFORE
// it enters the model's context, to cut tokens and strip ANSI / progress-bar /
// box-drawing / glyph noise.
//
// Why PreToolUse and not PostToolUse: a PostToolUse hook fires AFTER the tool
// output is already committed to context and cannot rewrite it. A PreToolUse hook
// CAN rewrite the command (hookSpecificOutput.updatedInput), so we wrap it to
// capture combined stdout+stderr to a temp file, print the cleaned version, and
// preserve the original exit code.
//
// Conservative by design: only wraps a known set of noisy build/test/infra tools,
// and never a command that is multi-line, already pipes through socb, or reads a
// heredoc. Everything else passes through byte-for-byte. Requires `socb` on PATH
// (`npm i -g sickofcodeblocks`); if socb is missing at run time the wrapper falls
// back to the raw output so nothing is lost.
//
// Caveats: the Claude Code Bash tool runs commands through bash (git-bash on
// Windows, where pipes are byte-faithful — note that native PowerShell piping is
// not, so do NOT wire this to a PowerShell-based runner without the temp-file
// form below). Wrapping changes how stdout/stderr interleave (both go to one
// stream). Verify behavior with your Claude Code version before relying on it.
//
// Install in .claude/settings.json:
//   {
//     "hooks": {
//       "PreToolUse": [
//         {
//           "matcher": "Bash",
//           "hooks": [
//             { "type": "command", "command": "node /ABS/PATH/hooks/socb-clean.mjs" }
//           ]
//         }
//       ]
//     }
//   }

import { readFileSync } from "node:fs";

const NOISY = new Set([
  "npm", "pnpm", "yarn", "npx", "bun",
  "pip", "pip3", "poetry", "uv",
  "cargo", "go", "mvn", "gradle", "make",
  "docker", "docker-compose", "kubectl", "helm", "terraform",
  "pytest", "tox", "jest", "vitest", "mocha", "vite", "webpack", "tsc", "eslint",
  "apt", "apt-get", "brew", "dnf", "yum",
]);

/** Emit a no-op result (leave the command untouched) and exit. */
function passthrough() {
  process.stdout.write("{}");
  process.exit(0);
}

let event;
try {
  event = JSON.parse(readFileSync(0, "utf8"));
} catch {
  passthrough();
}

if (!event || event.tool_name !== "Bash") passthrough();

const command = event.tool_input && event.tool_input.command;
if (typeof command !== "string" || command.trim() === "") passthrough();

// Skip anything we shouldn't touch.
if (command.includes("\n") || /\bsocb\b/.test(command) || command.includes("<<")) {
  passthrough();
}

// First meaningful token (skip leading VAR=val assignments and "sudo").
const tokens = command.trim().split(/\s+/);
let i = 0;
while (i < tokens.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[i])) i++;
if (tokens[i] === "sudo") i++;
const tool = (tokens[i] || "").split("/").pop();
if (!NOISY.has(tool)) passthrough();

// Run the command, capture combined output to a temp file, clean it, and keep
// the original exit code. (bash syntax — the Bash tool runs through bash.)
const inner = command.trim().replace(/;+$/, "");
const wrapped =
  '__socb_t="$(mktemp)"; { ' +
  inner +
  '; } >"$__socb_t" 2>&1; __socb_rc=$?; ' +
  'socb --agent <"$__socb_t" 2>/dev/null || cat "$__socb_t"; ' +
  'rm -f "$__socb_t"; exit $__socb_rc';

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      updatedInput: { command: wrapped },
    },
  }),
);
