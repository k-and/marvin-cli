import { GET } from "../apiCall.ts";
import { globalOptionHelp } from "../options.ts";
import { printResult } from "../printResult.ts";
import { Params, Options } from "../types.ts";

// Get the currently tracked item
export default async function tracking(params: Params, cmdOpt: Options) {
  if (cmdOpt.help) {
    console.log(trackingHelp);
    Deno.exit(0);
  }

  // marvin tracking
  if (params.length === 0) {
    try {
      const res = await GET("/api/trackedItem", { });
      await printResult(res);
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      Deno.exit(1);
    }
    Deno.exit(0);
  }

  console.error(trackingHelp);
  Deno.exit(1);
}

export const trackingHelp = `
marvin tracking

Get the currently tracked item.

EXAMPLE:
    # Get the currently tracked task
    $ marvin tracking

OPTIONS:
${globalOptionHelp}
`.trim();
