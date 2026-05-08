const SOURCE_TEXT = "Сгенерировано нейросетью — YandexGPT. Могут быть ошибки.";

const els = {
  category: document.getElementById('category'),
  factText: document.getElementById('fact-text'),
  source:   document.getElementById('source'),
  moreBtn:  document.getElementById('more-btn'),
};

const SKELETON_HTML = `
  <div class="skeleton" aria-hidden="true">
    <span class="skeleton-line"></span>
    <span class="skeleton-line"></span>
    <span class="skeleton-line short"></span>
  </div>
`;

async function fetchFact() {
  const res = await fetch('/api/v1/fact/', { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function showSkeleton() {
  els.category.innerHTML = '&nbsp;';
  els.factText.classList.remove('fade-in');
  els.factText.innerHTML = SKELETON_HTML;
  els.source.textContent = '';
}

function showError(message) {
  els.category.textContent = '';
  els.factText.classList.remove('fade-in');
  void els.factText.offsetWidth;
  els.factText.textContent = message;
  els.factText.classList.add('fade-in');
  els.source.textContent = '';
}

function render(fact) {
  els.category.textContent = fact.topic || 'Факт';
  els.factText.classList.remove('fade-in');
  void els.factText.offsetWidth;
  els.factText.textContent = fact.content;
  els.factText.classList.add('fade-in');
  els.source.textContent = SOURCE_TEXT;
}

async function load() {
  showSkeleton();
  try {
    const fact = await fetchFact();
    if (!fact?.content) {
      showError('Факт пока не готов. Зайдите позже.');
      return;
    }
    render(fact);
  } catch (e) {
    showError('Не удалось загрузить факт. Попробуйте обновить страницу.');
  }
}

els.moreBtn.addEventListener('click', async () => {
  els.moreBtn.disabled = true;
  await load();
  els.moreBtn.disabled = false;
});

load();
