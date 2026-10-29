// hypertag.trade — CTA wiring, nav state, scroll reveals and the hero demo loop.

// Paste the Chrome Web Store listing URL here once the extension is approved.
// Until then, "Add to Chrome" buttons scroll to the manual install steps.
const CHROME_STORE_URL = '';

document.documentElement.classList.add('js');

const alertBar = document.querySelector('[data-alert]');
if (alertBar) {
  const syncAlert = () => document.documentElement.style.setProperty('--alert-h', `${alertBar.offsetHeight}px`);
  syncAlert();
  addEventListener('resize', syncAlert);
}

const ctas = document.querySelectorAll('[data-cta]');
if (CHROME_STORE_URL) {
  for (const a of [...ctas, ...document.querySelectorAll('[data-download]')]) {
    a.href = CHROME_STORE_URL;
    a.target = '_blank';
    a.rel = 'noopener';
  }
  const label = document.querySelector('[data-download] span');
  if (label) label.textContent = 'Add to Chrome';
  document.querySelectorAll('[data-manual]').forEach((el) => (el.hidden = true));
}

for (const btn of document.querySelectorAll('[data-copy]')) {
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = 'Copied';
    } catch {
      btn.textContent = 'Select & copy';
    }
    setTimeout(() => (btn.textContent = 'Copy'), 1600);
  });
}

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

// Nav gets a hairline once the page scrolls.
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Liquid highlight: follows the hovered link, otherwise the section in view.
const links = [...document.querySelectorAll('.nav-links a')];
const blob = document.querySelector('.nav-blob');
let activeLink = null;
function moveBlob(a) {
  if (!a) {
    blob.classList.remove('on');
    return;
  }
  blob.style.left = `${a.offsetLeft}px`;
  blob.style.width = `${a.offsetWidth}px`;
  blob.classList.add('on');
}
function setActive(a) {
  activeLink = a;
  links.forEach((l) => l.classList.toggle('active', l === a));
  moveBlob(a);
}
for (const a of links) {
  a.addEventListener('mouseenter', () => moveBlob(a));
  a.addEventListener('focus', () => moveBlob(a));
  a.addEventListener('click', () => setActive(a));
}
document.querySelector('.nav-links').addEventListener('mouseleave', () => moveBlob(activeLink));
if ('IntersectionObserver' in window) {
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) setActive(byId.get(e.target.id) || null);
  }, { rootMargin: '-45% 0px -50% 0px' });
  for (const id of [...byId.keys(), 'top']) {
    const el = document.getElementById(id);
    if (el) spy.observe(el);
  }
}

// Fade sections in as they enter the viewport.
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('in'));
}

// ---- Hero demo: price ticks, tap Long, sheet opens, order fills, toast. ----
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pxEls = document.querySelectorAll('[data-px]');
const posEl = document.querySelector('[data-pos]');
const longPill = document.querySelector('[data-long]');
const sheet = document.getElementById('demo-sheet');
const submit = document.querySelector('[data-submit]');
const toast = document.getElementById('demo-toast');

const SIZE = 5.34;
let price = 46.81;
let entry = null;

const usd = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function render() {
  for (const el of pxEls) el.textContent = usd(price);
  if (entry != null) {
    const pnl = (price - entry) * SIZE;
    posEl.textContent = `Long ${pnl >= 0 ? '+' : '-'}${usd(Math.abs(pnl))}`;
  }
}

if (!sheet) {
  // Not the home page (e.g. /privacy): no demo to run.
} else if (reduceMotion) {
  sheet.classList.add('open');
} else {
  setInterval(() => {
    // Drift upward, more so while the demo position is open, so it shows a profit.
    const bias = entry != null ? 0.25 : 0.45;
    price = Math.max(40, price * (1 + (Math.random() - bias) * 0.0016));
    render();
  }, 1100);

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  (async function loop() {
    for (;;) {
      await wait(1500);
      longPill.classList.add('press');
      await wait(220);
      longPill.classList.remove('press');
      sheet.classList.add('open');
      await wait(1700);
      submit.classList.add('press');
      await wait(160);
      submit.classList.remove('press');
      submit.classList.add('busy');
      await wait(900);
      submit.classList.remove('busy');
      sheet.classList.remove('open');
      entry = price * 0.9995; // fill a touch below the next tick, as a market buy would look
      toast.textContent = `Bought ${SIZE} HYPE at ${usd(entry)}`;
      toast.classList.add('show');
      posEl.hidden = false;
      render();
      await wait(2600);
      toast.classList.remove('show');
      await wait(4200);
      posEl.hidden = true;
      entry = null;
    }
  })();
}
