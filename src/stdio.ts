// Read the contents of a file or stdin as a UTF-8 string
// Use "-" as the path to read from stdin
// Invoke as `--file=-` from the CLI: Deno's std/flags parser treats a bare -
// after --file as a positional, so the equals form is required for stdin
export async function readFileOrStdin(path: string): Promise<string> {
  if (path === "-") {
    const chunks: Uint8Array[] = [];
    const buf = new Uint8Array(4096);
    let n: number | null;
    while ((n = await Deno.stdin.read(buf)) !== null) {
      chunks.push(buf.slice(0, n));
    }
    const total = chunks.reduce((acc, c) => acc + c.length, 0);
    const merged = new Uint8Array(total);
    let pos = 0;
    for (const c of chunks) {
      merged.set(c, pos);
      pos += c.length;
    }
    return new TextDecoder().decode(merged);
  }
  return Deno.readTextFileSync(path);
}
