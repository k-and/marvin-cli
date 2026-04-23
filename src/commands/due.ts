import { GET } from "../apiCall.ts";
import { getCSVHeader, toCSV } from "../csv.ts";
import { Params, Options } from "../types.ts";
import { globalFormatHelp, globalOptionHelp } from "../options.ts";

export default async function due(params: Params, cmdOpt: Options) {
  if (cmdOpt.help) {
    console.log(dueHelp);
    Deno.exit(0);
  }

  try {
    const res = await GET("/api/dueItems", { });
    const items = await res.json();

    if (!Array.isArray(items)) {
      console.error("Unexpected response format");
      Deno.exit(1);
    }

    if (cmdOpt.csv) {
      console.log(getCSVHeader());
      for (const item of items) {
        console.log(toCSV(item));
      }
      Deno.exit(0);
    }

    if (cmdOpt.text) {
      for (const item of items) {
        console.log(item.title);
      }
      Deno.exit(0);
    }

    console.log(JSON.stringify(items, null, 2));
    Deno.exit(0);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    Deno.exit(1);
  }
}

export const dueHelp = `
marvin due

List all open Tasks/Projects due today or earlier.

EXAMPLE:
    # List Tasks/Projects due today or earlier
    $ marvin due

OPTIONS:
${globalFormatHelp}
${globalOptionHelp}
`.trim();
