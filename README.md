# marvin-cli

A command-line tool for interfacing with the Amazing Marvin desktop app and public API. This is a fork of [amazingmarvin/marvin-cli](https://github.com/amazingmarvin/marvin-cli) v0.5.1 with bug fixes across the async command dispatch path, config validation, CI tooling, the Windows storage path and several command stubs.

marvin-cli connects to either the public API at `serv.amazingmarvin.com` or, if you disable cloud sync and run the desktop app, the desktop's [local API server](https://help.amazingmarvin.com/en/articles/5165191-desktop-local-api-server). It selects automatically based on connectivity; `--desktop` and `--public` pin the choice explicitly.

## Install

Download a prebuilt binary for your platform from the [releases page](https://github.com/k-and/marvin-cli/releases):

- Linux: `marvin-cli-linux`
- macOS (x86_64): `marvin-cli-macos`
- macOS (arm64): `marvin-cli-macos-arm`
- Windows: `marvin-cli-win.exe`

Rename the binary to `marvin` (or `marvin.exe` on Windows) and copy it to a directory in your `PATH`. The CLI is invoked as `marvin`, which is what every example in this README and the `--help` output assumes. To build yourself instead, see [Build From Source](#build-from-source).

## Commands

```
COMMANDS:
    api      - View API docs
    config   - Get/set config values for marvin-cli
    add      - Add a Task, Project, or other
    update   - Update a Task, Project, or other
    delete   - Delete a Task, Project, or other
    due      - Get open Tasks & Projects due today (or earlier)
    get      - Read an arbitrary document from your database
    today    - List Tasks and Projects that are scheduled today
    tracking - Get the currently tracked task
    ping     - Test API connectivity
    help     - Help about any command

DESKTOP COMMANDS:
    quickAdd - Open desktop quick add
    list     - List Tasks/Projects, optionally filtered
    backup   - Trigger backups (not yet implemented)
    restore  - Restore backups (not yet implemented)
```

Run `marvin COMMAND --help` for command-specific options.

## Configure

Get your API token from [app.amazingmarvin.com/pre?api](https://app.amazingmarvin.com/pre?api) (or from the API strategy settings in the desktop app) and save it once:

```bash
marvin config apiToken YOUR_TOKEN
```

Some endpoints – `get` and anything that writes via `/api/doc/*` – also need a full-access token, found next to the API token in the desktop app settings:

```bash
marvin config fullAccessToken YOUR_FULL_ACCESS_TOKEN
```

Pass `--api-token` or `--full-access-token` on the command line to override the stored values for a single invocation. `marvin config` with no arguments prints your current settings with tokens masked; pass `--with-secrets` to reveal them.

## Build From Source

Prebuilt binaries cover most cases. Build from source if you want to hack on marvin-cli or target a platform the release doesn't ship.

1. Install [Deno](https://deno.land) (v2.x or newer)
2. Clone the repo
3. Run `./build` (or `BUILD.bat` on Windows)
4. Rename the resulting `marvin-cli` (or `marvin-cli.exe`) to `marvin` (or `marvin.exe`) and copy it to your `PATH`

Run `./build-all` to produce binaries for all four supported platforms in `out/`.
