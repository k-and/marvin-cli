import { Params, Options } from "../types.ts";
export default async function help(params: Params, cmdOpt: Options) {
  console.log('Use "marvin --help" for a list of commands, or "marvin COMMAND --help" for command-specific help.');
  Deno.exit(0);
}
