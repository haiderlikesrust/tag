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
