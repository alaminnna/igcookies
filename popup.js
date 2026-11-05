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
  const dot = $('statusDot');
  const label = $('statusText');
  if (dot) dot.className = 'dot' + (state ? ' ' + state : '');
  if (label) {
    label.textContent = text;
    label.className = 'status-text' + (state ? ' ' + state : '');
  }
}

function skeleton() {
  $('main').innerHTML =
    '<div class="card pad">' +
    '<div class="skeleton" style="width:44%;height:14px"></div>' +
    '<div class="skeleton" style="width:68%;margin-top:10px"></div>' +
    '<div class="skeleton" style="width:52%;margin-top:8px"></div>' +
    '</div>' +
    '<div class="card pad">' +
    '<div class="skeleton" style="width:100%"></div>' +
    '<div class="skeleton" style="width:88%;margin-top:9px"></div>' +
    '<div class="skeleton" style="width:94%;margin-top:9px"></div>' +
    '</div>';
  $('copyJson').disabled = true;
  const dl = $('downloadJson');
  if (dl) dl.disabled = true;
}

function errorCard(message) {
  $('main').innerHTML =
    '<div class="card error-card">' +
    '<div class="error-head">' +
    '<span class="error-badge">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16.5" x2="12" y2="16.6"/></svg>' +
    '</span>' +
    '<p class="error-title">No Instagram login found</p>' +
    '</div>' +
    '<p class="error-body">' + escapeHtml(message) + '</p>' +
    '<ol>' +
    '<li><span>1</span><span>Log in to the correct account in the instagram.com tab</span></li>' +
    '<li><span>2</span><span>Close and reopen the panel, then hit Refresh</span></li>' +
    '</ol>' +
    '</div>';
  $('copyJson').disabled = true;
  const dl = $('downloadJson');
  if (dl) dl.disabled = true;
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
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
    '</button></div>'
  );
}

function render(session) {
  lastSession = session;
  lastText = JSON.stringify(session, null, 2);
  const dsUserId = session.authorizationData.ds_user_id;
  const username = session.username || '';
  const fullName = session.fullName || '';
  const initial = (username || String(dsUserId) || '?').charAt(0);

  const accountTitle =
    '<p class="account-id">' + (username ? '@' + escapeHtml(username) : escapeHtml(dsUserId)) + '</p>' +
    (fullName ? '<p class="account-name">' + escapeHtml(fullName) + '</p>' : '') +
    '<p class="account-id-sub">id ' + escapeHtml(dsUserId) + '</p>';

  const cookies = session.cookieStore.cookies;
  const byName = {};
  cookies.forEach((c) => { byName[c.key] = c.value; });

  setStatus('live', 'logged in');

  const html =
    '<div class="card pad">' +
    '<div class="account-head">' +
    '<span class="avatar">' + escapeHtml(initial) + '</span>' +
    '<div class="account-meta">' + accountTitle + '</div>' +
    '<button class="account-refresh" aria-label="Refresh session" title="Refresh">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/></svg>' +
    '</button>' +
    '</div>' +
    '<p class="account-hint">Wrong account? Switch account in the Instagram tab, then hit Refresh.</p>' +
    '</div>' +

    '<div class="card">' +
    '<div class="card-head">' +
    '<p class="card-title">Session cookies</p>' +
    '<span class="count">' + cookies.length + '</span>' +
    '</div>' +
    '<div class="rows">' +
    cookieRow('ds_user_id', byName['ds_user_id']) +
    cookieRow('csrftoken', byName['csrftoken']) +
    cookieRow('mid', byName['mid']) +
    '</div>' +
    '<details class="preview"><summary>Full JSON preview</summary>' +
    '<pre class="json">' + escapeHtml(lastText) + '</pre></details></div>';

  $('main').innerHTML = html;
  $('copyJson').disabled = false;
  const dl = $('downloadJson');
  if (dl) dl.disabled = false;

  $('main').querySelector('.account-refresh')?.addEventListener('click', load);

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
      setStatus('dead', 'not logged in');
      return;
    }
    render(res.session);
  } catch (e) {
    errorCard(e.message || String(e));
    setStatus('dead', 'not logged in');
  }
}

$('copyJson').addEventListener('click', async () => {
  if (!lastText) return;
  await navigator.clipboard.writeText(lastText);
  toast('Copied. Paste it into test/cookies.json.', 'success');
});

const downloadBtn = $('downloadJson');
if (downloadBtn) {
  downloadBtn.addEventListener('click', () => {
    if (!lastText) return;
    const dsUserId = (lastSession && lastSession.authorizationData && lastSession.authorizationData.ds_user_id) || 'session';
    const blob = new Blob([lastText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cookies-' + dsUserId + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast('Downloaded cookies-' + dsUserId + '.json', 'success');
  });
}

const resetBtn = $('resetDevice');
if (resetBtn) {
  resetBtn.addEventListener('click', async () => {
    try {
      const res = await chrome.runtime.sendMessage({ action: 'resetDevice' });
      if (res && res.ok) {
        toast('Device reset. Refreshing with a new device...', 'success');
        await load();
      } else {
        toast('Reset failed: ' + ((res && res.error) || 'unknown error'), 'error');
      }
    } catch (e) {
      toast('Reset failed: ' + (e.message || String(e)), 'error');
    }
  });
}

$('refresh').addEventListener('click', load);

document.addEventListener('DOMContentLoaded', load);
