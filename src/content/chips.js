// Finds $CASHTAGS in timeline posts and adds a live price + Long / Short chip
// under the post text for every one that is listed on Hyperliquid.
import { change24h, fmtPct, fmtPx, fmtUsd, midOf, trend } from '../lib/format.js';
import { createHost, h } from './dom.js';
import {
  account, appState, marketFor, markets, positionFor, resolveSymbol,
} from './store.js';
import { openTrade } from './trade.js';

const CASHTAG_RE = /\$([A-Za-z][A-Za-z0-9]{0,9})(?![A-Za-z0-9])/g;
const MAX_PER_POST = 3;
const live = new Set(); // { host, update }

function tickersIn(article) {
  const coins = [];
  for (const el of article.querySelectorAll('[data-testid="tweetText"]')) {
    for (const [, sym] of el.textContent.matchAll(CASHTAG_RE)) {
      const m = resolveSymbol(sym);
      if (m && !coins.includes(m.name)) coins.push(m.name);
      if (coins.length >= MAX_PER_POST) return coins;
    }
  }
  return coins;
}

function buildChips(coins) {
  const { host, root } = createHost('chips');
  host.dataset.coins = coins.join(',');
  const row = h('div', { class: 'chips' });
  const updaters = coins.map((coin) => {
    const pxEl = h('span', { class: 'chip-px' });
    const chgEl = h('span', { class: 'chip-chg' });
    const posEl = h('span', { class: 'chip-pos', hidden: true });
    row.append(h('div', { class: 'chip' },
      h('button', { class: 'chip-coin', title: `Trade ${coin} on Hyperliquid`, onclick: () => openTrade({ coin, side: 'long' }) },
        h('span', { class: 'chip-sym' }, `$${coin}`), pxEl, chgEl, posEl),
      h('button', { class: 'pill pill-long', onclick: () => openTrade({ coin, side: 'long' }) }, 'Long'),
      h('button', { class: 'pill pill-short', onclick: () => openTrade({ coin, side: 'short' }) }, 'Short')));
    return () => {
      const m = marketFor(coin);
      pxEl.textContent = `$${fmtPx(midOf(m))}`;
      const chg = change24h(m);
      chgEl.textContent = fmtPct(chg);
      chgEl.className = `chip-chg ${trend(chg)}`;
      const p = positionFor(coin);
      posEl.hidden = !p;
      if (p) {
        posEl.className = `chip-pos ${p.szi > 0 ? 'long' : 'short'}`;
        posEl.textContent = `${p.szi > 0 ? 'Long' : 'Short'} ${fmtUsd(p.unrealizedPnl, { sign: true })}`;
      }
    };
  });
  root.append(row);
  const entry = { host, update: () => updaters.forEach((u) => u()) };
  entry.update();
  live.add(entry);
  return host;
}

function processArticle(article, enabled) {
  const textEl = article.querySelector('[data-testid="tweetText"]');
  const existing = article.querySelector('tt-root[data-kind="chips"]');
  if (!enabled || !textEl) {
    existing?.remove();
    return;
  }
  const coins = tickersIn(article);
  const key = coins.join(',');
  if (existing && existing.dataset.coins === key && existing.previousElementSibling === textEl) return;
  existing?.remove();
  if (coins.length) textEl.after(buildChips(coins));
}

function scan() {
  if (!markets.get().list.length) return;
  const enabled = appState.get()?.settings?.showChips !== false;
  for (const article of document.querySelectorAll('article[data-testid="tweet"]')) processArticle(article, enabled);
  for (const entry of live) if (!entry.host.isConnected) live.delete(entry);
}

let pending = false;
function scheduleScan() {
  if (pending) return;
  pending = true;
  setTimeout(() => {
    pending = false;
    scan();
  }, 120);
}

function updateAll() {
  for (const entry of live) {
    if (entry.host.isConnected) entry.update();
    else live.delete(entry);
  }
}

export function startChips() {
  new MutationObserver(scheduleScan).observe(document.body, { childList: true, subtree: true, characterData: true });
  let network = null;
  markets.sub((snap) => {
    // Market list changed (first load / network switch): rebuild everything.
    if (snap.network !== network) {
      network = snap.network;
      document.querySelectorAll('tt-root[data-kind="chips"]').forEach((el) => el.remove());
      live.clear();
      scan();
    } else {
      updateAll();
    }
  });
  account.sub(updateAll);
  appState.sub(scheduleScan);
  scheduleScan();
}
