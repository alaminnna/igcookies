# Release v1.1.0

## Changes

* Added one-click export of the current Instagram browser session (`sessionid` + `ds_user_id`)
* Added account identity display (`@username` + `ds_user_id`) before exporting
* Added masked cookie preview (`sessionid`, `ds_user_id`, `csrftoken`, `mid`, `rur`) with per-row copy buttons
* Added full `cookies.json` preview with cookie count
* Added Copy `cookies.json` for direct paste into `insta-fca/test/cookies.json`
* Added Download button (`cookies-<ds_user_id>.json`)
* Added Refresh support for switching Instagram accounts
* Added persistent device identity (Pixel 8 Pro / Android 14) stored in `chrome.storage.local`
* Added Reset Device option (clears `igcookies_device_v1`, generates fresh UUIDs on next export)
* Added `tools/validate.js` (`node tools/validate.js <cookies.json>`) to check `uuids`, `authorizationData`, `cookieStore`, device
* Improved username detection: `ds_user` cookie → live tab scrape via `chrome.scripting.executeScript` → cached `igcookies_username`
* Improved error handling with `NOT_LOGGED_IN` recovery steps when no Instagram session is found
* Improved privacy by keeping exported session data local (no server, no analytics, no Instagram API calls)
* Added Firefox compatibility groundwork (cross-browser `browser` → `chrome` shim in `background.js` + `content.js`)
* Updated documentation and installation instructions

## Security

* Session cookies are sensitive credentials and should be treated like a password
* Never commit exported `cookies.json` files to Git
* Cookie values are masked in the extension UI by default
* No third-party analytics or server-side session storage is used
* Extension only requests `cookies`, `storage`, `scripting` + `*://*.instagram.com/*`

## Installation

1. Download `igcookies-1.1.0-chrome.zip` below and extract it
2. Open `chrome://extensions`, enable Developer mode
3. Click **Load unpacked** and select the extracted folder
4. Log in at `instagram.com`, click the igcookies icon, verify the account, hit Copy

See `README.md` for full usage, validation, and troubleshooting.

## Assets

* `igcookies-1.1.0-chrome.zip` — Load unpacked package (extension only)
* `igcookies-1.1.0-sources.zip` — Full source snapshot (`git archive HEAD`)

### SHA256

```text
__CHROME_SHA256__  igcookies-1.1.0-chrome.zip
__SOURCES_SHA256__  igcookies-1.1.0-sources.zip
```
