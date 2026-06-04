import { describe, it, expect } from "vitest";
import { decodeInput } from "../../src/io/decode.js";

const rocket = String.fromCodePoint(0x1f680);

function utf16be(s: string): Buffer {
  const le = Buffer.from(s, "utf16le");
  const be = Buffer.alloc(le.length);
  for (let i = 0; i + 1 < le.length; i += 2) {
    be[i] = le[i + 1] as number;
    be[i + 1] = le[i] as number;
  }
  return be;
}

describe("decodeInput", () => {
  it("decodes UTF-8 (the default) faithfully", () => {
    expect(decodeInput(Buffer.from("café " + rocket, "utf8"))).toBe("café " + rocket);
  });

  it("strips a UTF-8 BOM", () => {
    const buf = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from("hi", "utf8")]);
    expect(decodeInput(buf)).toBe("hi");
  });

  it("decodes UTF-16 LE with a BOM", () => {
    const buf = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from("héllo", "utf16le")]);
    expect(decodeInput(buf)).toBe("héllo");
  });

  it("decodes UTF-16 BE with a BOM", () => {
    const buf = Buffer.concat([Buffer.from([0xfe, 0xff]), utf16be("héllo")]);
    expect(decodeInput(buf)).toBe("héllo");
  });

  it("handles empty input", () => {
    expect(decodeInput(Buffer.alloc(0))).toBe("");
  });
});
