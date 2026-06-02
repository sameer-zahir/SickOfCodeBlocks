// Read piped stdin as UTF-8.

/** True when stdin is NOT an interactive terminal (i.e. data is piped/redirected). */
export function isPipedStdin(): boolean {
  return !process.stdin.isTTY;
}

/** Read all of stdin to a string. Handles chunking/backpressure via async iteration. */
export async function readStdin(): Promise<string> {
  process.stdin.setEncoding("utf8");
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data;
}
