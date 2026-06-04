import { describe, it, expect } from "vitest";
import { cleanPowerShell } from "../../src/transforms/powershell.js";

describe("cleanPowerShell", () => {
  it("removes the ~ underline and the '+ ' gutter, keeping the text", () => {
    const input =
      "Get-Item : Cannot find path.\nAt line:1 char:1\n+ Get-Item foo\n+ ~~~~~~~~";
    expect(cleanPowerShell(input)).toBe(
      "Get-Item : Cannot find path.\nAt line:1 char:1\nGet-Item foo",
    );
  });

  it("keeps the 'At line:N char:M' location", () => {
    expect(cleanPowerShell("At line:5 char:3\n+ ~~~")).toBe("At line:5 char:3");
  });

  it("de-gutters indented CategoryInfo trailers", () => {
    const input = "At line:1 char:1\n    + CategoryInfo          : ObjectNotFound";
    expect(cleanPowerShell(input)).toBe("At line:1 char:1\nCategoryInfo          : ObjectNotFound");
  });

  it("leaves a unified diff untouched (no PowerShell markers)", () => {
    const diff = "+ added line\n- removed line\n+ another";
    expect(cleanPowerShell(diff)).toBe(diff);
  });

  it("returns marker-free text unchanged (fast path)", () => {
    expect(cleanPowerShell("ordinary output\nsecond line")).toBe("ordinary output\nsecond line");
  });
});
