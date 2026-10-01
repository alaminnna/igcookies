'use strict';

/* cross-browser shim: Firefox exposes `browser`, Chrome/Edge expose `chrome`. */

(function normalizeExtApi() {
  try {
    var hasBrowser = (typeof browser !== 'undefined' && browser && browser.storage);
    var hasChrome = (typeof chrome !== 'undefined' && chrome && chrome.storage);
    if (hasBrowser && !hasChrome) {
      globalThis.chrome = browser;
    }
  } catch (_) {}
})();

/* igcookies — content script, runs on instagram.com pages.
 * Reads the visible @username from the left-nav profile link
 * (href="/username/" holding the avatar image) and caches it.
 * No API calls, so Instagram has nothing to rate-limit (no 429).
 */

const SKIP_SEGMENTS = new Set([
  'explore', 'reels', 'direct', 'accounts', 'p', 'stories',
  'tv', 'about', 'developer', 'legal', 'lite'
]);

function findUsername() {
  const links = document.querySelectorAll('a[href^="/"]');
  for (const a of links) {
    const href = a.getAttribute('href') || '';
    const m = href.match(/^\/([A-Za-z0-9._]{1,30})\/$/);
    if (!m || SKIP_SEGMENTS.has(m[1])) continue;
    if (a.querySelector('img')) return m[1];
  }
  return '';
}

let lastSave = 0;

function save() {
  const now = Date.now();
  if (now - lastSave < 5000) return;
  const username = findUsername();
  if (!username) return;
  lastSave = now;
  try {
    chrome.storage.local.set({ igcookies_username: { username, at: now } });
  } catch (_) {}
}

save();
new MutationObserver(save).observe(document.documentElement, { childList: true, subtree: true });
