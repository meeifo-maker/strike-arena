const fs = require('fs');
const https = require('https');
const path = require('path');
const os = require('os');
const j = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.config/configstore/firebase-tools.json'), 'utf8'));
const token = j.tokens.access_token;

function req(method, url) {
  return new Promise((res, rej) => {
    const u = new URL(url);
    const r = https.request(
      { hostname: u.hostname, path: u.pathname + u.search, method, headers: { Authorization: 'Bearer ' + token } },
      (rr) => {
        let d = '';
        rr.on('data', (c) => (d += c));
        rr.on('end', () => {
          try {
            res({ status: rr.statusCode, body: JSON.parse(d || '{}') });
          } catch (e) {
            res({ status: rr.statusCode, body: d });
          }
        });
      }
    );
    r.on('error', rej);
    r.end();
  });
}

(async () => {
  const list = await req(
    'GET',
    'https://firebasehosting.googleapis.com/v1beta1/projects/strike-arena-ethan/sites/strike-arena-ethan/versions?pageSize=100'
  );
  console.log('status', list.status, 'count', (list.body.versions || []).length);
  if (list.status !== 200) {
    console.log(list.body);
    return;
  }
  const vers = (list.body.versions || []).sort((a, b) => (b.createTime || '').localeCompare(a.createTime || ''));
  let i = 0;
  for (const v of vers) {
    i++;
    console.log(i, v.status, v.createTime, v.name);
    if (i <= 2) continue;
    const del = await req('DELETE', 'https://firebasehosting.googleapis.com/v1beta1/' + v.name);
    console.log('DEL', del.status, v.name.split('/').pop());
  }
})();
