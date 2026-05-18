# 🐾 #BringBackBrownie Tweetbank

A Node.js web app to browse and post the #BringBackBrownie tweet bank directly via Twitter/X OAuth 2.0.

## Features
- 36 pre-loaded tweets (Hindi + English) from the campaign PDF
- One-click **Copy** or **Post directly** to X
- Twitter/X OAuth 2.0 PKCE login (no password stored)
- Filter by language (Hindi / English) or search
- Tracks which tweets you've already posted (localStorage)

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create your Twitter Developer App

1. Go to https://developer.x.com/en/portal/dashboard
2. Create a new App (or use an existing one)
3. Under **App Settings → User authentication settings**:
   - Enable **OAuth 2.0**
   - Type: **Web App, Automated App or Bot**
   - Callback URI: `http://localhost:3000/api/auth/callback`
   - Website URL: `http://localhost:3000`
4. Set **Permissions** to: `Read and Write`
5. Copy your **Client ID** and **Client Secret**

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```
TWITTER_CLIENT_ID=your_client_id_here
TWITTER_CLIENT_SECRET=your_client_secret_here
SESSION_SECRET=any_random_string
PORT=3000
BASE_URL=http://localhost:3000
```

### 4. Run the app
```bash
node server.js
```

Open http://localhost:3000 in your browser.

---

## Deploying to Production

Update `.env`:
```
BASE_URL=https://yourdomain.com
```

And add `https://yourdomain.com/api/auth/callback` to your Twitter App's callback URIs.

For production, replace the in-memory session store in `server.js` with Redis + `express-session`.

---

## How it works

- `tweets.json` — all 36 tweets extracted from the PDF (decoded from Twitter intent URLs)
- `server.js` — Express server with OAuth 2.0 PKCE flow + Twitter API v2 tweet posting
- `public/index.html` — Single-page frontend, no framework dependencies

## Adding more tweets
Simply edit `tweets.json` and add entries following the same structure:
```json
{
  "id": 37,
  "text": "Your tweet text here\n@Handle\n#Hashtag\nhttps://source.link",
  "intent_url": "https://twitter.com/intent/tweet?text=...",
  "source_url": "https://source.link"
}
```
