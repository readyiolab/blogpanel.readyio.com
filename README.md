# Zuvigo blog admin panel (`blogpanel.zuvigo.com`)

React + Vite + TypeScript single-page app for writing and managing blog content. It talks only to the Zuvigo API (`https://api.zuvigo.com/api`). In production it is a static build served by Nginx; there is no Node process.

Production deployment: see [`../deploy/DEPLOYMENT.md`](../deploy/DEPLOYMENT.md).

## Features

- Sign in with the admin account created by `npm run migrate` in `../Backend`.
- **Articles**: create/edit with a rich-text editor (Jodit), featured image upload (DigitalOcean Spaces), tags, featured flag, meta title/description; approve/reject queue (`/articles/pending`) and "My articles".
- **Categories**, **comments** moderation, **newsletter** subscribers.
- **Users & roles** with permission-based access, **activity logs**, dashboard analytics.
- "View on blog" links open `https://blog.zuvigo.com/<slug>`.

Publishing or editing an article makes the API refresh `zuvigo.com/blog` and `blog.zuvigo.com` automatically.

## Local development

Start the API first (`cd ../Backend && npm run dev`, port 4000), then:

```bash
npm install
npm run dev               # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and build to `dist/` (uses `.env.production`) |
| `npm run preview` | Serve `dist/` locally |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript checks |

## Environment

| Variable | Dev (`.env`) | Prod (`.env.production`) |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:4000/api` | `https://api.zuvigo.com/api` |
| `VITE_BLOG_SITE_URL` | `http://localhost:8081` | `https://blog.zuvigo.com` |

Values are compiled into the bundle at build time. See [`.env.example`](.env.example).

## Hosting notes

- Uses `BrowserRouter`, so the web server must fall back to `index.html` for unknown paths (`deploy/nginx/blogpanel.zuvigo.com.conf` does this).
- The Nginx config sends `X-Robots-Tag: noindex, nofollow` so the panel never appears in search results.
