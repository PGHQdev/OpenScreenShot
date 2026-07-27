#!/usr/bin/env node
// One-off: get a Chrome Web Store refresh token for a Desktop OAuth client.
// Usage: CLIENT_ID=... CLIENT_SECRET=... node scripts/cws-token.mjs
// Opens a browser, captures the code on a loopback port, prints the refresh token.
import http from 'node:http';
import { exec } from 'node:child_process';

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set CLIENT_ID and CLIENT_SECRET env vars.');
  process.exit(1);
}
const SCOPE = 'https://www.googleapis.com/auth/chromewebstore';

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${server.address().port}`);
  const code = url.searchParams.get('code');
  if (!code) {
    res.end('No code.');
    return;
  }
  res.end('Done — you can close this tab.');
  const redirectUri = `http://127.0.0.1:${server.address().port}`;
  const body = new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = await resp.json();
  if (json.refresh_token) {
    console.log('\nREFRESH TOKEN:\n' + json.refresh_token + '\n');
  } else {
    console.error('\nNo refresh_token in response:', json);
  }
  server.close();
});

server.listen(0, '127.0.0.1', () => {
  const redirectUri = `http://127.0.0.1:${server.address().port}`;
  const authUrl =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPE,
      access_type: 'offline',
      prompt: 'consent',
    });
  console.log('Opening browser… if it does not open, visit:\n' + authUrl + '\n');
  const open =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${open} "${authUrl}"`);
});
