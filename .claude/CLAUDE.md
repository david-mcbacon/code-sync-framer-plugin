# Project Overview

**Code Sync** = Framer plugin + CLI to upload/export `.tsx` between local FS and Framer.

- **Plugin** (`src/`): React app inside Framer  
- **CLI** (`cli/`): Push files via `framer-api`

## Commands

Plugin:
- `pnpm dev` dev server (https, mkcert)
- `pnpm build` prod build
- `pnpm lint`

CLI (global):
- `framer-code-sync-cli push` push changed
- `framer-code-sync-cli push --force` push all
- `framer-code-sync-cli push --yes` skip confirm
- `framer-code-sync-cli push --refresh` refresh Framer file cache

CLI dev (from `cli/`):
- `pnpm build` compile to dist/
- `pnpm link --global` link globally

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
- `index.ts` entry point, command router
- `push.ts` exports `runPush()`, args `--force`, `--yes`, `--refresh`, `--env`
- `lib/file-scanner` tsx scan from cwd + mtime filter + Framer file cache
- `lib/transform` load config from cwd + apply rules
- `lib/framer-push` upload via API
- Environment-specific `.env` files: `.env` (dev), `.env.staging`, `.env.production`
- Environment-specific cache in `.framer-code-sync-cli/`: `.framer-files.json` (dev), `.framer-files.json.{env}` (others)
- Default environment: `development`
- Caches Framer file structure per environment to avoid API calls (uses cache by default, `--refresh` forces refetch)
Globally installable via `npm i -g framer-code-sync-cli`.

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