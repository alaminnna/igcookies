'use strict';
/* igcookies panel — auto-load, preview + copy. Download optional, auto na. */

let lastSession = null;
let lastText = '';

const $ = (id) => document.getElementById(id);

function toast(msg, kind) {
  const el = $('toast');
  el.textContent = msg;
  el.className = 'show ' + (kind || '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.className = ''; }, 3500);
}

function mask(value) {
  const v = String(value || '');
  if (v.length <= 10) return v ? '•••' + v.slice(-3) : '—';
  return v.slice(0, 4) + '•••' + v.slice(-3);
}

function setStatus(state, text) {
  const dot = document.getElementById('statusDot');
  const label = document.getElementById('statusText');
  if (dot) dot.className = 'dot' + (state ? ' ' + state : '');
  if (label) {
    label.textContent = text;
    label.className = 'status-text' + (state ? ' ' + state : '');
  }
}

function skeleton() {
  $('main').innerHTML =
    '<div class="card"><div class="skeleton" style="width:40%"></div>' +
    '<div class="skeleton" style="width:70%"></div>' +
    '<div class="skeleton" style="width:55%"></div></div>';
  $('copyJson').disabled = true;
}

function errorCard(message) {
  $('main').innerHTML =
    '<div class="card error-card"><div class="account-top"><span class="dot dead"></span>' +
    '<p class="account-label">Session status</p>' +
    '<span class="status-text dead">not logged in</span></div>' +
    '<p><strong>No Instagram login found.</strong></p>' +
    '<p>' + escapeHtml(message) + '</p>' +
    '<ol><li>Log in to the correct account in the instagram.com tab</li>' +
    '<li>Close and reopen the panel, then hit Refresh</li></ol></div>';
  $('copyJson').disabled = true;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function cookieRow(name, value) {
  return (
    '<div class="row"><span class="key">' + escapeHtml(name) + '</span>' +
    '<span class="val" title="' + escapeHtml(String(value || '')) + '">' + escapeHtml(mask(value)) + '</span>' +
    '<button class="icon-btn" data-copy="' + escapeHtml(name) + '" aria-label="Copy ' + escapeHtml(name) + '">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
    '</button></div>'
  );
}

function render(session) {
  lastSession = session;
  lastText = JSON.stringify(session, null, 2);
  const dsUserId = session.authorizationData.ds_user_id;
  const username = session.username || '';
  const fullName = session.fullName || '';
  const accountTitle = username
    ? '<p class="account-id">@' + escapeHtml(username) + '</p>' +
      (fullName ? '<p class="account-name">' + escapeHtml(fullName) + '</p>' : '') +
      '<p class="account-id-sub">id ' + escapeHtml(dsUserId) + '</p>'
    : '<p class="account-id">' + escapeHtml(dsUserId) + '</p>';
  const cookies = session.cookieStore.cookies;
  const byName = {};
  cookies.forEach((c) => { byName[c.key] = c.value; });

  setStatus('live', 'logged in');
  const html =
    '<div class="card"><div class="account-top"><span class="dot live"></span>' +
    '<p class="account-label">Currently logged in</p>' +
    '<span class="status-text live">logged in</span></div>' +
    accountTitle +
    '<p class="account-hint">Wrong account? Switch accounts in the Instagram tab and hit Refresh.</p></div>' +
    '<div class="card">' +
    cookieRow('sessionid', byName['sessionid']) +
    cookieRow('ds_user_id', byName['ds_user_id']) +
    cookieRow('csrftoken', byName['csrftoken']) +
    cookieRow('mid', byName['mid']) +
    cookieRow('rur', byName['rur']) +
    '<details class="preview"><summary>Full JSON preview (' + cookies.length + ' cookies)</summary>' +
    '<pre class="json">' + escapeHtml(lastText) + '</pre></details></div>';
  $('main').innerHTML = html;
  $('copyJson').disabled = false;

  $('main').querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const name = btn.getAttribute('data-copy');
      await navigator.clipboard.writeText(String(byName[name] || ''));
      toast(name + ' copied', 'success');
    });
  });
}

async function load() {
  skeleton();
  setStatus('', 'checking');
  try {
    const res = await chrome.runtime.sendMessage({ action: 'export' });
    if (!res || !res.ok) {
      errorCard((res && res.error) || 'unknown error');
      return;
    }
    render(res.session);
  } catch (e) {
    errorCard(e.message || String(e));
  }
}

$('copyJson').addEventListener('click', async () => {
  if (!lastText) return;
  await navigator.clipboard.writeText(lastText);
  toast('Copied. Paste it into test/cookies.json.', 'success');
});

$('refresh').addEventListener('click', load);

document.addEventListener('DOMContentLoaded', load);
