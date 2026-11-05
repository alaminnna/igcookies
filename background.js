'use strict';

/* igcookies — background service worker
 * Reuses the approved browser session to build an insta-fca compatible MINIMAL cookies.json.
 * - Only the 5 cookies that matter: sessionid, ds_user_id, csrftoken, mid, rur
 * - No extra fields: _igcookies / fbns_auth / usdid are left out
 * - Device is generated once and kept in chrome.storage (same device every time)
 */

const DEVICE_KEY = 'igcookies_device_v1';

// Only what insta-fca loginWithSession needs — nothing else.
// datr, ig_did, wd, fbsr_... are web tracking cookies — the API login does not need them.
const KEEP_COOKIES = ['sessionid', 'ds_user_id', 'ds_user', 'csrftoken', 'mid', 'rur'];

const DEFAULT_DEVICE_SETTINGS = {
  android_version: 34,
  android_release: '14',
  dpi: '480dpi',
  resolution: '1344x2992',
  manufacturer: 'Google/google',
  device: 'husky',
  model: 'Pixel 8 Pro',
  cpu: 'husky',
  app_version: '448.0.0.0.20',
  version_code: '1065560286',
  bloks_versioning_id: '0bc46a03e177bfc9bc8d611918815acf248fa9c77754d807d6a5951dc9ce9432'
};

function uuid4() {
  return crypto.randomUUID();
}

function hex(n) {
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function buildUserAgent(deviceSettings, locale) {
  return (
    'Instagram ' + deviceSettings.app_version + ' Android (' +
    deviceSettings.android_version + '/' + deviceSettings.android_release + '; ' +
    deviceSettings.dpi + '; ' + deviceSettings.resolution + '; ' +
    deviceSettings.manufacturer + '; ' + deviceSettings.device + '; ' +
    deviceSettings.model + '; ' + deviceSettings.cpu + '; ' +
    locale + '; ' + deviceSettings.version_code + ')'
  );
}

async function loadOrCreateDevice() {
  const stored = await chrome.storage.local.get(DEVICE_KEY);
  if (stored && stored[DEVICE_KEY] && stored[DEVICE_KEY].uuids) {
    return stored[DEVICE_KEY];
  }
  const device = {
    uuids: {
      phone_id: uuid4(),
      uuid: uuid4(),
      client_session_id: uuid4(),
      advertising_id: uuid4(),
      android_device_id: 'android-' + hex(8),
      request_id: uuid4(),
      tray_session_id: uuid4()
    },
    deviceSettings: { ...DEFAULT_DEVICE_SETTINGS },
    userAgent: buildUserAgent(DEFAULT_DEVICE_SETTINGS, 'en_US'),
    locale: 'en_US',
    country: 'US',
    countryCode: 1,
    timezoneOffset: -14400,
    timezoneName: 'GMT-04:00'
  };
  await chrome.storage.local.set({ [DEVICE_KEY]: device });
  return device;
}

function toToughCookie(c) {
  let sameSite = 'lax';
  if (c.sameSite === 'strict') sameSite = 'strict';
  else if (c.sameSite === 'no_restriction') sameSite = 'none';
  const now = new Date().toISOString();
  return {
    key: c.name,
    value: c.value,
    domain: (c.domain || 'instagram.com').replace(/^\./, ''),
    path: c.path || '/',
    secure: Boolean(c.secure),
    httpOnly: Boolean(c.httpOnly),
    hostOnly: Boolean(c.hostOnly),
    creation: now,
    lastAccessed: now,
    sameSite
  };
}

async function readInstagramCookies() {
  const all = await chrome.cookies.getAll({});
  return all.filter(
    (c) => (c.domain || '').includes('instagram.com') && KEEP_COOKIES.includes(c.name)
  );
}

// Username comes from the page itself (left-nav profile link), never from an
// API call — Instagram rate-limits those (429). Runs on demand in the open
// Instagram tab, so it always reflects the currently logged-in account.
function scrapeInstagramUsername() {
  try {
    const skip = ['explore', 'reels', 'direct', 'accounts', 'p', 'stories', 'tv', 'about', 'developer', 'legal', 'lite'];
    const links = document.querySelectorAll('a[href^="/"]');
    for (const a of links) {
      const href = a.getAttribute('href') || '';
      const m = href.match(/^\/([A-Za-z0-9._]{1,30})\/$/);
      if (!m || skip.indexOf(m[1]) !== -1) continue;
      if (a.querySelector('img')) return m[1];
    }
  } catch (_) {}
  return '';
}

async function scrapeUsernameFromTabs() {
  try {
    const tabs = await chrome.tabs.query({ url: ['*://*.instagram.com/*'] });
    for (const tab of tabs) {
      if (!tab || tab.id === undefined) continue;
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: scrapeInstagramUsername
        });
        const name = results && results[0] && results[0].result;
        if (name) {
          const username = String(name);
          try {
            await chrome.storage.local.set({ igcookies_username: { username, at: Date.now() } });
          } catch (_) {}
          return username;
        }
      } catch (_) {}
    }
  } catch (_) {}
  return '';
}

async function getCachedUsername() {
  try {
    const stored = await chrome.storage.local.get('igcookies_username');
    const hit = stored && stored.igcookies_username;
    if (hit && hit.username) return String(hit.username);
  } catch (_) {}
  return '';
}

async function buildSession() {
  const device = await loadOrCreateDevice();
  const cookies = await readInstagramCookies();
  const byName = {};
  cookies.forEach((c) => { byName[c.name] = c.value; });

  const sessionid = byName['sessionid'] || '';
  const dsUserId = byName['ds_user_id'] || '';
  if (!sessionid || !dsUserId) {
    const err = new Error('NOT_LOGGED_IN: log in at instagram.com first, then reopen the panel and hit Refresh.');
    err.code = 'NOT_LOGGED_IN';
    throw err;
  }

  // MINIMAL — only what insta-fca src/auth/session.js applySettings reads.
  // username/fullName are display-only (the bot login does not use them).
  const csrftoken = byName['csrftoken'] || '';
  const username = byName['ds_user'] || (await scrapeUsernameFromTabs()) || (await getCachedUsername());
  return {
    uuids: device.uuids,
    mid: byName['mid'] || '',
    username,
    fullName: '',
    authorizationData: { ds_user_id: String(dsUserId), sessionid: String(sessionid) },
    cookieStore: {
      name: 'tough-cookie@6.0.2',
      storeType: 'MemoryCookieStore',
      rejectPublicSuffixes: true,
      enableLooseMode: false,
      allowSpecialUseDomain: true,
      prefixSecurity: 'silent',
      cookies: cookies.map(toToughCookie)
    },
    lastLogin: Date.now(),
    deviceSettings: device.deviceSettings,
    userAgent: device.userAgent,
    locale: device.locale,
    country: device.country,
    countryCode: device.countryCode,
    timezoneOffset: device.timezoneOffset,
    timezoneName: device.timezoneName,
    csrftoken: byName['csrftoken'] || ''
  };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || (msg.action !== 'export' && msg.action !== 'resetDevice')) return false;
  (async () => {
    try {
      if (msg.action === 'resetDevice') {
        await chrome.storage.local.remove(DEVICE_KEY);
        sendResponse({ ok: true, reset: true });
        return;
      }
      const session = await buildSession();
      sendResponse({ ok: true, session });
    } catch (err) {
      sendResponse({ ok: false, error: (err && err.message) || String(err), code: (err && err.code) || '' });
    }
  })();
  return true; // async response
});
