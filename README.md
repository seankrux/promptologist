<div align="center">

# Promptologist

**AI prompt management and automation for Chrome**

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat-square&logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853?style=flat-square)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

</div>

---

## Overview

Promptologist is a Chrome extension for managing, organizing, and automating AI prompts across multiple platforms. Works with ChatGPT, Claude, Gemini, Perplexity, Poe, and Grok — providing a unified prompt library with one-click injection.

## Supported Platforms

| Platform | URL |
|----------|-----|
| ChatGPT | `openai.com` |
| Claude | `claude.ai` |
| Gemini | `gemini.google.com` |
| Perplexity | `perplexity.ai` |
| Poe | `poe.com` |
| Grok | `grok.x.com` |

## Features

▸ **Prompt Library** — Save, organize, and categorize prompts with tags and folders

▸ **One-Click Injection** — Insert prompts directly into any supported AI chat interface

▸ **Multi-Platform** — Works across 6 major AI platforms with automatic detection

▸ **Context Menus** — Right-click to quickly insert saved prompts

▸ **Search & Filter** — Find prompts instantly across your entire library

▸ **Import / Export** — Backup and share prompt collections

▸ **Keyboard Shortcuts** — Fast access without leaving the keyboard

▸ **Offline Storage** — All data stored locally in Chrome, no account required

## Installation

1. Clone this repository
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode**
4. Click **Load unpacked** and select this folder
5. Pin the extension for quick access

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Chrome Extension (Manifest V3) |
| Language | JavaScript ES2022 |
| Build | Webpack |
| Testing | Jest |
| Storage | Chrome Storage API |

## Project Structure

```
manifest.json          Extension manifest (MV3)
background.js          Service worker — message routing
content.js             Content script — platform detection & injection
popup.html / .js / .css   Extension popup UI
icons/                 Extension icons
assets/                Static assets
__tests__/             Test suite
```

## License

MIT

---

<p align="center">Made with 💛 by Sean G</p>
