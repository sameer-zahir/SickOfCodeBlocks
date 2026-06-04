// Output presets. Each returns a partial option bundle that is layered over the
// defaults; explicit CLI flags still override the preset (see options.ts).

import type { SanitizeOptions } from "./pipeline.js";

export type Preset = "slack" | "email" | "plain" | "agent";

export function presetPatch(preset: Preset): Partial<SanitizeOptions> {
  switch (preset) {
    case "slack":
      // Slack renders Unicode fine; reconstructed tables read well in a code-less
      // paste. Strip Nerd Font glyphs (the reader won't have the font).
      return {
        tableMode: "reconstruct",
        stripEmoji: false,
        stripGlyphs: true,
        typographic: true,
      };
    case "email":
      // Email is often a proportional font -> aligned tables break; strip borders.
      // Flatten Markdown so an AI answer / README pastes as plain prose. HTML,
      // prompts, reflow, and PowerShell cleanup are left opt-in — they can mangle
      // ordinary prose ("$ 5.00", "vector<int>", wrapped paragraphs).
      return {
        tableMode: "strip",
        stripEmoji: true,
        stripGlyphs: true,
        typographic: true,
        markdown: true,
      };
    case "plain":
      // Maximum ASCII safety for any destination: the email bundle + arrows + tabs.
      return {
        tableMode: "strip",
        stripEmoji: true,
        stripGlyphs: true,
        typographic: true,
        markdown: true,
        arrows: true,
        expandTabs: 4,
      };
    case "agent":
      // Tuned for feeding output INTO a model: kill ANSI/progress/glyph/box noise
      // to cut tokens, but KEEP Markdown structure and Unicode (models read them
      // fine, so flattening/ASCII-folding would just lose signal).
      return {
        tableMode: "strip",
        stripGlyphs: true,
        stripEmoji: false,
        typographic: false,
        markdown: false,
        html: false,
        reflow: false,
      };
  }
}
