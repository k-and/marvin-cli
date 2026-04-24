import { POST } from "../apiCall.ts";
import { globalOptionHelp } from "../options.ts";
import { printResult } from "../printResult.ts";
import { readFileOrStdin } from "../stdio.ts";
import { Params, Options } from "../types.ts";

function printDryRun(endpoint: string, payload: unknown) {
  console.log(`DRY RUN: POST ${endpoint}`);
  console.log("Headers:");
  console.log("  Content-Type: application/json");
  console.log("  X-Full-Access-Token: <redacted>");
  console.log("Body:");
  console.log(JSON.stringify(payload, null, 2));
}

// Create a document via /api/doc/create
export default async function create(params: Params, cmdOpt: Options) {
  if (cmdOpt.help) {
    console.log(createHelp);
    Deno.exit(0);
  }

  if (params.length > 0) {
    const extras = params.map(String).join(" ");
    console.error(`Unexpected positional arguments: ${extras}. Run \`marvin create --help\` for usage.`);
    Deno.exit(1);
  }

  if (!cmdOpt.file || typeof cmdOpt.file !== "string") {
    console.error("Missing --file. Use --file=<path> or --file=- for stdin.");
    Deno.exit(1);
  }

  try {
    const text = await readFileOrStdin(cmdOpt.file);
    if (!text.trim()) {
      throw new Error("Input was empty");
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Input is not valid JSON");
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Input must be a JSON object (not an array or scalar)");
    }

    const endpoint = "/api/doc/create";

    if (cmdOpt["dry-run"]) {
      printDryRun(endpoint, parsed);
      Deno.exit(0);
    }

    const res = await POST(endpoint, JSON.stringify(parsed), { "Content-Type": "application/json" });
    await printResult(res);
    Deno.exit(0);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    Deno.exit(1);
  }
}

export const createHelp = `
marvin create --file=<path>

Create a document (Task, Project, Label, Category, PlannerItem, etc)
via POST /api/doc/create. Reads a single JSON object from file or stdin.

Requires the fullAccessToken for live requests. --dry-run skips the
token check and never contacts the API.

The JSON object is sent verbatim. The "db" field is required by the
server and routes the document to the correct collection. Common
values: "Tasks", "Categories" (holds Projects and Categories),
"Labels", "PlannerItems", "Rewards". Refer to the Marvin data-type
docs for the full set of fields each collection accepts.

The response is the created document, including its assigned "_id",
printed through the normal output path (respects --json and --quiet).

EXAMPLE:
    # Create a task
    $ marvin create --file=task.json
    # task.json:
    #   {
    #     "db": "Tasks",
    #     "title": "Review quarterly report",
    #     "day": "2026-05-01",
    #     "timeEstimate": 1800000
    #   }

    # Create a project (projects live in the Categories collection)
    $ marvin create --file=project.json
    # project.json:
    #   {
    #     "db": "Categories",
    #     "type": "project",
    #     "title": "Website redesign"
    #   }

    # Pipe from stdin
    $ cat label.json | marvin create --file=-
    # label.json:
    #   { "db": "Labels", "title": "urgent", "color": "#ff0000" }

    # Preview the payload without sending
    $ marvin create --file=task.json --dry-run

OPTIONS:
    --file=<path>
        Read a JSON object from file. Use --file=- for stdin. The
        equals sign is required for the stdin form because Deno's
        flag parser treats a bare - as a positional.

    --dry-run
        Print the endpoint, redacted headers and the JSON payload,
        then exit 0 without contacting the API. Does not require a
        fullAccessToken.
${globalOptionHelp}
`.trim();
