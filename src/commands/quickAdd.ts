import { GET } from "../apiCall.ts";
import { globalOptionHelp } from "../options.ts";
import { Params, Options } from "../types.ts";

export default async function quickAdd(params: Params, cmdOpt: Options) {
  if (cmdOpt.help) {
    console.log(quickAddHelp);
    Deno.exit(0);
  }

  try {
    const res = await GET("/api/quickAdd", { });
    const responseText = await res.text();
    console.log(responseText);
    Deno.exit(0);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    Deno.exit(1);
  }
}

export const quickAddHelp = `
marvin quickAdd

Open the desktop Quick Add window for adding a task with auto-completion.
This command only works with the desktop app.

EXAMPLE:
    $ marvin quickAdd

OPTIONS:
${globalOptionHelp}
`.trim();
