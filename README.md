# ORIGEN

A developer-only payment test-data and BIN metadata utility. Built with TypeScript, Vite, native DOM components, and local Lucide icons.

Community & updates: [Join Channel on Telegram](https://t.me/+y8EekRvqpnQzNjZl)

## Workspace Tabs

1. **Generator**: 100% local synthetic card fixture generator.
   - Accepts optional 6–8 digit BIN/IIN prefix (exact input preserved).
   - Network selection: Auto (detects prefix), Visa, Mastercard, Amex, Discover, or Random.
   - Quantity 1–100 records with quick presets.
   - Expiration controls: Random future, specific month, specific year, or fixed date.
   - Network-appropriate synthetic CVV formatting (3 digits for most, 4 digits for Amex).
   - Local Luhn checksum generation.
   - Clear banner: `TEST DATA ONLY — NOT REAL PAYMENT CARDS`.
   - Results table with individual record copy, Copy All, and TXT / CSV / JSON export downloads.
   - Code and table views, clear function, and performance timing.

2. **BIN Lookup**: Dedicated prefix metadata lookup tab using `https://guison-api.onrender.com`.
   - Strictly accepts **6–8 digit BIN/IIN prefixes only**. Full card numbers, CVVs, and expiry dates are rejected locally and never sent.
   - Displays all available issuing metadata: BIN, Scheme/Network, Brand, Card Type, Product/Level, Issuer, Country + Flag, Currency, Number Length, Luhn compatibility, Prepaid status, and formatted raw JSON.
   - Actions: Lookup, Clear, Copy Metadata, Copy JSON.
   - Session-only recent lookups (capped at 10, stored in page memory, offline reviewable, cleared on reload).
   - Resilient design: if Guison is down or unreachable, the local generator continues to function completely independently.

3. **Card Sorter**: a local organizer for test data you already have.
   - Large paste area (`Paste one card record per line`) plus drag & drop or file-picker loading of plain-text files (read locally with the File API, never uploaded).
   - Accepts common developer/test shapes: `number|MM|YYYY|CVV`, `number|MM/YY|CVV`, `number,MM,YYYY,CVV`, `number:MM:YYYY:CVV`, tab/semicolon or double-space variants, and a bare number per line.
   - Unrecognized lines are **preserved**, never silently deleted. Only the explicit `Remove invalid/empty lines` action drops them, and it reports how many went.
   - One-click cleaning actions: Remove duplicates, Remove empty lines, Trim whitespace, Normalize separators, Remove exact duplicate records, Remove invalid/empty lines, Reverse order, and Keep original order.
   - Sorting by full line, first field / number prefix, network detected locally from the supplied prefix, and parsed expiry — always local, never a lookup.
   - Live statistics: input lines, unique lines, duplicates removed, empty lines removed, remaining lines, plus a Before / After counter.
   - Output area with one record per line: Copy All, Download TXT, Select All and Clear, with toasts, empty/loading/error states and keyboard shortcuts.
   - Visible note: `Local text processing — data is not uploaded.`

4. **Settings**:
   - Dark/light theme switcher (the only setting persisted to `localStorage`).
   - Manual Guison API readiness check (`/readyz`).
   - Clear session lookup history button.
   - Clear safety guidelines and development boundaries.

## Interface

- Renamed end to end to **ORIGEN** (page title, wordmark, navigation, Open Graph metadata, README).
- The header carries a **Join Channel** button that opens the ORIGEN Telegram channel in a new tab. It is keyboard reachable, has an explicit accessible label, and collapses to a compact icon button on very narrow screens.

## Strict Boundaries & Safety

- **Synthetic test data only**: This tool is designed strictly for frontend form validation, mock API services, UI testing, and QA fixture creation.
- **Never implemented**: Payment processing, transactions, authorizations, balance checking, live card checking, merchant testing, or card scraping.
- **Card Sorter is text handling only**: it cleans, deduplicates and sorts text already in the page. It does not verify a card, check whether a card is active, run transactions, contact payment processors, query banks, scrape card databases, or send pasted data to any API. All processing happens in the browser and no request is made while sorting.
- Generated cards are not issued test accounts and are never verified against banks or card networks.

## Running Locally

```bash
npm install
npm run dev         # Starts Vite dev server on 0.0.0.0:5173
npm run build       # Strict TypeScript check and production build (outputs dist/)
npm start           # Serves the built dist/ on 0.0.0.0:$PORT (default 8080)
npm test            # 217 Vitest unit tests + static-server integration tests
npm run test:e2e    # Playwright browser tests across viewports (generator, BIN lookup, Card Sorter)
npm run lint        # ESLint check
```

## Deployment

ORIGEN is a static, client-side app, so it can be hosted either as static files
or as a long-running web service. This repository supports both.

**Static hosting** (Netlify, Vercel, GitHub Pages, Cloudflare Pages, S3, ...):
build with `npm run build` and publish the `dist/` directory.

**Web service / container hosts** (Railway, Render, Fly, Heroku, ...):
the platform starts the app with the standard npm start command.

```bash
npm install
npm run build       # produces dist/
npm start           # node server.js — serves dist/
```

`server.js` is a dependency-free Node static server that:

- binds `0.0.0.0` and honours the platform-provided `PORT` variable (default `8080`),
- serves `dist/` with correct MIME types, plus client-side routing fallback to `index.html`,
- sends long-lived immutable cache headers for hashed assets and `no-cache` for the app shell,
- exposes `GET /healthz` (returns `200 {"status":"ok"}` when the build is present) for health checks.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8080` | Port to listen on (set automatically by most hosts) |
| `HOST` | `0.0.0.0` | Interface to bind |
| `ORIGEN_STATIC_DIR` | `./dist` | Directory of built files to serve |

Host configuration is committed for the common platforms:

- `railway.json` — build `npm install && npm run build`, start `node server.js`, health check `/healthz`.
- `render.yaml` — Render blueprint with the same build/start commands.

No start command needs to be set manually in the dashboard.
