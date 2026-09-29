# Fixture / Card Lab

A developer-only payment test-data and BIN metadata utility. Built with TypeScript, Vite, native DOM components, and local Lucide icons.

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

3. **Settings**:
   - Dark/light theme switcher (the only setting persisted to `localStorage`).
   - Manual Guison API readiness check (`/readyz`).
   - Clear session lookup history button.
   - Clear safety guidelines and development boundaries.

## Strict Boundaries & Safety

- **Synthetic test data only**: This tool is designed strictly for frontend form validation, mock API services, UI testing, and QA fixture creation.
- **Never implemented**: Payment processing, transactions, authorizations, balance checking, live card checking, merchant testing, or card scraping.
- Generated cards are not issued test accounts and are never verified against banks or card networks.

## Running Locally

```bash
npm install
npm run dev        # Starts Vite on 0.0.0.0:5173
npm run test       # Runs 150 Vitest unit tests
npm run test:e2e   # Runs 16 Playwright browser tests across viewports
npm run lint       # ESLint check
npm run build      # Strict TypeScript check and production build
```
