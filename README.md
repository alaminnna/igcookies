<p align="center">
  <img src="igcookies-icon.png" width="110" alt="igcookies logo" />
</p>

<p align="center">
  <img src="assets/cover.png" alt="igcookies cover" />
</p>

<h1 align="center">igcookies</h1>

<p align="center">
  <b>Instagram Session Manager</b> — one-click export of your logged-in Instagram session as an insta-fca-compatible <code>cookies.json</code>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest%20V3-ff2d55?style=for-the-badge&logo=google-chrome&logoColor=white" />
  <img src="https://img.shields.io/badge/Platform-Chrome-ff2d55?style=for-the-badge&logo=google-chrome&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-c252de?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Version-1.1.0-30d158?style=for-the-badge" />
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#download">Download</a> ·
  <a href="#installation">Installation</a> ·
  <a href="#usage">Usage</a> ·
  <a href="#security">Security</a> ·
  <a href="#license">License</a>
</p>

---

## About

**igcookies** is a lightweight, local-first Chrome extension for developers building Instagram integrations. It identifies your currently authenticated account, masks your session cookies, and lets you export them as a clean `cookies.json` ready for `insta-fca` — no password, no approval loop, no external server.

> Your development environment should stay transparent, predictable, and under your control.

---

## Features

| | |
|:--|:--|
| 🔐 **Account overview** | See your `@username` and `ds_user_id` before you export |
| 🧪 **Session inspection** | Masked cookie preview — `ds_user_id`, `csrftoken`, `mid` with per-row copy |
| 📋 **JSON export** | One-click copy of `cookies.json` for `insta-fca/test/cookies.json` |
| 💾 **Download** | Save `cookies-<ds_user_id>.json` directly to your machine |
| ⚙️ **Local configuration** | Persistent device identity (Pixel 8 Pro / Android 14) in `chrome.storage.local` |
| 🔄 **Device reset** | Generate fresh UUIDs on the next export |
| ✅ **Validation** | `tools/validate.js` checks your exported config structure |
| 🕶️ **Privacy-first** | No analytics, no telemetry, nothing leaves your machine |

---

## Download

<p align="center">
  ▶ <a href="assets/guide-download.mp4">Watch the download video guide</a>
</p>

Prefer the files only:

1. Open the **Code** menu on the repository page.
2. Select **Download ZIP**.
3. Extract the archive.
4. Continue with Installation below.

---

## Installation

### Requirements

- Google Chrome 110+
- An Instagram account
- A local copy of this repository

### Setup

```bash
git clone https://github.com/alaminnna/igcookies.git
cd igcookies
```

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the `igcookies` folder.
4. Open Instagram, log in, click the igcookies icon, and verify your account.

---

## Usage

Open the igcookies popup on any `instagram.com` tab:

1. Confirm the account in the header matches your logged-in user.
2. Review the masked session cookies in **Session cookies**.
3. Click **Copy `cookies.json`** — the full JSON goes to your clipboard.
4. Paste it into `insta-fca/test/cookies.json`, or click **Save** to download `cookies-<ds_user_id>.json`.
5. Switching accounts? Hit **Refresh** to re-export.
6. Need a fresh device identity? Click **Device** to reset, then export again.

---

## Project Structure

```text
igcookies/
├── manifest.json          # Extension manifest (Manifest V3)
├── background.js          # Service worker — builds insta-fca session
├── popup.html             # Extension UI
├── popup.js               # UI — copy, download, refresh, reset
├── content.js             # Content script — reads @username from Instagram
├── tools/
│   └── validate.js        # CLI validator for cookies.json
├── assets/
│   ├── guide-download.mp4 # Download video guide
│   └── guide-download-preview.png # Preview thumbnail
├── igcookies-icon.png     # Extension icon
├── LICENSE                # MIT License
└── README.md              # This file
```

---

## Architecture

| Component | Responsibility |
|:--|:--|
| `manifest.json` | Permissions (`cookies`, `storage`, `scripting`) + `*.instagram.com/*` host access |
| `background.js` | Service worker; exports minimal `insta-fca` session, manages device identity |
| `popup.html` | Extension UI — account header, cookie rows, actions |
| `popup.js` | Copy/download/refresh/reset logic, masked preview, toasts |
| `content.js` | Reads `@username` from the Instagram left-nav (no API calls) |
| `tools/validate.js` | Validates exported `cookies.json` structure |

Built on **Manifest V3** with a service worker. Only the cookies `insta-fca` needs are exported — nothing extra.

---

## Security

Authentication cookies are sensitive credentials. Treat them like a password.

- Never publish or commit exported session data.
- Keep exported files outside public repositories.
- Use only accounts you own or are authorized to manage.
- Revoke compromised sessions via Instagram's official security settings.

igcookies does not bypass authentication, two-factor authentication, or platform security verification. No data leaves your machine.

---

## Privacy

- No third-party analytics.
- No external telemetry.
- No intentional transmission of session data to external servers.
- Extension-generated settings stored locally in `chrome.storage.local`.

Review the source code and requested browser permissions before installation.

---

## Related Projects

**ica-unofficial**

An independent Node.js package for experimenting with Instagram integrations.

- [GitHub Repository](https://github.com/alaminnna/ica-unofficial)
- [npm Package](https://www.npmjs.com/package/@alaminnna/ica-unofficial)

---

## Disclaimer

igcookies is an independent, unofficial project.

It is not affiliated with, endorsed by, or associated with Meta Platforms, Inc. or Instagram. Users are responsible for complying with applicable platform terms and policies.

---

## Author

**Al A Min**

Independent Developer · Open Source Builder

[GitHub](https://github.com/alaminnna) · [Website](https://alaminnna.ami.bd) · [LinkedIn](https://linkedin.com/in/alaminnna/)

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <sub>Designed and maintained by <a href="https://github.com/alaminnna">Alaminnna</a>.</sub>
</p>
