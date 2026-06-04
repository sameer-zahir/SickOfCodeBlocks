import { describe, it, expect } from "vitest";
import { htmlToText } from "../../src/transforms/html.js";

describe("htmlToText", () => {
  it("strips inline tags, keeping text", () => {
    expect(htmlToText("<b>bold</b> and <i>italic</i> text")).toBe("bold and italic text");
  });

  it("decodes named and numeric entities", () => {
    expect(htmlToText("a &amp; b &lt;c&gt;")).toBe("a & b <c>");
    expect(htmlToText("&#39;&#x41;")).toBe("'A");
    expect(htmlToText("x&nbsp;y")).toBe("x y");
  });

  it("turns <br> into a newline", () => {
    expect(htmlToText("line<br>break")).toBe("line\nbreak");
  });

  it("breaks block-level elements onto their own lines", () => {
    expect(htmlToText("<p>one</p><p>two</p>").trim()).toBe("one\n\ntwo".trim());
  });

  it("drops script and style bodies", () => {
    expect(htmlToText("<script>evil()</script>keep")).toBe("keep");
    expect(htmlToText("<style>a{}</style>text")).toBe("text");
  });

  it("decodes entities LAST so '<' is not re-read as a tag", () => {
    expect(htmlToText("&lt;b&gt;not a tag&lt;/b&gt;")).toBe("<b>not a tag</b>");
  });

  it("leaves comparison operators alone (no letter after '<')", () => {
    expect(htmlToText("2 < 3 and a > b")).toBe("2 < 3 and a > b");
  });

  it("returns markup-free text unchanged (fast path)", () => {
    expect(htmlToText("no markup here")).toBe("no markup here");
  });
});
