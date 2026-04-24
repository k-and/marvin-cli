import { POST } from "../apiCall.ts";
import { globalOptionHelp } from "../options.ts";
import { printResult } from "../printResult.ts";
import { readFileOrStdin } from "../stdio.ts";
import { Params, Options } from "../types.ts";

// Add a task or project.
export default async function add(params: Params, cmdOpt: Options) {
  if (cmdOpt.help) {
    console.log(addHelp);
    Deno.exit(0);
  }

  // marvin add --file=<path>  (use --file=- for stdin)
  if (params.length === 0 && cmdOpt.file) {
    try {
      const text = await readFileOrStdin(cmdOpt.file.toString());
      if (!text) {
        throw new Error("Input was empty");
      }

      let contentType = "text/plain", endpoint = "/api/addTask";

      if (text[0] === "{") {
        try {
          const item = JSON.parse(text);
          contentType = "application/json";
          if (item.db === "Categories") {
            endpoint = "/api/addProject";
          }
        } catch (_err) {
          // File starts with { but isn't valid JSON - treat as plain text
        }
      }

      const res = await POST(endpoint, text, { "Content-Type": contentType });
      await printResult(res);
      Deno.exit(0);
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      Deno.exit(1);
    }
  }

  // marvin add (???)
  if (params.length === 0) {
    console.error(addHelp);
    Deno.exit(1);
  }

  // marvin add task (???)
  if (params.length === 1 && (params[0] === "task" || params[0] === "project")) {
    // Invalid: if "add task" or "add project", user must give title as arg.
    console.error(`Missing ${params[0]} title`);
    Deno.exit(1);
  }

  // marvin add "example task +today"
  // marvin add task "example task +today"
  if (params.length === 1 || (params.length === 2 && params[0] === "task")) {
    // Add a task by title.
    try {
      const taskTitle = params.length === 1 ? params[0].toString() : params[1].toString();
      const res = await POST("/api/addTask", taskTitle, { "Content-Type": "text/plain" });
      await printResult(res);
      Deno.exit(0);
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      Deno.exit(1);
    }
  }

  // marvin add project "example due tomorrow"
  if (params.length === 2 && params[0] === "project") {
    try {
      const res = await POST("/api/addProject", params[1].toString(), { "Content-Type": "text/plain" });
      await printResult(res);
      Deno.exit(0);
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      Deno.exit(1);
    }
  }

  console.error(addHelp);
  Deno.exit(1);
}

export const addHelp = `
marvin add <title> # Add a task
marvin add [type] <title> # type is task or project
marvin add --file=<path>

Create a Task or Project.

EXAMPLE:
    # Add a task
    $ marvin add task "Go to the store at 11:00 +today @chore"

    # Add an arbitrary item (by supplying JSON).
    $ marvin add --file=./task.json

    # Pipe JSON to stdin to create a project
    $ cat project.json | marvin add --file=-

OPTIONS:
    -f, --file=<path>
        Read JSON/text from file. Use --file=- for stdin. The equals
        sign is required for the stdin form because Deno's flag
        parser treats a bare - as a positional.
${globalOptionHelp}
`.trim();
