import { GET } from "../apiCall.ts";
import { globalOptionHelp } from "../options.ts";
import { Params, Options } from "../types.ts";

export default async function ping(params: Params, cmdOpt: Options) {
  if (cmdOpt.help) {
    console.log(pingHelp);
    Deno.exit(0);
  }

  const res = await GET("/api/", { });

  const responseText = await res.text();
  console.log(responseText);
}

export const pingHelp = `
marvin ping

Test connectivity to the Amazing Marvin API.

EXAMPLE:
    $ marvin ping

OPTIONS:
${globalOptionHelp}
`.trim();
