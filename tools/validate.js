'use strict';
/* igcookies validator — node tools/validate.js <cookies.json> */
const fs = require('node:fs');
const path = require('node:path');

function fail(msg) {
  console.error('FAIL: ' + msg);
  process.exitCode = 1;
}

function main() {
  const file = process.argv[2] || path.join(__dirname, '..', '..', 'insta-fca', 'test', 'cookies.json');
  let s;
  try {
    s = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    fail('cannot read file: ' + file + ' (' + e.message + ')');
    return;
  }
  const errs = [];
  if (!s.uuids || !s.uuids.uuid) errs.push('uuids.uuid missing');
  if (!s.authorizationData || !s.authorizationData.sessionid) errs.push('authorizationData.sessionid missing');
  if (!s.authorizationData || !s.authorizationData.ds_user_id) errs.push('authorizationData.ds_user_id missing');
  const cookies = (s.cookieStore && s.cookieStore.cookies) || [];
  const names = cookies.map((c) => c.key || c.name);
  if (!s.cookieStore) errs.push('cookieStore missing');
  if (!s.deviceSettings || !s.userAgent) errs.push('deviceSettings/userAgent missing');
  const warns = [];
  if (!names.includes('sessionid')) warns.push('no sessionid in cookieStore (authorizationData will be used instead)');
  if (!names.includes('ds_user_id')) warns.push('no ds_user_id in cookieStore (authorizationData will be used instead)');
  if (errs.length) {
    errs.forEach((e) => console.error(' - ' + e));
    fail('invalid session: ' + file);
    return;
  }
  console.log('OK! user=' + s.authorizationData.ds_user_id + ' cookies=' + cookies.length + ' file=' + file);
  warns.forEach((w) => console.log('warn: ' + w));
}

main();
