const filterButtons = [...document.querySelectorAll('.filter-btn')];
const grid = document.querySelector('#portfolio-grid');
const loadMore = document.querySelector('#load-more');
let activeFilter = 'all';
let visible = 8;
let activeCollection = 'ready';
const clientParam = new URLSearchParams(window.location.search).get('client') || '';
let activeClient = clientParam;
const collectionButtons = [...document.querySelectorAll('[data-collection]')];

const categoryLabel = (category) => ({automotive:'АВТОМОБИЛЬНЫЕ СОБЫТИЯ',corporate:'КОРПОРАТИВНЫЕ ПРОЕКТЫ',forums:'ФОРУМЫ И КОНФЕРЕНЦИИ',special:'СПЕЦИАЛЬНЫЕ ПРОЕКТЫ'}[category] || category);

function renderCases() {
  if (!grid || !window.SPACE_CASES) return;
  const cases = window.SPACE_CASES
    .filter(item => activeCollection === 'archive' ? !item.localUrl : Boolean(item.localUrl))
    .filter(item => activeFilter === 'all' || item.category === activeFilter)
    .filter(item => !activeClient || String(item.brand || '').toLowerCase().includes(activeClient.toLowerCase()))
    .sort((a,b) => (b.featured || 0) - (a.featured || 0) || a.priority - b.priority);
  const shown = cases.slice(0, visible);

  grid.innerHTML = shown.map((item) => {
    const href = item.localUrl || `https://spaceevent.ru/portfolio/${item.slug}/`;
    const target = item.localUrl ? '' : 'target="_blank" rel="noopener"';
    const hasImage = Boolean(item.image);
    const mediaClass = `portfolio-card-media${hasImage ? '' : ` portfolio-card-media--fallback portfolio-card-media--${item.category}`}`;
    const mediaStyle = hasImage ? `style="background-image:url('${item.image}')"` : '';
    const yearMatch = String(item.subtitle || '').match(/\b(20\d{2})\b/);
    const year = yearMatch ? yearMatch[1] : '';
    const metaBits = [categoryLabel(item.category), year].filter(Boolean).join(' · ');
    const info = item.subtitle || '';

    return `
    <a class="portfolio-card portfolio-card-v90" href="${href}" ${target} aria-label="${item.brand}: ${item.title}">
      <div class="${mediaClass}" ${mediaStyle}>
        <span class="portfolio-card-index">${String(item.priority).padStart(2,'0')}</span>
        <div class="portfolio-card-client">${item.brand}</div>

        <div class="portfolio-card-hover">
          <div class="portfolio-card-hover-meta">${metaBits}</div>
          <h3>${item.title}</h3>
          ${info ? `<p>${info}</p>` : ''}
          <span class="portfolio-card-cta">Смотреть кейс ↗</span>
        </div>
      </div>
    </a>`;
  }).join('');
  if (loadMore) {
    loadMore.hidden = shown.length >= cases.length;
    loadMore.textContent = 'Показать ещё (' + (cases.length - shown.length) + ') ↓';
  }
  const status = document.querySelector('#portfolio-status');
  if (status) status.textContent = cases.length ? 'Показано ' + shown.length + ' из ' + cases.length : 'В этой категории пока нет проектов';
}

collectionButtons.forEach(btn => btn.addEventListener('click', () => {
  activeCollection = btn.dataset.collection;
  collectionButtons.forEach(b => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
  visible = 8;
  renderCases();
}));

filterButtons.forEach(btn => btn.addEventListener('click', () => {
  filterButtons.forEach(b => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  filterButtons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  activeFilter = btn.dataset.filter;
  visible = 8;
  renderCases();
}));

loadMore?.addEventListener('click', () => { visible += 8; renderCases(); });
renderCases();

if (activeClient) {
  const status = document.querySelector('#portfolio-status');
  if (status) status.textContent = 'Клиент: ' + activeClient;
}

const serviceRows = [...document.querySelectorAll('.service-row-v59')];
const serviceVisuals = [...document.querySelectorAll('.service-photo-v59')];

function activateService(name) {
  serviceRows.forEach(row => row.classList.toggle('is-active', row.dataset.service === name));
  serviceVisuals.forEach(visual => visual.classList.toggle('is-active', visual.dataset.visual === name));
}

serviceRows.forEach(row => {
  const activate = () => activateService(row.dataset.service);
  row.addEventListener('mouseenter', activate);
  row.addEventListener('focus', activate);
  row.addEventListener('click', activate);
});

const contactForm = document.querySelector('#contact-form');

contactForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (contactForm.dataset.sending === 'true') return;

  const submitButton = contactForm.querySelector('button[type="submit"]');
  const successMessage = contactForm.querySelector('.form-success');
  const errorMessage = contactForm.querySelector('.form-error');
  const formData = new FormData(contactForm);
  const payload = Object.fromEntries(formData.entries());

  successMessage.hidden = true;
  errorMessage.hidden = true;

  if (!contactForm.checkValidity()) {
    contactForm.reportValidity();
    return;
  }

  contactForm.dataset.sending = 'true';
  submitButton.disabled = true;
  submitButton.dataset.label = submitButton.textContent;
  submitButton.textContent = 'Отправляем…';

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(22000),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok || !(result.channels?.telegram || result.channels?.email)) {
      console.error('SPACE contact form delivery failed', result);
      throw new Error(result.error || 'Request failed');
    }

    contactForm.reset();
    successMessage.hidden = false;
  } catch (error) {
    console.error('SPACE contact form error', error);
    errorMessage.hidden = false;
  } finally {
    contactForm.dataset.sending = 'false';
    submitButton.disabled = false;
    submitButton.textContent = submitButton.dataset.label || 'Отправить заявку';
  }
});
