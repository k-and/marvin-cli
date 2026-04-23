# Changelog

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

[1.0.0]: https://github.com/k-and/marvin-cli/releases/tag/v1.0.0
