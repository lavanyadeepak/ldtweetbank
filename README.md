# 🐾 #BringBackBrownie Tweetbank

A small Node.js web app to browse a campaign “tweetbank”, copy tweets, or open X’s tweet composer.

## Features
- Filter by language (Hindi / English) and search
- One-click **Copy** and **Post on X**
- Whitelabel-able page text via `config`
- Admin upload (token-protected) to replace the tweetbank JSON

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure upload auth (recommended)
Set an upload token (used by the Admin upload panel):
```bash
$env:UPLOAD_TOKEN="a-long-random-token"
```

### 3. Run the app
```bash
node server.js
```

Open http://localhost:3000 in your browser.

---

## How it works

- `public/template.tweetbank.json` — download this from the UI and fill it in
- `POST /api/upload` — replaces the current tweetbank (requires `UPLOAD_TOKEN`)
- `data/current.tweetbank.json` — last uploaded data (saved so it survives restarts)
- `GET /api/config` and `GET /api/tweets` — used by the frontend
