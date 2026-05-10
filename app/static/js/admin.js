const SOURCE_FALLBACK = 'YandexGPT';
const TOKEN_KEY = 'whoa-admin-token';

const els = {
  // auth
  authLoading: document.getElementById('auth-loading'),
  authScreen:  document.getElementById('auth-screen'),
  authForm:    document.getElementById('auth-form'),
  authInput:   document.getElementById('auth-input'),
  authSubmit:  document.getElementById('auth-submit'),
  authError:   document.getElementById('auth-error'),
  panel:       document.getElementById('admin-panel'),
  logoutBtn:   document.getElementById('logout-btn'),
  // panel
  search:      document.getElementById('search'),
  topicFilter: document.getElementById('topic-filter'),
  list:        document.getElementById('list'),
  counter:     document.getElementById('counter'),
  detail:      document.getElementById('detail'),
  generateBtn: document.getElementById('generate-btn'),
};

const NO_TOPIC = '—';

let allFacts = [];
let selectedId = null;

// ===== Helpers =====

function formatRelativeDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
  if (diff === 0) return 'Сегодня';
  if (diff === 1) return 'Вчера';
  if (diff < 7)  return `${diff} дн. назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatFullDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function truncate(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function shortSource(s) {
  if (!s) return SOURCE_FALLBACK;
  const lower = s.toLowerCase();
  if (lower.includes('yandex')) return 'YandexGPT';
  if (lower.includes('gemini')) return 'Gemini';
  if (lower.includes('claude')) return 'Claude';
  // gpt://folder/yandexgpt-lite/latest → yandexgpt-lite
  const segs = s.split('/').filter(Boolean);
  if (segs.length >= 2) return segs[segs.length - 2];
  return truncate(s, 32);
}

// ===== UI helpers =====

function notImplemented(action, fact) {
  console.warn(`[admin] action="${action}" — ещё не подключено`, fact);
  flash(`«${action}» появится позже`);
}

function flash(message) {
  const existing = document.querySelector('.admin-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'admin-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-shown'));
  setTimeout(() => {
    toast.classList.remove('is-shown');
    setTimeout(() => toast.remove(), 300);
  }, 1800);
}

// ===== Rendering =====

function renderList(facts) {
  els.list.innerHTML = '';

  if (facts.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'admin-empty admin-empty--inline';
    empty.textContent = 'Ничего не найдено';
    els.list.appendChild(empty);
    return;
  }

  const frag = document.createDocumentFragment();
  facts.forEach((f, i) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'admin-list-item';
    item.style.setProperty('--idx', i);
    item.dataset.factId = String(f.id);
    item.setAttribute('role', 'option');
    if (f.id === selectedId) {
      item.classList.add('is-selected');
      item.setAttribute('aria-selected', 'true');
    }

    item.innerHTML = `
      <div class="admin-list-row-top">
        <span class="admin-list-id">#${escapeHtml(f.id)}</span>
        <span class="admin-list-topic">${escapeHtml(f.topic || '—')}</span>
      </div>
      <p class="admin-list-preview">${escapeHtml(truncate(f.content, 80))}</p>
    `;

    item.addEventListener('click', () => selectFact(f.id));
    frag.appendChild(item);
  });
  els.list.appendChild(frag);
}

function renderDetail(fact) {
  els.detail.classList.remove('fade-in');
  void els.detail.offsetWidth;

  if (!fact) {
    els.detail.innerHTML = '<div class="admin-empty">Выбери факт слева</div>';
    els.detail.classList.add('fade-in');
    return;
  }

  const date = formatRelativeDate(fact.created_at);
  const source = shortSource(fact.source);
  const sourceFull = fact.source || SOURCE_FALLBACK;

  const stats = [
    { key: 'ID',       value: `#${fact.id}` },
    { key: 'Источник', value: source, full: sourceFull },
    { key: 'Создано',  value: formatFullDate(fact.created_at) },
    // future: токены, finish_reason, latency, просмотры — просто добавь сюда
  ];

  const statsHtml = stats.map((s) => `
    <div class="admin-stat">
      <div class="admin-stat-key">${escapeHtml(s.key)}</div>
      <div class="admin-stat-value"${s.full ? ` title="${escapeHtml(s.full)}"` : ''}>${escapeHtml(s.value || '—')}</div>
    </div>
  `).join('');

  els.detail.innerHTML = `
    <div class="admin-detail-header">
      <span class="admin-detail-topic">${escapeHtml(fact.topic || 'Факт')}</span>
      <span class="admin-detail-date">${escapeHtml(date)}</span>
    </div>
    <div class="admin-detail-divider" aria-hidden="true"></div>
    <p class="admin-detail-text">${escapeHtml(fact.content || '')}</p>
    <div class="admin-detail-stats">${statsHtml}</div>
    <div class="admin-detail-actions">
      <button class="admin-btn admin-btn--danger" id="delete-btn" type="button">Удалить</button>
      <button class="admin-btn admin-btn--primary" id="activate-btn" type="button">Выбрать активным</button>
    </div>
  `;
  els.detail.classList.add('fade-in');

  document.getElementById('delete-btn').addEventListener('click', () => deleteFact(fact));
  document.getElementById('activate-btn').addEventListener('click', () => notImplemented('сделать активным', fact));
}

function renderEmptyDb() {
  els.list.innerHTML = `
    <div class="admin-empty admin-empty--inline admin-empty--full">
      <div class="admin-empty-icon" aria-hidden="true">∅</div>
      <p class="admin-empty-title">Пока ничего нет</p>
      <p class="admin-empty-hint">Сгенерируй первый факт — он появится здесь.</p>
    </div>
  `;
  els.detail.classList.remove('fade-in');
  void els.detail.offsetWidth;
  els.detail.innerHTML = `
    <div class="admin-empty admin-empty--full">
      <div class="admin-empty-icon" aria-hidden="true">✦</div>
      <p class="admin-empty-title">База пуста</p>
      <p class="admin-empty-hint">Нажми «Сгенерировать новый» слева — и сюда прилетит первый факт.</p>
    </div>
  `;
  els.detail.classList.add('fade-in');
  els.counter.textContent = 'Всего: 0';
}

function selectFact(id) {
  selectedId = id;
  els.list.querySelectorAll('.admin-list-item').forEach((item) => {
    const isSel = Number(item.dataset.factId) === id;
    item.classList.toggle('is-selected', isSel);
    item.setAttribute('aria-selected', String(isSel));
  });
  const fact = allFacts.find((f) => f.id === id);
  renderDetail(fact || null);
}

function buildTopicOptions() {
  const counts = new Map();
  for (const f of allFacts) {
    const t = f.topic || NO_TOPIC;
    counts.set(t, (counts.get(t) || 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ru'));

  const previous = els.topicFilter.value;
  const optionsHtml = ['<option value="">Все темы</option>']
    .concat(sorted.map(([name, n]) =>
      `<option value="${escapeHtml(name)}">${escapeHtml(name)} (${n})</option>`
    ))
    .join('');
  els.topicFilter.innerHTML = optionsHtml;

  // сохранить выбор пользователя, если такая тема ещё существует
  if (previous && sorted.some(([name]) => name === previous)) {
    els.topicFilter.value = previous;
  } else {
    els.topicFilter.value = '';
  }
  els.topicFilter.classList.toggle('is-active', els.topicFilter.value !== '');
}

function applyFilter() {
  const q = els.search.value.trim().toLowerCase();
  const topic = els.topicFilter.value;

  els.topicFilter.classList.toggle('is-active', topic !== '');

  let filtered = allFacts;
  if (topic) {
    filtered = filtered.filter((f) => (f.topic || NO_TOPIC) === topic);
  }
  if (q) {
    filtered = filtered.filter((f) => {
      const t = (f.topic || '').toLowerCase();
      const c = (f.content || '').toLowerCase();
      return t.includes(q) || c.includes(q);
    });
  }

  renderList(filtered);

  if (q || topic) {
    els.counter.textContent = `Найдено: ${filtered.length} из ${allFacts.length}`;
  } else {
    els.counter.textContent = `Всего: ${allFacts.length}`;
  }
}

// ===== Actions =====

async function deleteFact(fact) {
  const preview = (fact.content || '').slice(0, 60);
  if (!confirm(`Удалить факт #${fact.id}?\n\n${preview}${fact.content && fact.content.length > 60 ? '…' : ''}`)) {
    return;
  }

  try {
    const r = await authFetch(`/api/v1/fact/${fact.id}`, { method: 'DELETE' });
    if (r.status === 204) {
      allFacts = allFacts.filter((f) => f.id !== fact.id);
      buildTopicOptions();

      if (allFacts.length === 0) {
        renderEmptyDb();
      } else {
        applyFilter();
        selectFact(allFacts[0].id);
      }
      flash('Факт удалён');
    } else if (r.status === 404) {
      flash('Факт не найден');
    } else {
      flash(`Ошибка ${r.status}`);
    }
  } catch (e) {
    if (e.message !== 'Unauthorized') {
      console.error(e);
      flash('Не удалось удалить');
    }
  }
}

async function generateNewFact() {
  const original = els.generateBtn.textContent;
  els.generateBtn.disabled = true;
  els.generateBtn.textContent = 'Генерация…';

  try {
    const r1 = await authFetch('/api/v1/fact/new', { method: 'POST' });
    if (!r1.ok) {
      flash(`Ошибка генерации: ${r1.status}`);
      return;
    }

    // одновременно — обновить кэш на главной (самый свежий = только что созданный)
    await authFetch('/api/v1/fact/update-fact', { method: 'POST' }).catch((e) => {
      console.warn('update-fact failed:', e);
    });

    // перезагрузить список фактов с сервера, чтобы получить новую запись с id
    allFacts = await fetchAllFacts();
    buildTopicOptions();
    applyFilter();
    if (allFacts.length) selectFact(allFacts[0].id);

    flash('Новый факт сгенерирован');
  } catch (e) {
    if (e.message !== 'Unauthorized') {
      console.error(e);
      flash('Не удалось сгенерировать');
    }
  } finally {
    els.generateBtn.disabled = false;
    els.generateBtn.textContent = original;
  }
}

// ===== Loading =====

function showListSkeleton() {
  els.list.innerHTML = `
    <div class="admin-list-item is-skeleton" style="--idx: 0">
      <span class="skeleton-line" style="width: 80%"></span>
    </div>
    <div class="admin-list-item is-skeleton" style="--idx: 1">
      <span class="skeleton-line" style="width: 65%"></span>
    </div>
    <div class="admin-list-item is-skeleton" style="--idx: 2">
      <span class="skeleton-line" style="width: 70%"></span>
    </div>
  `;
}

async function fetchAllFacts() {
  let cursor = null;
  const all = [];
  for (let i = 0; i < 10; i++) {  // защита от бесконечного цикла
    const url = new URL('/api/v1/facts/', location.origin);
    url.searchParams.set('limit', '100');
    if (cursor) url.searchParams.set('cursor', cursor);
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    all.push(...(data.facts || []));
    if (!data.next_cursor) break;
    cursor = data.next_cursor;
  }
  return all;
}

async function init() {
  showListSkeleton();
  try {
    allFacts = await fetchAllFacts();
    if (allFacts.length === 0) {
      renderEmptyDb();
      return;
    }
    buildTopicOptions();
    renderList(allFacts);
    els.counter.textContent = `Всего: ${allFacts.length}`;
    selectFact(allFacts[0].id);  // самый свежий — он первый, т.к. сортировка desc
  } catch (err) {
    console.error(err);
    els.list.innerHTML = '<div class="admin-empty admin-empty--inline">Не удалось загрузить факты</div>';
    els.counter.textContent = 'Всего: —';
  }
}

// ===== Auth =====

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function verifyToken(token) {
  if (!token) return false;
  try {
    const r = await fetch('/api/v1/auth/verify', {
      headers: { 'X-Admin-Token': token, Accept: 'application/json' },
    });
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * Обёртка над fetch для админских запросов: подкладывает X-Admin-Token,
 * при 401 чистит токен и кидает на экран логина.
 */
async function authFetch(url, opts = {}) {
  const headers = { ...(opts.headers || {}), 'X-Admin-Token': getToken() };
  const r = await fetch(url, { ...opts, headers });
  if (r.status === 401) {
    clearToken();
    showAuth('Сессия истекла. Войди снова.');
    throw new Error('Unauthorized');
  }
  return r;
}

function showAuth(message = '') {
  els.authLoading.hidden = true;
  els.panel.hidden = true;
  els.authScreen.hidden = false;
  els.authError.hidden = !message;
  els.authError.textContent = message;
  setTimeout(() => els.authInput.focus(), 50);
}

function showPanel() {
  els.authLoading.hidden = true;
  els.authScreen.hidden = true;
  els.panel.hidden = false;
}

async function handleLogin(e) {
  e.preventDefault();
  const token = els.authInput.value.trim();
  if (!token) return;

  els.authSubmit.disabled = true;
  els.authError.hidden = true;

  if (await verifyToken(token)) {
    setToken(token);
    showPanel();
    init();
  } else {
    els.authError.textContent = 'Неверный токен';
    els.authError.hidden = false;
    els.authInput.select();
  }
  els.authSubmit.disabled = false;
}

function logout() {
  clearToken();
  els.authInput.value = '';
  showAuth();
}

// ===== Bootstrap =====

els.authForm.addEventListener('submit', handleLogin);
els.logoutBtn.addEventListener('click', logout);
els.search.addEventListener('input', debounce(applyFilter, 200));
els.topicFilter.addEventListener('change', applyFilter);
els.generateBtn.addEventListener('click', generateNewFact);

(async function bootstrap() {
  if (await verifyToken(getToken())) {
    showPanel();
    init();
  } else {
    if (getToken()) clearToken();  // токен был, но протух — стираем
    showAuth();
  }
})();
