import { describe, it, expect } from "vitest";
import { redact } from "../../src/transforms/redact.js";

describe("redact", () => {
  it("masks an AWS access key", () => {
    expect(redact("key AKIAIOSFODNN7EXAMPLE here")).toBe(
      "key [REDACTED:aws-key] here",
    );
  });
  it("masks a JWT", () => {
    const jwt = "eyJhbGci.eyJzdWIiOiIx.SflKxwRJ";
    expect(redact("token " + jwt)).toBe("token [REDACTED:jwt]");
  });
  it("masks emails", () => {
    expect(redact("ping a.b+c@example.co.uk now")).toBe(
      "ping [REDACTED:email] now",
    );
  });
  it("masks a valid IPv4 but not an invalid one", () => {
    expect(redact("ip 8.8.8.8 ok")).toBe("ip [REDACTED:ipv4] ok");
    expect(redact("v 999.1.1.1")).toBe("v 999.1.1.1");
  });
  it("collapses a home-directory path to ~", () => {
    expect(redact("at C:\\Users\\sam\\proj")).toBe("at ~\\proj");
    expect(redact("at /home/sam/proj")).toBe("at ~/proj");
  });
  it("masks a key=value secret but keeps the key", () => {
    expect(redact("password=hunter2xyz")).toBe("password=[REDACTED:secret]");
  });
  it("masks a generic long hex token", () => {
    expect(redact("h " + "deadbeef".repeat(5))).toBe("h [REDACTED:token]");
  });
  it("respects the maxLineLength guard for generic tokens", () => {
    const longHex = "deadbeef".repeat(5);
    expect(redact("x " + longHex, 5)).toBe("x " + longHex);
  });
  it("leaves clean text untouched", () => {
    expect(redact("nothing secret here")).toBe("nothing secret here");
  });
});
