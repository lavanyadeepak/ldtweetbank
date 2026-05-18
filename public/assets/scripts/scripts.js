// ── State ────────────────────────────────────────────────────────────────────
let tweets = [];
let currentFilter = 'all';
let searchQuery = '';
let config = {};

// ── Boot ─────────────────────────────────────────────────────────────────────
(async () => {
  await loadData();
  render();
})();

async function loadData() {
  const [tweetsRes, configRes] = await Promise.all([
    fetch('/api/tweets'),
    fetch('/api/config'),
  ]);

  const rawTweets = await tweetsRes.json();
  config = await configRes.json();

  tweets = rawTweets.map((t, idx) => {
    const text = typeof t === 'string' ? t : (t?.text ?? '');
    return {
      id: idx + 1,
      text,
      intent_url: buildIntentUrl(text),
      source_url: extractSourceUrl(text),
    };
  });

  applyConfig(config);
  setCounts();
}

function buildIntentUrl(text) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text ?? '')}`;
}

function extractSourceUrl(text) {
  if (!text) return '';
  const matches = String(text).match(/https?:\/\/\S+/g);
  if (!matches || matches.length === 0) return '';
  const url = matches[matches.length - 1].replace(/[).,!?]+$/g, '');
  if (url.includes('…') || /truncated/i.test(url)) return '';
  return url;
}

function applyConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') return;

  if (cfg.page_title) {
    document.title = cfg.page_title;
    const el = document.getElementById('pageTitle');
    if (el) el.textContent = cfg.page_title;
  }

  if (cfg.site_title_prefix || cfg.site_title_highlight || cfg.site_subtitle) {
    const siteTitle = document.getElementById('siteTitle');
    const siteSubtitle = document.getElementById('siteSubtitle');
    if (siteTitle) {
      const prefix = cfg.site_title_prefix ?? '';
      const highlight = cfg.site_title_highlight ?? '';
      siteTitle.innerHTML = `${escapeHtml(prefix)} <span>${escapeHtml(highlight)}</span><br>`;
      if (siteSubtitle) siteTitle.appendChild(siteSubtitle);
    }
    if (siteSubtitle && cfg.site_subtitle) siteSubtitle.textContent = cfg.site_subtitle;
  }

  if (cfg.stat_icon) {
    const el = document.getElementById('statIcon');
    if (el) el.textContent = cfg.stat_icon;
  }
  if (cfg.stat_text) {
    const el = document.getElementById('statText');
    if (el) el.textContent = cfg.stat_text;
  }

  if (cfg.hero_tag) {
    const el = document.getElementById('heroTag');
    if (el) el.textContent = cfg.hero_tag;
  }

  if (cfg.hero_heading_prefix || cfg.hero_heading_highlight || cfg.hero_heading_suffix) {
    const el = document.getElementById('heroHeading');
    if (el) {
      const p = cfg.hero_heading_prefix ?? '';
      const h = cfg.hero_heading_highlight ?? '';
      const s = cfg.hero_heading_suffix ?? '';
      el.innerHTML = `${escapeHtml(p)} <em>${escapeHtml(h)}</em>${s ? ' ' + escapeHtml(s) : ''}`;
    }
  }

  if (cfg.hero_description) {
    const el = document.getElementById('heroDescription');
    if (el) el.textContent = cfg.hero_description;
  }
}

function setCounts() {
  const statTotal = document.getElementById('statTotal');
  if (statTotal) statTotal.textContent = tweets.length;
  const allBtn = document.getElementById('filterAllBtn');
  if (allBtn) allBtn.textContent = `All (${tweets.length})`;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Filtering ────────────────────────────────────────────────────────────────
function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

function onSearch(val) {
  searchQuery = val.toLowerCase();
  render();
}

function filteredTweets() {
  return tweets.filter(t => {
    const text = t.text.toLowerCase();
    const matchSearch = !searchQuery || text.includes(searchQuery);
    const isHindi = /[\u0900-\u097F]/.test(t.text);
    const matchFilter =
      currentFilter === 'all' ? true :
      currentFilter === 'hindi' ? isHindi :
      currentFilter === 'english' ? !isHindi : true;
    return matchSearch && matchFilter;
  });
}

// ── Render ───────────────────────────────────────────────────────────────────
function formatTweetHtml(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/(#\w+)/g, '<span class="hashtag">$1</span>')
    .replace(/(@\w+)/g, '<span class="handle">$1</span>')
    .replace(/(https?:\/\/\S+)/g, '<span class="url">$1</span>');
}

function charClass(n) {
  if (n > 280) return 'over';
  if (n > 240) return 'warn';
  return '';
}

function render() {
  const list = filteredTweets();
  const grid = document.getElementById('tweetGrid');
  document.getElementById('resultsCount').textContent =
    list.length < tweets.length ? `${list.length} of ${tweets.length}` : '';

  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-state"><div class="big">🐾</div><p>No tweets match your filter.</p></div>`;
    return;
  }

  grid.innerHTML = list.map((t, i) => {
    const chars = t.text.length;
    const isHindi = /[\u0900-\u097F]/.test(t.text);
    return `
    <div class="tweet-card" id="card-${t.id}" style="animation-delay:${i * 0.03}s">
      <div class="card-header">
        <span class="tweet-num">Tweet <span>#${t.id}</span> ${isHindi ? '🇮🇳' : '🇬🇧'}</span>
      </div>
      <div class="card-body">
        <div class="tweet-text">${formatTweetHtml(t.text)}</div>
        ${t.source_url ? `<a class="source-link" href="${t.source_url}" target="_blank" rel="noopener">🔗 ${t.source_url.replace(/https?:\/\//,'')}</a>` : ''}
        <div class="char-count ${charClass(chars)}">${chars}/280</div>
      </div>
      <div class="card-footer">
        <button class="btn btn-copy" onclick="copyTweet(${t.id})" id="copy-${t.id}" style="flex:1;justify-content:center;">📋 Copy Tweet</button>
        <a class="btn btn-post" href="${t.intent_url}" target="_blank" rel="noopener" style="flex:1;justify-content:center;">↗ Post on X</a>
      </div>
    </div>`;
  }).join('');
}

// ── Actions ───────────────────────────────────────────────────────────────────
async function copyTweet(id) {
  const tweet = tweets.find(t => t.id === id);
  if (!tweet) return;
  await navigator.clipboard.writeText(tweet.text);
  const btn = document.getElementById('copy-' + id);
  btn.textContent = '✓ Copied!';
  btn.classList.add('copied');
  setTimeout(() => { btn.textContent = '📋 Copy Tweet'; btn.classList.remove('copied'); }, 2000);
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}
