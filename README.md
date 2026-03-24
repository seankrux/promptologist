<div align="center">

# Promptologist

<p><strong>Advanced AI prompt management and automation for Chrome</strong></p>

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Available-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853?style=flat-square)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![Version](https://img.shields.io/badge/Version-2.0.0-blueviolet?style=flat-square)](#installation)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](#tech-stack)
[![Jest](https://img.shields.io/badge/Tests-Jest-C21325?style=flat-square&logo=jest&logoColor=white)](#testing)

**Save, organize, and inject AI prompts across ChatGPT, Claude, Gemini, Perplexity, Poe, and Grok — from a single unified library.**

</div>

---

## Overview

Promptologist transforms your browser into a professional prompt command center. Build a personal library of reusable, templatized prompts, organize them into categories, and inject them into any supported AI platform with a single click or right-click — no copy-paste, no repetition, no friction.

Works entirely offline. No accounts. No cloud sync. Your prompts stay on your machine.

---

## Demo

> Screenshots and demo GIFs coming soon. <!-- Add screenshots/GIFs here -->

---

## Why Promptologist?

Most people re-type the same prompts dozens of times a week across different AI tools. Promptologist eliminates that entirely.

| Problem | Promptologist's Answer |
|---|---|
| Switching between ChatGPT, Claude, Gemini requires re-entering context | One library, six platforms, instant injection |
| Prompts get lost in notes apps or chat history | Organized, searchable, categorized library — always one click away |
| Rephrasing the same prompt for different content wastes time | Template variables (`{{text}}`, `{{url}}`, `{{title}}`) make prompts reusable dynamically |
| Browser extensions that sync to the cloud are a privacy risk | 100% local storage via IndexedDB — nothing leaves your machine |
| Extensions slow down every site you visit | Content scripts scoped exclusively to supported AI domains |

Promptologist is built for power users, prompt engineers, researchers, writers, and developers who rely on AI tools daily and need a professional-grade workflow — not a toy bookmarks list.

---

## Features

- **Prompt Library** — Save, organize, and categorize prompts with folders and favorites
- **One-Click Injection** — Insert prompts directly into any supported AI chat input field
- **Context Menu Integration** — Right-click selected text to run prompts enriched with `{{text}}` variables
- **Template Variables** — Use `{{text}}`, `{{url}}`, and `{{title}}` for dynamic, reusable prompt content
- **Platform Auto-Detection** — Automatically identifies which AI service you are on and targets the correct input
- **Favorites & Usage Tracking** — Star your most-used prompts and surface them by frequency
- **Search & Filter** — Find any prompt instantly across your entire library
- **Retry with Exponential Backoff** — Gracefully handles slow platform loads without failing silently
- **Input Sanitization** — Prompt content is validated before injection to prevent XSS
- **Offline-First** — All data stored locally via IndexedDB; no account or server required

---

## Supported Platforms

| Platform | Domain | Auto-Detect |
|----------|--------|:-----------:|
| ChatGPT | `openai.com` | Yes |
| Claude | `claude.ai` | Yes |
| Gemini | `gemini.google.com` | Yes |
| Perplexity | `perplexity.ai` | Yes |
| Poe | `poe.com` | Yes |
| Grok | `grok.x.com` | Yes |

---

## Installation

### From Chrome Web Store

> Chrome Web Store listing coming soon.

### Manual Installation (Developer Mode)

```bash
git clone https://github.com/seankrux/promptologist.git
cd promptologist
npm install
npm run build
```

1. Open `chrome://extensions/` in Chrome
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select the cloned folder
4. Pin the Promptologist icon to your toolbar

---

## Usage

### Inject a prompt via context menu

1. Select text on any webpage
2. Right-click and choose **Promptologist** from the context menu
3. Pick a saved prompt — it opens your AI platform and fills the input automatically

### Manage your prompt library

1. Click the Promptologist icon in your toolbar
2. Create, edit, categorize, and favorite prompts from the popup
3. Open the **Settings** page for full library management, bulk actions, and import/export

### Template variables

| Variable | Replaced With |
|----------|--------------|
| `{{text}}` | Currently selected text on the page |
| `{{url}}` | URL of the active tab |
| `{{title}}` | Title of the active tab |

**Example:** A prompt like `"Summarize this for a technical audience: {{text}}"` becomes a one-click action for any selected content on any page.

---

## Development

### Prerequisites

- Node.js >= 16
- npm >= 8

### Setup

```bash
npm install
```

### Build

```bash
npm run build          # Development build
npm run build:prod     # Production build (minified, no console logs)
npm run dev            # Watch mode
```

### Testing

```bash
npm test               # Run full test suite
npm run test:watch     # Watch mode
npm run test:coverage  # Generate coverage report
```

---

## Architecture

```
manifest.json             Extension configuration (Manifest V3)
background.js             Service worker — context menus, message routing, retry logic
content.js                Content script — platform detection, input injection, sanitization
popup.html                Extension popup UI
options.html              Full settings / library management page
assets/                   Bundled JS/CSS modules (database, UI components)
icons/                    Extension icons (16, 32, 48, 128px)
__tests__/                Jest test suite
  background.test.js      Message validation, context menus, retry logic
  content.test.js         Input sanitization, platform detection
  storage.test.js         IndexedDB operations
  mocks/                  Chrome API mocks
  utils/                  Test helpers
webpack.config.js         Build configuration
jest.config.js            Test configuration
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Chrome Extension Manifest V3 |
| Language | JavaScript ES2022 |
| UI Framework | React (bundled) |
| Storage | Dexie.js (IndexedDB) |
| Build | Webpack 5 |
| Testing | Jest + jsdom |
| Transpiler | Babel |

---

## Security

Promptologist is built with a defense-in-depth approach:

- **Message validation** — All inter-script messages are verified against the extension's own ID and a strict type whitelist, preventing message injection attacks
- **Input sanitization** — Prompts are scanned for dangerous patterns (`<script>`, `javascript:`, `eval()`, and similar) before injection into any DOM element
- **Scoped permissions** — Content scripts run exclusively on supported AI platform domains, not on arbitrary websites
- **Content Security Policy** — Extension pages enforce `script-src 'self'; object-src 'self'`, blocking inline scripts and external resources
- **Minimal permissions** — Only the permissions required for core functionality are declared in `manifest.json`

---

## Contributing

Contributions are welcome. Please follow these steps:

1. **Fork** the repository and create a feature branch: `git checkout -b feat/your-feature`
2. **Write tests** for any new functionality — maintain existing coverage levels
3. **Run the full test suite** before submitting: `npm test`
4. **Lint your code**: `npm run lint`
5. **Open a pull request** with a clear description of what changed and why

### Reporting Issues

Please open a GitHub Issue with:
- Chrome version and OS
- Steps to reproduce the problem
- Expected vs. actual behavior
- Console errors (from `chrome://extensions` or DevTools), if any

### Roadmap Ideas

- Firefox / Edge support via WebExtensions API
- Import/export prompt library (JSON)
- Prompt versioning and history
- Keyboard shortcut for popup
- Additional platform support

---

<p align="center">Made with 💛 by <a href="https://www.seanguillermo.com"><strong>Sean G</strong></a></p>
