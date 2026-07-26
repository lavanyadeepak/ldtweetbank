const express = require('express');
const path = require('path');
const fs = require('fs');
const { put, get } = require('@vercel/blob');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const TEMPLATE_PATH = path.join(__dirname, 'public', 'template.tweetbank.json');
const BLOB_PATHNAME = 'current.tweetbank.json'; // stable name, no random suffix

function readJsonIfExists(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function validateTweetbankData(data) {
  if (!data || typeof data !== 'object') return { ok: false, error: 'Invalid JSON object.' };
  if (!data.config || typeof data.config !== 'object' || Array.isArray(data.config)) {
    return { ok: false, error: 'Missing/invalid `config` object.' };
  }
  if (!Array.isArray(data.tweets)) return { ok: false, error: 'Missing/invalid `tweets` array.' };
  for (let i = 0; i < data.tweets.length; i++) {
    const tweet = data.tweets[i];
    if (!tweet || typeof tweet !== 'object') return { ok: false, error: `Tweet #${i + 1} must be an object.` };
    if (typeof tweet.text !== 'string') return { ok: false, error: `Tweet #${i + 1} missing string \`text\`.` };
  }
  return { ok: true };
}

// ── Blob helpers ──────────────────────────────────────────────────────────────
// Read the blob by pathname so this works with a private Blob store too. Private
// blob URLs cannot be fetched directly without the SDK's authentication.
async function readCurrentFromBlob() {
  try {
    const result = await get(BLOB_PATHNAME, { access: 'private' });
    if (!result || result.statusCode !== 200) return null;
    return await new Response(result.stream).json();
  } catch {
    return null;
  }
}

async function writeCurrentToBlob(data) {
  await put(BLOB_PATHNAME, JSON.stringify(data, null, 2) + '\n', {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,      // keep the pathname stable so we can find it again
    allowOverwrite: true,        // required when re-using the same pathname
  });
}

// In-memory cache for the lifetime of a single serverless instance.
// Not guaranteed to persist across invocations — that's what the blob is for.
let currentData = null;

async function getCurrentData() {
  if (currentData) return currentData;
  currentData =
    (await readCurrentFromBlob()) ??
    readJsonIfExists(TEMPLATE_PATH) ??
    { config: {}, tweets: [] };
  return currentData;
}

// ── API: get all tweets ──────────────────────────────────────────────────────
app.get('/api/tweets', async (req, res) => {
  const data = await getCurrentData();
  res.json(data.tweets ?? []);
});

// ── API: get config ─────────────────────────────────────────────────────────
app.get('/api/config', async (req, res) => {
  const data = await getCurrentData();
  res.json(data.config ?? {});
});

function requireUploadAuth(req, res, next) {
  const token = normalizeToken(process.env.UPLOAD_TOKEN);
  if (!token) return res.status(503).json({ error: 'Upload disabled: UPLOAD_TOKEN not set.' });

  const provided = normalizeToken(req.body?.token || '');
  if (provided !== token) return res.status(401).json({ error: 'Unauthorized.' });
  next();
}

function normalizeToken(value) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1).trim();
  }
  return s;
}

// ── API: upload tweetbank JSON ───────────────────────────────────────────────
app.post('/api/upload', requireUploadAuth, async (req, res) => {
  const { token, ...data } = req.body; // Extract and discard token
  const v = validateTweetbankData(data);
  if (!v.ok) return res.status(400).json({ error: v.error });

  currentData = data;
  try {
    await writeCurrentToBlob(currentData);
  } catch (err) {
    console.error('Blob write failed:', err);
    return res.status(500).json({ error: 'Failed to persist to Blob storage.' });
  }

  res.json({ ok: true, tweets: currentData.tweets.length });
});

// ── Start server (local/dev) ──────────────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n🐾 LD Tweetbank running at http://localhost:${PORT}\n`);
  });
}

module.exports = app;
