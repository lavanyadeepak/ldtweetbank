# 🐾 Tweetbank

A lightweight Node.js web app for animal welfare (and other) campaign groups to publish a curated set of tweets — so supporters can copy or post them to X in one click.

**Inspired by Kaddu & Brownie** — the community dogs of Delhi Airport who disappeared in early 2026. Kaddu was found after sustained court pressure and citizen searches. Brownie is still missing. [#BringBackBrownie](https://x.com/search?q=%23BringBackBrownie)

Live at → **[tweetbank.vercel.app](https://tweetbank.vercel.app)**

---

## Features

- Browse a tweetbank with **Copy** and **Post on X** (Twitter intent) buttons
- Filter tweets by **Hindi / English** and free-text search
- Fully **whitelabel** — all page text (title, hero, stats bar) driven by a `config` block in the JSON
- **Admin upload panel** (token-protected) to swap the active tweetbank without redeploying
- Uploaded data persists across restarts via `data/current.tweetbank.json`

---

## Project structure

```
server.js                          ← Express server
public/
  index.html                       ← Single-page UI
  template.tweetbank.json          ← Downloadable starter template
  assets/
    styles/styles.css
    scripts/scripts.js
data/
  current.tweetbank.json           ← Last uploaded tweetbank (auto-created)
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file (or set env vars directly):

```env
UPLOAD_TOKEN=a-long-random-secret-token
PORT=3000
```

`UPLOAD_TOKEN` protects the `/api/upload` endpoint. If not set, uploads are disabled (the Admin panel will show an error).

### 3. Run

```bash
node server.js
```

Open [http://localhost:3000](http://localhost:3000).

---

## Whitelabeling a campaign

1. Download the template from the UI (or from `/template.tweetbank.json`)
2. Fill in the `config` block and replace the `tweets` array
3. Log in to the Admin panel (top-right), enter your upload token, and upload the file

All page text updates instantly — no code changes, no redeployment.

### `config` fields

| Key | What it controls |
|---|---|
| `page_title` | Browser tab title |
| `site_title_prefix` | Header — plain text before the highlight |
| `site_title_highlight` | Header — highlighted word (amber colour) |
| `site_subtitle` | Header — small monospace subtitle |
| `stat_icon` | Stats bar — emoji/icon |
| `stat_text` | Stats bar — text next to the icon |
| `hero_tag` | Small uppercase tag above the heading |
| `hero_heading_prefix` | Heading — plain text |
| `hero_heading_highlight` | Heading — italic highlight (rust colour) |
| `hero_heading_suffix` | Heading — plain text after highlight |
| `hero_description` | Subheading paragraph |

### Tweet object

Each entry in `tweets` requires only one field:

```json
{ "text": "Your tweet text here.\n@Handle #Hashtag\nhttps://source.link" }
```

Tweets containing Devanagari characters are automatically tagged as Hindi and appear under the Hindi filter.

---

## API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/tweets` | — | Returns the current tweets array |
| GET | `/api/config` | — | Returns the current config object |
| POST | `/api/upload` | `UPLOAD_TOKEN` | Replaces the active tweetbank |

Upload request body:
```json
{
  "token": "your-upload-token",
  "config": { … },
  "tweets": [ … ]
}
```

---

## Deploying to Vercel

The app runs as a standard Node/Express server. Add a `vercel.json`:

```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

Set `UPLOAD_TOKEN` in your Vercel project's Environment Variables.

> **Note:** Vercel's filesystem is ephemeral — uploaded tweetbanks won't survive a cold restart. For durable persistence, replace the `fs.writeFileSync` in `server.js` with a KV store (e.g. Vercel KV, Redis, or a simple JSON bin).

---

## Built with love for animal welfare & responsible activism

*— [@lavanyadeepak](https://x.com/lavanyadeepak)*
