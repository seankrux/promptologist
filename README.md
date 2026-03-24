<div align="center">

# Promptologist

<p><strong>AI prompt management and automation for Chrome</strong></p>

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853?style=flat-square)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](#tech-stack)
[![Jest](https://img.shields.io/badge/Tests-Jest-C21325?style=flat-square&logo=jest&logoColor=white)](#testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

Save, organize, and inject AI prompts across ChatGPT, Claude, Gemini, Perplexity, Poe, and Grok — from a single unified library.

</div>

---

## Overview

Promptologist is a Chrome extension that turns your browser into a prompt command center. Build a personal library of reusable prompts, organize them into categories, and inject them into any supported AI platform with a single right-click.

No accounts. No cloud sync. Everything stays local.

## Supported Platforms

| Platform | Domain | Auto-Detect |
|----------|--------|:-----------:|
| ChatGPT | `openai.com` | Yes |
| Claude | `claude.ai` | Yes |
| Gemini | `gemini.google.com` | Yes |
| Perplexity | `perplexity.ai` | Yes |
| Poe | `poe.com` | Yes |
| Grok | `grok.x.com` | Yes |

## Features

▸ **Prompt Library** -- Save, organize, and categorize prompts with folders and favorites

▸ **One-Click Injection** -- Insert prompts directly into any supported AI chat input field

▸ **Context Menu Integration** -- Right-click selected text to run prompts with `{{text}}` variables

▸ **Template Variables** -- Use `{{text}}`, `{{url}}`, and `{{title}}` for dynamic prompt content

▸ **Platform Auto-Detection** -- Automatically identifies which AI service you are on

▸ **Favorites & Usage Tracking** -- Star your best prompts and see which ones you use most

▸ **Search & Filter** -- Find prompts instantly across your entire library

▸ **Retry with Backoff** -- Automatic exponential retry if a platform is slow to load

▸ **Input Sanitization** -- Prompt content is validated before injection to prevent XSS

▸ **Offline-First** -- All data stored locally via IndexedDB, no account or server required

## Installation

```bash
git clone https://github.com/seankrux/promptologist.git
```

1. Open `chrome://extensions/` in Chrome
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select the cloned folder
4. Pin the Promptologist icon to your toolbar

## Usage

#### Inject a prompt via context menu

1. Select text on any webpage
2. Right-click and choose **Promptologist** from the context menu
3. Pick a saved prompt -- it opens your AI platform and fills the input automatically

#### Manage prompts

1. Click the Promptologist icon in your toolbar
2. Create, edit, categorize, and favorite prompts
3. Open the **Settings** page for full library management

#### Template variables

| Variable | Replaced With |
|----------|--------------|
| `{{text}}` | Currently selected text on the page |
| `{{url}}` | URL of the active tab |
| `{{title}}` | Title of the active tab |

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
npm test               # Run test suite
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Chrome Extension Manifest V3 |
| Language | JavaScript ES2022 |
| UI Framework | React (bundled) |
| Storage | Dexie.js (IndexedDB) |
| Build | Webpack 5 |
| Testing | Jest + jsdom |
| Transpiler | Babel |

## Architecture

```
manifest.json             Extension configuration (Manifest V3)
background.js             Service worker -- context menus, message routing, retry logic
content.js                Content script -- platform detection, input injection, sanitization
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

## Security

Promptologist implements several security measures:

▸ **Message validation** -- All inter-script messages are verified against the extension's own ID and a strict type whitelist

▸ **Input sanitization** -- Prompts are scanned for dangerous patterns (`<script>`, `javascript:`, `eval()`, etc.) before injection

▸ **Scoped permissions** -- Content scripts only run on supported AI platform domains, not all websites

▸ **Content Security Policy** -- Extension pages enforce `script-src 'self'`

## License

[MIT](LICENSE)

---

<p align="center">Made with 💛 by Sean G</p>
