// Step 10 — secret / PII redaction (opt-in: --redact). Best-effort, NOT a
// security guarantee. Runs after escapes are stripped so patterns match clean
// text. Specific high-signal patterns run before generic ones so the generic
// token rule does not swallow a more precisely-labeled match.

interface Pattern {
  label: string;
  re: RegExp;
  replace?: (...groups: string[]) => string;
}

const PATTERNS: Pattern[] = [
  { label: "aws-key", re: /\bAKIA[0-9A-Z]{16}\b/g },
  { label: "github-token", re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g },
  { label: "slack-token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { label: "openai-key", re: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { label: "jwt", re: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g },
  {
    label: "bearer",
    re: /\bBearer\s+[A-Za-z0-9._~+/-]{12,}=*/g,
    replace: () => "Bearer [REDACTED:bearer]",
  },
  {
    label: "kv-secret",
    re: /\b(api[_-]?key|token|secret|password|passwd|pwd)(\s*[=:]\s*)(['"]?)([^\s'"]{6,})\3/gi,
    replace: (_m, key, sep) => `${key}${sep}[REDACTED:secret]`,
  },
  { label: "email", re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  {
    // Home-directory paths -> ~  (Windows C:\Users\name, macOS /Users/name, Linux /home/name)
    label: "home-path",
    re: /([A-Za-z]:\\Users\\|\/Users\/|\/home\/)[^\\/\s:*?"<>|]+/g,
    replace: () => "~",
  },
];

// IPv4 with octet validation (cuts false positives like version strings).
const IPV4 = /\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/g;
// Generic long hex/base token — runs LAST, most false-positive-prone.
const GENERIC_TOKEN = /\b[A-Fa-f0-9]{32,}\b/g;

/**
 * Mask secrets / PII. `maxLineLength` skips the generic-token sweep on very long
 * lines (a cheap guard against pathological inputs).
 */
export function redact(input: string, maxLineLength = Infinity): string {
  let s = input;

  for (const p of PATTERNS) {
    s = s.replace(p.re, (...args: string[]) => {
      const groups = args.slice(0, -2); // drop offset + whole string
      return p.replace
        ? p.replace(...groups)
        : `[REDACTED:${p.label}]`;
    });
  }

  s = s.replace(IPV4, (m, a: string, b: string, c: string, d: string) => {
    const ok = [a, b, c, d].every((o) => Number(o) <= 255);
    return ok ? "[REDACTED:ipv4]" : m;
  });

  s = s
    .split("\n")
    .map((line) =>
      line.length > maxLineLength
        ? line
        : line.replace(GENERIC_TOKEN, "[REDACTED:token]"),
    )
    .join("\n");

  return s;
}
