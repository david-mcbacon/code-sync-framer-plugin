# Code Sync - Framer Plugin

**Upload your `.tsx` files directly to Framer — automatically transformed, structured, and synced for efficient development.**

This is an **open-source Framer plugin**, available in the [Framer Marketplace](https://www.framer.com/marketplace/plugins/code-sync).  
Every developer’s workflow is different — that’s why this plugin is open source. You can contribute your own desired functionality or improvements.

👉 **Open a PR**, and I’ll review it!  
Each accepted contribution will be **credited in the plugin changelog** when the plugin is updated on the Framer Marketplace.

## 🚀 Overview

Framer Code Sync lets you upload `.tsx` files (or folders of them) directly into your Framer project.
It supports out-of-the-box file transfers or advanced customization through a config file — perfect for syncing large codebases or automating imports.

- 1:1 file copying by default
- Supports folder or file upload modes
- Optional config file for custom imports, ignored files, and string replacements
- Smart re-uploading (only changed files are updated)
- Environment variable support via `Env.tsx`

## 🛠️ Tech Stack

This Framer plugin is built as a modern React application with the following technologies:

- **React 18** - Component-based UI framework
- **TypeScript** - Type-safe JavaScript for robust development
- **Vite** - Fast build tool and development server
- **Framer Plugin API** - Integration with Framer's plugin system
- **CSS Styling** - Combination of inline styles and external `App.css` file. Planning to migrate to Tailwind CSS in the future.
- **ESLint** - Code linting and quality assurance

## 🤖 AI Agentic Coding Support

This repository includes `.cursor` and `.claude` folders with rules and context specifically designed to enhance AI agentic coding experiences. These folders contain:

- **`.cursor/rules/`** - Cursor IDE rules for improved AI-assisted development
- **`.claude/`** - Claude Code AI context and instructions for better code understanding

These files provide AI agents with project-specific knowledge, coding standards, and development workflows to ensure consistent and high-quality contributions.

## ⚡ Quick Start

1. **Select your upload mode** — folder or individual files
2. **Choose an environment** if you have an `Env.tsx` file
3. **Drag and drop** your files or use the file picker
4. On future uploads, **only modified files are re-uploaded**
   - Enable **“Overwrite all files”** to force a complete upload

## 📁 Upload Modes

**Folder Mode (default)**

- Select a folder via picker or drag & drop
- All `.tsx` files within are uploaded

**Files Mode**

- Select multiple `.tsx` files directly
- Supports mixed drag & drop (files and folders)

## 🗂️ Unpack to Root

Defines how uploaded files are placed inside your Framer project:

- ✅ **Checked (default)** — Files unpack directly to the root
- ⬜ **Unchecked** — Creates a folder matching your uploaded folder’s name, preserving its internal structure

## ⚙️ Configuration

You can customize the upload process using a configuration file:

**Supported file names:**

- `framer-code-sync.config.json`
- `framer-code-sync.config.jsonc` (supports comments)

The plugin merges UI settings with your config, giving **priority to the config file**.

**Example:**

```jsonc
{
  "version": 1,
  "importReplacements": [
    { "find": "@stripe/stripe-js", "replace": "./Bundles/Stripe_bundle.tsx" },
    { "find": "./mock/helpers", "replace": "https://example.com/helpers.js" }
  ],
  "ignoredFiles": ["./internal/mock.tsx"],
  "stringReplacements": [
    { "find": "(api.tasks.get)", "replace": "(\"tasks:get\")" }
  ]
}
```

### Configuration Options

- `importReplacements` — Replace import paths or modules
- `ignoredFiles` — Exclude specific files or directories from upload
- `stringReplacements` — Find and replace content (supports plain strings or regex)

## 🌍 Environment Variables

Add an `Env.tsx` file to your upload to define environment-specific values.  
The plugin replaces `ENV` references automatically with the selected environment’s values.

**Example:**

```tsx
export const ENV = {
  BACKEND_URL: {
    development: "http://localhost:3000",
    staging: "https://staging-api.example.com",
    production: "https://api.example.com",
  },
  API_KEY: {
    development: "dev-key-123",
    staging: "staging-key-456",
    production: "prod-key-789",
  },
};
```

Your selected environment is stored per project via `framer.setPluginData`, so collaborators share the same target.

## ⚙️ Advanced Features

- `Auto .tsx extensions` — Automatically adds .tsx to relative imports
- `Reliable upload strategy` — Files are created with placeholders, then updated with transformed content
- `Strict .tsx handling` — Only .tsx files are uploaded; all others are ignored

## 🧰 Troubleshooting

- `Upload fails` — Check the browser console for detailed error messages
- `Config not applied` — Ensure `framer-code-sync.config.json` is at the root of your uploaded folder
- `Import errors` — Verify that replacement URLs and paths are correct

## 💻 CLI

Push `.tsx` files to Framer from the command line — no plugin UI needed.

### Installation

**From source (current):**

```bash
git clone https://github.com/david-mcbacon/code-sync-framer-plugin.git
cd framer-code-sync/cli
pnpm install && pnpm build

# Link globally (first time may need: pnpm setup && restart terminal)
pnpm link --global
```

**From npm (once published):**

```bash
npm i -g framer-code-sync-cli
```

### Setup

Create `.env` in your project root:

```env
FRAMER_PROJECT_URL=https://framer.com/projects/YOUR-PROJECT-ID
FRAMER_API_KEY=YOUR-API-KEY
```

Optionally add `framer-code-sync.config.json` for transforms (same format as plugin config).

### Usage

```bash
framer-code-sync-cli push                    # push changed .tsx files (uses staging env by default)
framer-code-sync-cli push --force            # push all files
framer-code-sync-cli push --yes               # skip confirmation
framer-code-sync-cli push --refresh          # force refresh of Framer file cache
framer-code-sync-cli push --env production    # use production environment
framer-code-sync-cli push --env staging       # use staging environment (default)
framer-code-sync-cli push --env development   # use development environment
framer-code-sync-cli --help                   # show help
```

### How it works

1. Scans all `.tsx` files in current directory (recursive)
2. Filters to only changed files since last push (stored in `.framer-push-time`)
3. Checks which files exist in Framer:
   - Uses cached file structure from `.framer-files.json` (default, faster)
   - Fetches from Framer API if cache missing or `--refresh` flag used
4. Applies transforms from config (if present)
5. Replaces `ENV.tsx` variables based on selected environment (defaults to `staging`)
   - Replaces `ENV.*.development` → `ENV.*.{selected}` (e.g., `ENV.API_URL.development` → `ENV.API_URL.staging`)
6. Pushes to Framer via `framer-api`
7. Updates cache with newly created files

### File Caching

The CLI caches Framer's file structure in `.framer-files.json` to avoid API calls on every push. This significantly speeds up subsequent pushes since it doesn't need to fetch the file list from Framer.

- **First run**: Fetches from Framer and creates cache
- **Subsequent runs**: Uses cache by default (much faster)
- **Refresh cache**: Use `--refresh` or `--refetch` to force refetch from Framer
- **Auto-update**: Cache is automatically updated with newly created files after each push

## 🤝 Contributing

Every developer’s needs are different — that’s why this plugin is open source.
If there’s a feature you’d like to see, feel free to open a PR with your changes.
Once your PR is merged and the plugin is updated, you’ll be credited in the Framer plugin changelog for your contribution.

## 🪄 License

- MIT License © David McBacon
- See [`LICENSE`](./LICENCE) for details.

## 🧡 Author

- Developed by [David McBacon](https://github.com/david-mcbacon)
- Released on the [Framer Marketplace](https://www.framer.com/marketplace/plugins/code-sync)
