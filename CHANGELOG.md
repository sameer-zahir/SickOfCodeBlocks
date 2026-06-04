# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/), and this project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- **Markdown flattening** (`--markdown` / `-m`; on in `--email` / `--plain`):
  drops headings, `**bold**`/`*italic*`/`~~strike~~`, inline `` `code` `` and list
  markers, rewrites `[text](url)` → `text (url)`, and unwraps autolinks/images.
  Fenced and inline code are kept **verbatim** — shielded from inline stripping
  and typography via a sentinel pass. New `flattenMarkdown` transform.
- **HTML → text** (`--html`): strip tags, drop script/style, decode entities.
- **PowerShell cleanup** (`--powershell` / `--ps`): drop `~~~~` underlines and the
  `+ ` continuation gutter from pasted error records (block-anchored so diffs are
  safe). New `cleanPowerShell` transform.
- **Shell-prompt stripping** (`--prompts`): `$ `, `PS C:\>`, `>>>`, `user@host:…$`.
- **Paragraph reflow** (`--reflow`): rejoin hard-wrapped prose for proportional
  fonts (conservative; under-joins rather than over-joins).
- **`--agent` preset**: denoise for feeding output *into* a model — strip
  ANSI/box/glyph noise but keep Markdown structure and Unicode.
- **UTF-16 / BOM input decoding**: Windows files and clipboard exports no longer
  mojibake. New `decodeInput` helper.
- **MCP server** (`socb-mcp`): exposes `sanitize_text` to Claude Desktop / Claude
  Code / Codex. `@modelcontextprotocol/sdk` is an optional dependency.
- **Experimental PreToolUse hook** (`hooks/socb-clean.mjs`) that pipes noisy Bash
  output through `socb --agent` before it reaches the model's context.
- Markdown pipe tables with GitHub alignment delimiters (`| :--: |`) are now
  recognized by the table engine.
- Strip Markdown code fences (```` ``` ````/`~~~`) and PowerShell `~~~~~` error
  underlines so pasted output is fence-free (on by default; `--no-fences` to
  keep them). New `stripFences` option / exported transform.
- Initial release: `sickofcodeblocks` / `socb` CLI.
- Core pipeline: OSC 8 hyperlink rewrite, carriage-return/spinner collapse,
  augmented ANSI/OSC/DCS/APC escape stripping, Nerd Font/Powerline glyph
  removal, box-drawing table reconstruction, smart-punctuation → ASCII,
  whitespace normalization.
- `--emulate` headless-terminal mode for multi-line redraws.
- `--redact` secret/PII masking.
- `--slack` / `--email` / `--plain` presets.
- `--clip` clipboard input/output.
- `--watch` clipboard-watch mode: clean every copy in place automatically.
- Config file (`~/.socbrc.json` / `./.socbrc.json`) for persistent default options.
