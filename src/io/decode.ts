// Decode raw input bytes to a string, honoring a byte-order mark. Windows files
// and clipboard exports are frequently UTF-16 (Notepad, PowerShell redirection,
// "Save As Unicode"); decoding those as UTF-8 yields mojibake. We sniff the BOM
// and fall back to UTF-8 (the overwhelmingly common case for pipes).

/** Decode a Buffer to text, detecting UTF-16 LE/BE BOMs; default UTF-8. */
export function decodeInput(buf: Buffer): string {
  if (buf.length >= 2) {
    // UTF-16 LE BOM: FF FE
    if (buf[0] === 0xff && buf[1] === 0xfe) {
      return stripBom(buf.toString("utf16le"));
    }
    // UTF-16 BE BOM: FE FF. Node has no "utf16be" decoder, so swap byte pairs.
    if (buf[0] === 0xfe && buf[1] === 0xff) {
      const swapped = Buffer.allocUnsafe(buf.length);
      for (let i = 0; i + 1 < buf.length; i += 2) {
        swapped[i] = buf[i + 1] as number;
        swapped[i + 1] = buf[i] as number;
      }
      if (buf.length % 2 === 1) swapped[buf.length - 1] = buf[buf.length - 1] as number;
      return stripBom(swapped.toString("utf16le"));
    }
  }
  return stripBom(buf.toString("utf8")); // includes a UTF-8 BOM (EF BB BF) -> U+FEFF
}

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}
