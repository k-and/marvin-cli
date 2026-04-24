# Changelog

## [1.4.0] - 2026-04-24

Adds `marvin create`, completing the single-item CRUD surface. The CLI now has `add`, `create`, `update`, `delete` for single-item writes, `batch` for bulk ordered writes, and `get` for reads – a stable base that downstream tooling (including future AI layers) can target.

### Added

- `marvin create --file=<path>` creates a document via `POST /api/doc/create`. Unlike `add`, which wraps the title-parsing `/api/addTask` and `/api/addProject` endpoints, `create` sends the JSON body verbatim and can create any document type (Task, Project, Label, Category, PlannerItem, Reward, etc). Supports `--file=-` for stdin and `--dry-run` for preview
- Input is validated as a single JSON object (arrays and scalars are rejected); field-level shape is left to the server so the command stays decoupled from schema evolution
- Response is printed through the normal output path, so the created document's assigned `_id` is available for downstream scripting and `--json` / `--quiet` behave consistently with the other commands

### Removed

- Inherited upstream `TODO.md` (last remaining item, the create command, is now implemented)

## [1.3.0] - 2026-04-24

Adds `marvin batch`, a JSON runner for bulk `update` and `delete` operations. Sequential, rate-limited to one request per second, continue-on-error. Intended both as a standalone bulk-mutation tool and as a stable execution surface for planners and future AI tooling to target.

### Added

- `marvin batch --file=<path>` applies a flat JSON array of `{"op": "update"|"delete", "payload": {...}}` items against `/api/doc/update` and `/api/doc/delete`. Supports `--file=-` for stdin and `--dry-run` for preview
- `--dry-run` on `batch` prints each item's endpoint, redacted headers and pretty-printed payload, then exits 0 without contacting the API or checking for a fullAccessToken
- Validation rejects unknown top-level item keys (so typos like `"paylod"` fail fast), unsupported ops, empty itemIds, empty setter arrays and empty setter keys before any request is sent

## [1.2.0] - 2026-04-24

`marvin add` now reads from stdin, so shell pipelines like `cat task.json | marvin add --file=-` work natively.

### Added

- `marvin add --file=-` reads the task payload (JSON or plain text) from stdin

## [1.1.0] - 2026-04-24

Adds the two missing CRUD primitives from the upstream TODO: `update` and `delete`. Both support a `--dry-run` flag that previews the request payload without contacting the API.

### Added

- `marvin update ITEM_ID` edits a document via `POST /api/doc/update`; accepts `--set key=value` (string), `--set-json key=JSON` (typed), or `--file=<path>` / `--file=-` (JSON array of setter objects). Sources are additive; later entries override earlier ones for the same key
- `marvin delete ITEM_ID` removes a document via `POST /api/doc/delete`. Requires `--force` for live deletes (irreversible)
- `--dry-run` flag on both `update` and `delete` prints the endpoint, redacted headers and pretty-printed JSON payload, then exits 0 without contacting the API or checking for a fullAccessToken

## [1.0.0] - 2026-04-23

Fork of [`amazingmarvin/marvin-cli`](https://github.com/amazingmarvin/marvin-cli) v0.5.1. Bug-fix pass across async command dispatch, error handling, config validation, CI release tooling and the Windows storage path, plus a small number of quality-of-life improvements.

### Added

- `api <endpoint-name>` prints the docs for a single endpoint
- `--help` support on `ping` and `quickAdd`
- `priority` field on the `Task` type (missing from upstream)

### Changed

- CI release workflow modernised – `actions/checkout@v4`, `$GITHUB_OUTPUT` in place of `::set-output`, `softprops/action-gh-release@v2` replacing five separate create+upload steps, v0.5.1 release asset names preserved
- CHANGELOG extractor awk rewritten to survive varied heading content; build script exits non-zero explicitly on `deno compile` failure
- `apiCall` simplifies the API-token branch, throws rather than returning `Promise.reject`, and marks `POST` async for consistency with `GET`
- `csvEscape` rewritten via `String(str)` + `.includes()` in place of nested `typeof` / `indexOf`
- `toCSV` typed as `Task` rather than `any`
- Existing catch blocks wrap `err.message` with `err instanceof Error ? err.message : String(err)` for strict-Deno compliance
- `printResult` pretty-prints parsed JSON in the default non-`--json` output path
- README rewritten for the fork with user-first structure (Install, Commands, Configure, Build From Source); `--help` footer points at `k-and/marvin-cli`

### Fixed

- Async command dispatch now `await`s handlers and guards against a null command
- Desktop-only commands exit 1 on error instead of falling through
- `config` port validation uses `parseInt` + NaN + range check where the old `typeof val !== "number"` guard rejected every valid input
- `config` token masking safe for tokens shorter than 20 characters – the old regex left the full token visible
- `config` typo "Unrecognizd" corrected to "Unrecognised" on unknown-key error
- `config` drops unused imports and the unused `currentConfig` local
- `localStorage` reads `APPDATA` on Windows, not `FOLDERID_RoamingAppData` (a shell Known Folder ID, not an env var)
- `localStorage.clear()` now error-handles its disk write, matching `setItem` and `removeItem`
- `localStorage` no longer prints "Creating cache" to stdout on first run
- `options.getSavedVal` guards `JSON.parse` against corrupted storage values
- `options` drops the unused `path` import
- `printResult` tolerates the `charset=utf-8` parameter on `Content-Type`
- `get` URL-encodes the document ID and drops the spurious `Content-Type: text/plain` header on a GET request
- `help` stub replaced with a pointer to `marvin --help` / `marvin COMMAND --help`
- `backup` no longer reports success for an unimplemented stub, and `restore` now reports the same error and exits 1
- `today`, `due` and `list` wrap bodies in try/catch, validate responses are arrays and pretty-print default output
- `due` help constant renamed from `todayHelp` to `dueHelp`
- `profile` help text typos corrected
- `tracking` renames `getHelp` to `trackingHelp` and corrects a stale example comment
- `ping` and `quickAdd` wrap bodies in try/catch
- `add` silent JSON-parse fallback annotated with `_err` and an explanatory comment

[1.4.0]: https://github.com/k-and/marvin-cli/releases/tag/v1.4.0
[1.3.0]: https://github.com/k-and/marvin-cli/releases/tag/v1.3.0
[1.2.0]: https://github.com/k-and/marvin-cli/releases/tag/v1.2.0
[1.1.0]: https://github.com/k-and/marvin-cli/releases/tag/v1.1.0
[1.0.0]: https://github.com/k-and/marvin-cli/releases/tag/v1.0.0
