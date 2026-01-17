# Project Overview

**Code Sync** = Framer plugin + CLI to upload/export `.tsx` between local FS and Framer.

- **Plugin** (`src/`): React app inside Framer  
- **CLI** (`cli/`): Push files via `framer-api`

## Commands

Plugin:
- `pnpm dev` dev server (https, mkcert)
- `pnpm build` prod build
- `pnpm lint`

CLI (from `cli/`):
- `pnpm push` push changed
- `pnpm push:force` push all
- `pnpm push:yes` no confirm

## Architecture

### Plugin (`src/`)
- `App.tsx` tabs: Upload / Export / Docs
- `pages/upload` drag-drop upload + transforms
- `pages/export` export Framer code zip
- `pages/docs` docs

Upload flow (`pages/upload/lib`):
1. load config (`config-loader`)
2. read files + paths (`file-processing`)
3. string/import transforms (`string-transforms`)
4. upload: placeholder → real content (`upload-logic`)

Types (`types.ts`):
- `CodeSyncConfig`
- `ImportReplacementRule`, `StringReplacementRule`
- `UploadState`

### CLI (`cli/`)
- `push.ts` args `--force`, `--yes`
- `file-scanner` tsx scan + mtime filter
- `transform` load config + apply rules
- `framer-push` upload via API

Needs `.env` with `FRAMER_PROJECT_URL`.

## Config

`framer-code-sync.config.json` at upload root:
- `version`
- `importReplacements`
- `stringReplacements`
- `ignoredFiles`

## Code Style

- Tailwind only, no CSS files
- Handlers: `handleClick`, `handleKeyDown`
- Early returns
- Use `framer-plugin` SDK