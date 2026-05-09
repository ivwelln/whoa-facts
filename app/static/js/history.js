// Палитра — все цвета подобраны так, чтобы читаться на тёмном фоне.
const PALETTE = [
  '#7fb89a', // sage
  '#a8b8e8', // lavender
  '#e8a8a8', // rose
  '#e8c884', // amber
  '#84d4e8', // sky
  '#c8a8e8', // lilac
  '#a8e8b8', // mint
  '#e8b884', // peach
  '#e88498', // pink
  '#84e8c8', // teal
  '#b884e8', // purple
  '#e8d984', // lemon
];

function topicColor(name) {
  if (!name) return '#9aa0a6';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function formatRelativeDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);

  if (diff === 0) return 'Сегодня';
  if (diff === 1) return 'Вчера';
  if (diff < 7) return `${diff} дн. назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : '';
}

const els = {
  feed: document.getElementById('feed'),
  loadMore: document.getElementById('load-more'),
};

let cursor = null;
let loading = false;
let cardCounter = 0;

function renderSkeletons(n = 3) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    const card = document.createElement('article');
    card.className = `fact-card fact-card--skeleton ${i % 2 === 1 ? 'right' : ''}`;
    card.style.setProperty('--idx', i);
    card.innerHTML = `
      <div class="skeleton">
        <span class="skeleton-line" style="width: 35%"></span>
        <span class="skeleton-line"></span>
        <span class="skeleton-line"></span>
        <span class="skeleton-line short"></span>
      </div>
    `;
    frag.appendChild(card);
  }
  els.feed.appendChild(frag);
}

function clearSkeletons() {
  els.feed.querySelectorAll('.fact-card--skeleton').forEach((el) => el.remove());
}

function renderCard(fact) {
  const card = document.createElement('article');
  const isRight = cardCounter % 2 === 1;
  card.className = `fact-card ${isRight ? 'right' : ''}`;
  card.style.setProperty('--idx', cardCounter);
  card.style.setProperty('--topic-color', topicColor(fact.topic));

  const date = formatRelativeDate(fact.created_at);
  const source = capitalize(fact.source || '') || 'YandexGPT';
  const meta = [date, source].filter(Boolean).join(' — ');

  card.innerHTML = `
    <div class="fact-card-category">${escapeHtml(fact.topic || 'Факт')}</div>
    <div class="fact-card-divider" aria-hidden="true"></div>
    <p class="fact-card-text">${escapeHtml(fact.content || '')}</p>
    <div class="fact-card-meta">${escapeHtml(meta)}</div>
  `;

  els.feed.appendChild(card);
  cardCounter += 1;
}

function showEmpty(message) {
  els.feed.innerHTML = `<p class="empty">${escapeHtml(message)}</p>`;
}

async function loadMore() {
  if (loading) return;
  loading = true;
  els.loadMore.disabled = true;

  const url = new URL('/api/v1/facts/', location.origin);
  url.searchParams.set('limit', '10');
  if (cursor) url.searchParams.set('cursor', cursor);

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const facts = Array.isArray(data.facts) ? data.facts : [];
    cursor = data.next_cursor || null;

    facts.forEach(renderCard);

    if (cardCounter === 0) {
      showEmpty('Пока ничего нет. Загляни позже.');
    }

    els.loadMore.hidden = !cursor;
  } catch (err) {
    console.error(err);
    if (cardCounter === 0) {
      showEmpty('Не удалось загрузить историю. Попробуйте обновить страницу.');
    }
  } finally {
    loading = false;
    els.loadMore.disabled = false;
  }
}

async function init() {
  renderSkeletons(3);
  await loadMore();
  clearSkeletons();
}

els.loadMore.addEventListener('click', loadMore);

init();
