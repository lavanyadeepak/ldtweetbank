const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Load tweets ──────────────────────────────────────────────────────────────
const tweetbankData = JSON.parse(fs.readFileSync(path.join(__dirname, 'tweets.json'), 'utf-8'));
const config = tweetbankData?.config ?? {};
const tweets = Array.isArray(tweetbankData) ? tweetbankData : (tweetbankData?.tweets ?? []);

// ── API: get all tweets ──────────────────────────────────────────────────────
app.get('/api/tweets', (req, res) => {
  res.json(tweets);
});

// ── API: get config ─────────────────────────────────────────────────────────
app.get('/api/config', (req, res) => {
  res.json(config);
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🐾 LD Tweetbank running at http://localhost:${PORT}\n`);
});
