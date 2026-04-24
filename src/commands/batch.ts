import { POST } from "../apiCall.ts";
import { globalOptionHelp } from "../options.ts";
import { readFileOrStdin } from "../stdio.ts";
import { Params, Options } from "../types.ts";

type Setter = { key: string; val: unknown };
type CreatePayload = Record<string, unknown>;
type UpdatePayload = { itemId: string; setters: Setter[] };
type DeletePayload = { itemId: string };

type BatchItem =
  | { op: "create"; payload: CreatePayload }
  | { op: "update"; payload: UpdatePayload }
  | { op: "delete"; payload: DeletePayload };

const ALLOWED_ITEM_KEYS = new Set(["op", "payload"]);
const ALLOWED_OPS = new Set(["create", "update", "delete"]);
const OP_TO_ENDPOINT: Record<"create" | "update" | "delete", string> = {
  create: "/api/doc/create",
  update: "/api/doc/update",
  delete: "/api/doc/delete",
};
const RATE_LIMIT_MS = 1000;

function validateItems(raw: unknown): BatchItem[] {
  if (!Array.isArray(raw)) {
    throw new Error("Input must be a JSON array of batch items");
  }
  return raw.map((item, i) => validateItem(item, i));
}

function validateItem(raw: unknown, i: number): BatchItem {
  const prefix = `Item ${i + 1}:`;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`${prefix} must be an object with "op" and "payload"`);
  }
  const obj = raw as Record<string, unknown>;
  const unknownKeys = Object.keys(obj).filter((k) => !ALLOWED_ITEM_KEYS.has(k));
  if (unknownKeys.length > 0) {
    throw new Error(`${prefix} unknown keys: ${unknownKeys.join(", ")}. Allowed: op, payload`);
  }
  if (typeof obj.op !== "string") {
    throw new Error(`${prefix} missing or non-string "op"`);
  }
  if (!ALLOWED_OPS.has(obj.op)) {
    throw new Error(`${prefix} unsupported op "${obj.op}". Allowed: create, update, delete`);
  }
  if (obj.payload === null || typeof obj.payload !== "object" || Array.isArray(obj.payload)) {
    throw new Error(`${prefix} missing or non-object "payload"`);
  }
  const payload = obj.payload as Record<string, unknown>;

  if (obj.op === "create") {
    return { op: "create", payload };
  }

  if (obj.op === "update") {
    if (typeof payload.itemId !== "string" || payload.itemId === "") {
      throw new Error(`${prefix} update payload requires non-empty "itemId"`);
    }
    if (!Array.isArray(payload.setters) || payload.setters.length === 0) {
      throw new Error(`${prefix} update payload requires non-empty "setters" array`);
    }
    for (const [j, s] of payload.setters.entries()) {
      if (s === null || typeof s !== "object" || Array.isArray(s)) {
        throw new Error(`${prefix} setters[${j}] must be an object`);
      }
      const setter = s as Record<string, unknown>;
      if (typeof setter.key !== "string" || setter.key === "") {
        throw new Error(`${prefix} setters[${j}] requires non-empty "key"`);
      }
      if (!("val" in setter)) {
        throw new Error(`${prefix} setters[${j}] missing "val"`);
      }
    }
    return {
      op: "update",
      payload: { itemId: payload.itemId, setters: payload.setters as Setter[] },
    };
  }

  // op === "delete"
  if (typeof payload.itemId !== "string" || payload.itemId === "") {
    throw new Error(`${prefix} delete payload requires non-empty "itemId"`);
  }
  return {
    op: "delete",
    payload: { itemId: payload.itemId },
  };
}

function itemLabel(item: BatchItem): string {
  if (item.op === "create") {
    const id = item.payload._id;
    const title = item.payload.title;
    if (typeof id === "string" && id !== "") return id;
    if (typeof title === "string" && title !== "") return title;
    return "<no id>";
  }
  return item.payload.itemId;
}

function printDryRunItem(i: number, total: number, item: BatchItem) {
  console.log(`[${i + 1}/${total}] DRY RUN: ${item.op} via POST ${OP_TO_ENDPOINT[item.op]}`);
  console.log("Headers:");
  console.log("  Content-Type: application/json");
  console.log("  X-Full-Access-Token: <redacted>");
  console.log("Body:");
  console.log(JSON.stringify(item.payload, null, 2));
  console.log();
}

// Send a batch of update/delete operations from a JSON file
export default async function batch(params: Params, cmdOpt: Options) {
  if (cmdOpt.help) {
    console.log(batchHelp);
    Deno.exit(0);
  }

  if (params.length > 0) {
    const extras = params.map(String).join(" ");
    console.error(`Unexpected positional arguments: ${extras}. Run \`marvin batch --help\` for usage.`);
    Deno.exit(1);
  }

  if (!cmdOpt.file || typeof cmdOpt.file !== "string") {
    console.error("Missing --file. Use --file=<path> or --file=- for stdin.");
    Deno.exit(1);
  }

  let items: BatchItem[];
  try {
    const text = await readFileOrStdin(cmdOpt.file);
    if (!text.trim()) {
      throw new Error("Input was empty");
    }
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new Error("Input is not valid JSON");
    }
    items = validateItems(raw);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    Deno.exit(1);
  }

  const total = items.length;

  if (cmdOpt["dry-run"]) {
    for (let i = 0; i < total; i++) {
      printDryRunItem(i, total, items[i]);
    }
    console.log(`Dry run complete. ${total} item${total === 1 ? "" : "s"} would have been sent.`);
    Deno.exit(0);
  }

  let succeeded = 0;
  let failed = 0;
  let lastStart = 0;

  for (let i = 0; i < total; i++) {
    const item = items[i];
    const label = itemLabel(item);

    const now = Date.now();
    const wait = lastStart + RATE_LIMIT_MS - now;
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    lastStart = Date.now();

    const endpoint = OP_TO_ENDPOINT[item.op];
    try {
      await POST(endpoint, JSON.stringify(item.payload), { "Content-Type": "application/json" });
      succeeded++;
      if (!cmdOpt.quiet) {
        console.log(`[${i + 1}/${total}] OK   ${item.op} ${label}`);
      }
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[${i + 1}/${total}] FAIL ${item.op} ${label} - ${msg}`);
    }
  }

  console.log(`Done. ${succeeded} succeeded, ${failed} failed.`);
  Deno.exit(failed > 0 ? 1 : 0);
}

export const batchHelp = `
marvin batch --file=<path>

Apply a list of mutations from a JSON file. Reads a flat JSON
array of {"op", "payload"} objects and executes each in order,
rate-limited to one request per second.

Supported ops:
- create (issues POST /api/doc/create)
- update (issues POST /api/doc/update)
- delete (issues POST /api/doc/delete)

Ops may be mixed in a single plan and are executed in the order
given. For create, pre-generate the document's "_id" client-side if
you want to reference it in a later update or delete within the
same plan.

Requires the fullAccessToken for live requests. --dry-run skips the
token check and never contacts the API.

Continue-on-error: failures do not stop the run. Exit 0 if every
item succeeds; exit 1 if any item fails or validation fails.

EXAMPLE:
    # Run a batch from a file
    $ marvin batch --file=ops.json

    # Pipe a batch from stdin
    $ cat ops.json | marvin batch --file=-

    # Preview the requests without sending
    $ marvin batch --file=ops.json --dry-run

Example ops.json (mixed create, update, delete):
    [
      {
        "op": "create",
        "payload": {
          "db": "Tasks",
          "title": "New task from batch"
        }
      },
      {
        "op": "update",
        "payload": {
          "itemId": "AJNBWKLrTqYPKaWgfx92",
          "setters": [{"key": "title", "val": "Renamed"}]
        }
      },
      {
        "op": "delete",
        "payload": {"itemId": "ZZZ1a2b3c4"}
      }
    ]

OPTIONS:
    --file=<path>
        Read batch items from file. Use --file=- for stdin. The
        equals sign is required for the stdin form.

    --dry-run
        Print each item's endpoint, redacted headers and pretty-
        printed payload, then exit 0 without contacting the API.
        Does not require a fullAccessToken or suppress via --quiet.

    -q, --quiet
        Suppress per-item success lines. Failures and the final
        summary are still printed.
${globalOptionHelp}
`.trim();
