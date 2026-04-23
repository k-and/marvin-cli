import { GET } from "../apiCall.ts";
import { globalOptionHelp } from "../options.ts";
import { Params, Options } from "../types.ts";

export default async function ping(params: Params, cmdOpt: Options) {
  if (cmdOpt.help) {
    console.log(pingHelp);
    Deno.exit(0);
  }

  try {
    const res = await GET("/api/", { });
    const responseText = await res.text();
    console.log(responseText);
    Deno.exit(0);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    Deno.exit(1);
  }
}

export const pingHelp = `
marvin ping

Test connectivity to the Amazing Marvin API.

EXAMPLE:
    $ marvin ping

OPTIONS:
${globalOptionHelp}
`.trim();
