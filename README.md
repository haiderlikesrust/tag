# Hypertag

Hypertag is a Chrome extension that lets you **long or short Hyperliquid perps straight from your X timeline**, in a UI that looks and feels like x.com (Lights out, Dim and Default themes, plus your accent colour).

> Unofficial. Not affiliated with X Corp. or Hyperliquid. Trading perps with leverage can lose you money fast. Try it on **Testnet** first.

## What it does

- **Cashtag chips on posts**: every `$BTC`, `$ETH`, `$HYPE`… listed on Hyperliquid gets a live price, its 24h change and **Long / Short** buttons under the post text. `$PEPE`, `$BONK` and similar map to `kPEPE`, `kBONK`.
- **Trade sheet** (an X-style modal):
  - Market or Limit order, Long or Short
  - size in USD, with 10/25/50%/Max quick buttons
  - leverage slider, Cross or Isolated margin
  - optional Take profit / Stop loss
  - order value, margin and fee preview
  - your current position, with a two-step Close button
- **Sidebar card**: a "Hyperliquid" box in X's right column, styled like "What's happening". It shows account value, PnL, available margin and open positions with one-tap close.
- **Popup**: account overview, positions, default size, leverage and slippage, a Mainnet/Testnet switch, and toggles for the chips and the sidebar card.

## Install

```bash
npm install
```

```bash
npm run build
```

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick the `dist/` folder.
3. Open x.com.

Use `npm run watch` while developing. It rebuilds `src/` on change; re-run `npm run build` after editing `static/`. Then click reload on the extension card and refresh x.com.

## Connecting your account

You can connect in one of two ways. Either way, the extension only holds an **API (agent) wallet**. Hyperliquid lets agent wallets place and cancel orders, but **never withdraw or transfer funds**.

1. **Browser wallet (recommended).** Click **Connect** in the sidebar card or the popup. The extension creates a fresh agent key locally. Your wallet (MetaMask, Rabby, any EIP-6963 wallet) then signs one `ApproveAgent` message. No gas, no transaction. The agent is registered under the name `Hypertag`, so reconnecting replaces it.
2. **Import an API wallet.** Create one at [app.hyperliquid.xyz/API](https://app.hyperliquid.xyz/API) and paste its private key into the popup. The extension checks with Hyperliquid that the key really is an approved agent, and finds your account address. It refuses main-wallet keys.

Disconnecting deletes the key from the browser. You can also revoke it at app.hyperliquid.xyz/API.

## Security model

- **The agent key lives only in the service worker** (`chrome.storage.local`). All signing happens there. The x.com page and the content script never see it.
- **The private key can only be typed in the popup**, never on x.com, so page scripts can't read your keystrokes. Key import, settings changes and disconnect are refused if the request comes from x.com.
- **Wallet bridge.** `bridge.js` runs in the page's main world because that's the only place browser wallets are reachable. It only forwards `eth_requestAccounts`, `eth_chainId` and `eth_signTypedData_v4`. The account saved after connecting is the one recovered from the signature, not whatever the page reports.
- **Injected UI** uses closed shadow roots and never uses `innerHTML`. Order and close buttons ignore synthetic (`!isTrusted`) clicks.
- **The key is stored unencrypted**, so anyone with access to your Chrome profile can trade with it (but not withdraw). Disconnect on shared machines.

## How orders are sent

- **Market** orders are IOC limit orders at mid ± your slippage setting (default 3%). This is the same approach as the official SDK. **Limit** orders are GTC.
- **Leverage and margin mode**: if they differ from what's set on Hyperliquid for that coin, an `updateLeverage` is sent first.
- **TP/SL** are reduce-only trigger-market orders attached with `normalTpsl` grouping.
- **Rounding**: prices are rounded to 5 significant figures and sizes down to the coin's `szDecimals`. The minimum order is $10.

## Tests and verification

```bash
npm test
```

`test/vectors.json` was generated with the official `hyperliquid-python-sdk` (0.24.0). The tests check that our order wire format, msgpack action hash, L1 signatures (mainnet and testnet), `updateLeverage` and `approveAgent` EIP-712 signatures are **byte-identical** to the SDK. Signed throwaway-key orders were also sent to testnet. The exchange recovered the expected signer address, which confirms the payload format matches the live API.

**UI playground.** `dev/harness.html` and `dev/popup-harness.html` mock the `chrome.*` APIs (and a fake wallet) on X-shaped markup. Use them to preview the UI without loading the extension. Build first, then serve the repo root:

```bash
py -m http.server 5178
```

Then open `http://localhost:5178/dev/harness.html?theme=dark`. `theme` can be `light`, `dim` or `dark`; add `&connected=0` for the logged-out state.

## Landing page (hypertag.trade)

`site/` is a plain static page with no build step: `index.html`, `styles.css`, `main.js`, plus the images that `npm run icons` generates. To preview it locally:

```bash
py -m http.server 4973 --directory site
```

Then open `http://localhost:4973`.

- **Store link:** once the extension is on the Chrome Web Store, paste its URL into `CHROME_STORE_URL` at the top of `site/main.js`. Until then, the "Add to Chrome" buttons scroll to the last section, which says "Coming soon to the Chrome Web Store".
- **Share image:** save your artwork as `assets/og-source.png` (or `.jpg`/`.webp`) and run `npm run icons`. It becomes `site/assets/og.jpg`, the preview shown when someone shares hypertag.trade.

### Deploy on Dokploy

The site ships as a small nginx container that runs as a non-root user and listens on **port 4973**.

1. Push this repo to GitHub or GitLab, then create an **Application** in Dokploy from it.
2. Set the build path to `/site` and **Build Type** to Dockerfile (Dockerfile `Dockerfile`, context left empty). Add `site/**` as a watch path so only site changes redeploy.
3. Under **Domains**, add `hypertag.trade` with container port **4973**. Turn on HTTPS (Let's Encrypt).
4. Point the domain's DNS A record at your Dokploy server's IP, then click **Deploy**.

The container answers `/healthz` for health checks and sends a strict Content-Security-Policy and other security headers (see `site/nginx.conf`).

## Layout

```
src/lib/          shared: Hyperliquid signing + wire format, rounding, formatting, DOM helpers
src/background/   service worker: storage, API client, order logic, message router
src/content/      x.com UI: chips, trade sheet, sidebar card, connect dialog, wallet bridge
src/popup/        popup script
static/           manifest, popup HTML/CSS, icons
assets/           source logo and share image; `npm run icons` renders static/icons/ and the site images
site/             hypertag.trade landing page + its nginx Dockerfile
```

## Limitations

- Main Hyperliquid perps only: no spot and no HIP-3 builder-deployed markets.
- No UI for open (resting) orders yet. Manage those on Hyperliquid.
- X changes its markup from time to time. The extension relies on `article[data-testid="tweet"]`, `[data-testid="tweetText"]` and `[data-testid="sidebarColumn"]`.
