import { POST } from "../apiCall.ts";
import { globalOptionHelp } from "../options.ts";
import { printResult } from "../printResult.ts";
import { Params, Options } from "../types.ts";

function printDryRun(endpoint: string, payload: unknown) {
  console.log(`DRY RUN: POST ${endpoint}`);
  console.log("Headers:");
  console.log("  Content-Type: application/json");
  console.log("  X-Full-Access-Token: <redacted>");
  console.log("Body:");
  console.log(JSON.stringify(payload, null, 2));
}

// Delete a document via /api/doc/delete
export default async function del(params: Params, cmdOpt: Options) {
  if (cmdOpt.help) {
    console.log(deleteHelp);
    Deno.exit(0);
  }

  if (params.length === 0) {
    console.error("Missing ITEM_ID. Run `marvin delete --help` for usage.");
    Deno.exit(1);
  }

  if (params.length > 1) {
    const extras = params.slice(1).map(String).join(" ");
    console.error(`Unexpected extra arguments: ${extras}. Run \`marvin delete --help\` for usage.`);
    Deno.exit(1);
  }

  const itemId = String(params[0]);
  const endpoint = "/api/doc/delete";
  const payload = { itemId };

  if (cmdOpt["dry-run"]) {
    printDryRun(endpoint, payload);
    Deno.exit(0);
  }

  if (!cmdOpt.force) {
    console.error("Delete is irreversible. Pass --force to confirm, or --dry-run to preview.");
    Deno.exit(1);
  }

  try {
    const res = await POST(endpoint, JSON.stringify(payload), { "Content-Type": "application/json" });
    await printResult(res);
    Deno.exit(0);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    Deno.exit(1);
  }
}

export const deleteHelp = `
marvin delete <id> --force
marvin delete <id> --dry-run

Delete a document (Task, Project, Label, Category, PlannerItem, etc).
This is irreversible.

Requires the fullAccessToken for live requests. Run \`marvin config
fullAccessToken YOUR_TOKEN\` if you have not already. --dry-run skips
the token check and never contacts the API.

--force is required for live deletes. --dry-run previews the payload
without --force.

EXAMPLE:
    # Delete a task
    $ marvin delete AJNBWKLrTqYPKaWgfx92 --force

    # Preview the request without sending
    $ marvin delete AJNBWKLrTqYPKaWgfx92 --dry-run

OPTIONS:
    --force
        Required to execute the delete. Safety gate against accidental
        data loss.

    --dry-run
        Print the endpoint, redacted headers and the JSON payload,
        then exit 0 without contacting the API. Does not require
        a fullAccessToken or --force.
${globalOptionHelp}
`.trim();
