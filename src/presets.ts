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
      // Flatten Markdown/HTML and reflow wraps so a paste reads as plain prose.
      return {
        tableMode: "strip",
        stripEmoji: true,
        stripGlyphs: true,
        typographic: true,
        markdown: true,
        html: true,
        prompts: true,
        powershell: true,
        reflow: true,
      };
    case "plain":
      // Maximum ASCII safety for any destination.
      return {
        tableMode: "strip",
        stripEmoji: true,
        stripGlyphs: true,
        typographic: true,
        markdown: true,
        html: true,
        prompts: true,
        powershell: true,
        reflow: true,
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
