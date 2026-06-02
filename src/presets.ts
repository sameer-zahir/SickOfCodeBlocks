// Output presets. Each returns a partial option bundle that is layered over the
// defaults; explicit CLI flags still override the preset (see options.ts).

import type { SanitizeOptions } from "./pipeline.js";

export type Preset = "slack" | "email" | "plain";

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
      return {
        tableMode: "strip",
        stripEmoji: true,
        stripGlyphs: true,
        typographic: true,
      };
    case "plain":
      // Maximum ASCII safety for any destination.
      return {
        tableMode: "strip",
        stripEmoji: true,
        stripGlyphs: true,
        typographic: true,
        arrows: true,
        expandTabs: 4,
      };
  }
}
