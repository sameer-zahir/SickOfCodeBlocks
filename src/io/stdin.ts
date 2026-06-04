// Read piped stdin as raw bytes, then decode (UTF-8 / UTF-16 by BOM).

import { decodeInput } from "./decode.js";

/** True when stdin is NOT an interactive terminal (i.e. data is piped/redirected). */
export function isPipedStdin(): boolean {
  return !process.stdin.isTTY;
}

/** Read all of stdin to a string. Handles chunking/backpressure via async iteration. */
export async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  // No setEncoding: collect raw Buffers so decodeInput can detect a UTF-16 BOM.
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return decodeInput(Buffer.concat(chunks));
}
