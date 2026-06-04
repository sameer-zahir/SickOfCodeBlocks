import { defineConfig } from "tsup";

// Two builds:
//  - cli:   the executable bundle (dist/cli.js) with a shebang; @xterm/headless
//           kept external so the optional dep is lazy-loaded at runtime, not bundled.
//  - index: the library entry (dist/index.js + .d.ts) re-exporting sanitize().
export default defineConfig([
  {
    entry: { cli: "src/cli.ts" },
    format: ["esm"],
    target: "node20",
    platform: "node",
    bundle: true,
    clean: true,
    splitting: false,
    sourcemap: false,
    dts: false,
    external: ["@xterm/headless"],
    banner: { js: "#!/usr/bin/env node" },
  },
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    target: "node20",
    platform: "node",
    bundle: true,
    clean: false,
    splitting: false,
    sourcemap: false,
    dts: true,
    external: ["@xterm/headless"],
  },
  {
    // MCP server bin. @modelcontextprotocol/sdk is an optional dep, kept external
    // so it is loaded from node_modules at runtime (only when socb-mcp is used).
    entry: { mcp: "src/mcp.ts" },
    format: ["esm"],
    target: "node20",
    platform: "node",
    bundle: true,
    clean: false,
    splitting: false,
    sourcemap: false,
    dts: false,
    external: ["@xterm/headless", "@modelcontextprotocol/sdk"],
    banner: { js: "#!/usr/bin/env node" },
  },
]);
