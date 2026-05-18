const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
const CURRENT_DATA_PATH = path.join(DATA_DIR, 'current.tweetbank.json');
const TEMPLATE_PATH = path.join(__dirname, 'public', 'template.tweetbank.json');

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

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

const initialData =
  readJsonIfExists(CURRENT_DATA_PATH) ??
  readJsonIfExists(TEMPLATE_PATH) ??
  { config: {}, tweets: [] };

let currentData = initialData;

// ── API: get all tweets ──────────────────────────────────────────────────────
app.get('/api/tweets', (req, res) => {
  res.json(currentData.tweets ?? []);
});

// ── API: get config ─────────────────────────────────────────────────────────
app.get('/api/config', (req, res) => {
  res.json(currentData.config ?? {});
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
app.post('/api/upload', requireUploadAuth, (req, res) => {
  const { token, ...data } = req.body;  // Extract and discard token
  const v = validateTweetbankData(data);
  if (!v.ok) return res.status(400).json({ error: v.error });

  currentData = data;
  try {
    ensureDataDir();
    fs.writeFileSync(CURRENT_DATA_PATH, JSON.stringify(currentData, null, 2) + '\n', 'utf-8');
  } catch {
    // Best-effort persistence; keep in-memory data.
  }

  res.json({ ok: true, tweets: currentData.tweets.length });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\\n🐾 LD Tweetbank running at http://localhost:${PORT}\\n`);
});
