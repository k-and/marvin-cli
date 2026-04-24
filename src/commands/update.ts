import { POST } from "../apiCall.ts";
import { globalOptionHelp } from "../options.ts";
import { printResult } from "../printResult.ts";
import { Params, Options } from "../types.ts";

type Setter = { key: string; val: unknown };

function parseSetter(entry: string, asJson: boolean): Setter {
  const flag = asJson ? "--set-json" : "--set";
  const idx = entry.indexOf("=");
  if (idx === -1) {
    throw new Error(`Invalid ${flag} value "${entry}": expected key=value`);
  }
  const key = entry.slice(0, idx);
  if (key === "") {
    throw new Error(`Invalid ${flag} value "${entry}": key cannot be empty`);
  }
  const raw = entry.slice(idx + 1);
  if (asJson) {
    try {
      return { key, val: JSON.parse(raw) };
    } catch {
      throw new Error(`Invalid --set-json value "${entry}": value is not valid JSON`);
    }
  }
  return { key, val: raw };
}

function normaliseToArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string") return [val];
  return [];
}

async function readFileOrStdin(path: string): Promise<string> {
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

function printDryRun(endpoint: string, payload: unknown) {
  console.log(`DRY RUN: POST ${endpoint}`);
  console.log("Headers:");
  console.log("  Content-Type: application/json");
  console.log("  X-Full-Access-Token: <redacted>");
  console.log("Body:");
  console.log(JSON.stringify(payload, null, 2));
}

// Update fields on a document via /api/doc/update
export default async function update(params: Params, cmdOpt: Options) {
  if (cmdOpt.help) {
    console.log(updateHelp);
    Deno.exit(0);
  }

  if (params.length === 0) {
    console.error("Missing ITEM_ID. Run `marvin update --help` for usage.");
    Deno.exit(1);
  }

  if (params.length > 1) {
    const extras = params.slice(1).map(String).join(" ");
    console.error(`Unexpected extra arguments: ${extras}. Run \`marvin update --help\` for usage.`);
    Deno.exit(1);
  }

  const itemId = String(params[0]);
  const setters: Setter[] = [];

  try {
    for (const entry of normaliseToArray(cmdOpt.set)) {
      setters.push(parseSetter(entry, false));
    }

    for (const entry of normaliseToArray(cmdOpt["set-json"])) {
      setters.push(parseSetter(entry, true));
    }

    if (cmdOpt.file && typeof cmdOpt.file === "string") {
      const text = await readFileOrStdin(cmdOpt.file);
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error(`File "${cmdOpt.file}": not valid JSON`);
      }
      if (!Array.isArray(parsed)) {
        throw new Error(`File "${cmdOpt.file}": expected a JSON array of {"key", "val"} objects`);
      }
      for (const s of parsed) {
        if (s === null || typeof s !== "object") {
          throw new Error(`File "${cmdOpt.file}": each setter must be an object`);
        }
        const setter = s as { key?: unknown; val?: unknown };
        if (typeof setter.key !== "string") {
          throw new Error(`File "${cmdOpt.file}": each setter must have a string "key"`);
        }
        if (setter.key === "") {
          throw new Error(`File "${cmdOpt.file}": setter "key" cannot be empty`);
        }
        if (!("val" in setter)) {
          throw new Error(`File "${cmdOpt.file}": each setter must have a "val"`);
        }
        setters.push({ key: setter.key, val: setter.val });
      }
    }

    if (setters.length === 0) {
      console.error("No setters provided. Use --set key=value, --set-json key=JSON, or --file <path>.");
      Deno.exit(1);
    }

    const endpoint = "/api/doc/update";
    const payload = { itemId, setters };

    if (cmdOpt["dry-run"]) {
      printDryRun(endpoint, payload);
      Deno.exit(0);
    }

    const res = await POST(endpoint, JSON.stringify(payload), { "Content-Type": "application/json" });
    await printResult(res);
    Deno.exit(0);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    Deno.exit(1);
  }
}

export const updateHelp = `
marvin update <id> --set key=value [--set key=value ...]
marvin update <id> --set-json key=JSON [--set-json key=JSON ...]
marvin update <id> --file <path>

Update fields on a document (Task, Project, Label, Category, PlannerItem, etc).

Requires the fullAccessToken for live requests. Run \`marvin config
fullAccessToken YOUR_TOKEN\` if you have not already. --dry-run skips the
token check and never contacts the API.

--set, --set-json and --file concatenate into a single setters array. If
the same key appears more than once across these sources, later entries
override earlier ones.

EXAMPLE:
    # Set a title
    $ marvin update AJNBWKLrTqYPKaWgfx92 --set title="New title"

    # Typed values via --set-json (numbers, booleans, arrays, objects)
    $ marvin update AJNBWKLrTqYPKaWgfx92 --set-json timeEstimate=300000

    # Preview the payload without sending
    $ marvin update AJNBWKLrTqYPKaWgfx92 --set-json priority=1 --dry-run

    # Batch from a file
    $ marvin update AJNBWKLrTqYPKaWgfx92 --file setters.json
    # setters.json is [{"key": "title", "val": "X"}, ...]

    # Pipe setters from stdin (the equals sign is required)
    $ cat setters.json | marvin update AJNBWKLrTqYPKaWgfx92 --file=-

OPTIONS:
    --set key=value
        Set a field to a string value. Can be repeated.

    --set-json key=JSON
        Set a field to a JSON-parsed value (number, boolean, array, object,
        or quoted string). Can be repeated.

    --file=<path>
        Read a JSON array of {"key": ..., "val": ...} setters from file.
        Use --file=- for stdin. The equals sign is required for the
        stdin form because Deno's flag parser treats a bare - as a
        positional.

    --dry-run
        Print the endpoint, redacted headers and the JSON payload, then
        exit 0 without contacting the API. Does not require a
        fullAccessToken.
${globalOptionHelp}
`.trim();
