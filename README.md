# hypertag.trade

Landing page and privacy policy for **Hypertag**. The extension itself is open source at [hypertagcoin/hypertag](https://github.com/hypertagcoin/hypertag).

## Layout

```
site/index.html     landing page
site/privacy.html   privacy policy (served at /privacy)
site/styles.css     styles
site/main.js        install-button links, nav highlight, hero demo
site/assets/        logo and social share image
site/Dockerfile     nginx (non-root) serving the site on port 4973
site/nginx.conf     security headers, clean URLs, /healthz
```

## Preview locally

```bash
py -m http.server 4973 --directory site
```

Then open http://localhost:4973 (use http://localhost:4973/privacy.html locally; nginx serves it as /privacy in production).

## Deploy

Dokploy builds `site/Dockerfile` on every push to `main` that changes `site/**`, and serves it on hypertag.trade, container port 4973, with HTTPS from Let's Encrypt.

## To do

- **Chrome Web Store link:** once the listing is approved, paste its URL into `CHROME_STORE_URL` at the top of `site/main.js`. Until then, the "Add to Chrome" buttons open the install guide on GitHub.
- **Share image:** add your 1200×630 image as `site/assets/og.jpg`. The page's link-preview tags already point to it.

## AI service (`api/`)

`POST /api/why` explains a coin's recent move for the extension's optional "Why is it moving?" button. It's a small dependency-free Node server:

- **Market data:** fetched from Hyperliquid by the server itself (price changes, biggest hourly move, volume spike, open interest, funding, BTC comparison). It never trusts numbers sent by clients.
- **Posts:** the extension sends up to 8 public posts on screen that mention the coin. They're treated as untrusted: only real x.com post links are kept, and links and wallet or contract addresses are scrubbed from the text before it reaches the model.
- **Model:** called through OpenRouter. Output is plain text, scrubbed again, and sources map back only to the posts that were sent.
- **Cost controls:** answers are cached per coin for 5 minutes, there are per-IP limits (6/min, 80/day), a global daily cap on model calls, and only JSON requests are accepted, so random web pages can't spend credit.

### Deploy on Dokploy

Create a second application in the same project:

- **Build path:** `/api`, Dockerfile `Dockerfile`, watch path `api/**`
- **Domain:** `hypertag.trade`, path `/api` (leave Strip Path off), container port `4975`, HTTPS on
- **Environment:**
  - `OPENROUTER_API_KEY`: required; set it only in Dokploy, never commit it
  - `OPENROUTER_MODEL`: optional, defaults to `anthropic/claude-haiku-5.5`
  - `DAILY_MODEL_CALLS`, `PER_IP_PER_MIN`, `PER_IP_PER_DAY`: optional limits

Check it at https://hypertag.trade/api/health. `"configured": true` means the key is set.

### Run locally

```bash
cd api
```

```bash
MOCK_LLM=1 node server.mjs
```

`MOCK_LLM=1` uses real Hyperliquid data with a stand-in for the model, so no key is needed.
