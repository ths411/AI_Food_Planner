# AI Food Planner DK (MVP)

Next.js MVP that generates weekly meal plans optimized for Danish discount offers (tilbudsaviser), ingredient reuse, and low food waste.

## Stack

- Frontend + backend: Next.js App Router + TypeScript + Tailwind
- DB: SQLite + Prisma
- AI: OpenAI API with strict JSON validation (Zod)
- Scheduling: `node-cron`
- Email: SendGrid API or SMTP (local/dev)
- Offer ingestion: connector interface + mock connector + Salling API connector + manual upload fallback

## Features in this MVP

- User settings:
  - email
  - people count (+ adults/children split)
  - cuisines, dislikes, allergies
  - diet mode (omnivore/flexitarian/vegetarian)
  - budget sensitivity
  - selected stores
- Pantry management with optional expiry dates
- Offer ingestion:
  - refresh endpoint for configured connectors
  - connector status with timestamps/error info
  - manual upload endpoint for PDF/text flyer fallback
- Weekly generation:
  - 7-day plan (`dinner` or `lunch_dinner`)
  - strict JSON schema output
  - hard constraints: allergies/time cap/servings
  - 3 candidate plans + deterministic reranking
  - waste/reuse notes and grocery list grouped by store
- Email:
  - auto-send after generation
  - manual resend from results page
  - HTML + plain text formats
- Shareable plan URL by token (`/results/:token`)
- Per-user generation rate limit (default 5/hour)

## Project setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Generate Prisma client and migrate DB:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Seed mock data:

```bash
npm run db:seed
```

5. Run app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Required core:

- `DATABASE_URL` (default in example: `file:./dev.db`)
- `MAIL_FROM`
- `APP_BASE_URL`

AI:

- `OPENAI_API_KEY` (optional; if absent, deterministic fallback generator is used)
- `OPENAI_MODEL` (default `gpt-4.1-mini`)

Email (choose one):

- SendGrid:
  - `SENDGRID_API_KEY`
  - `SENDGRID_API_URL` (default `https://api.sendgrid.com/v3/mail/send`)
- SMTP (local/dev):
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER` (optional)
  - `SMTP_PASS` (optional)

Offers + scheduling:

- `CRON_REFRESH` (default `0 6 * * *`)
- `SALLING_API_KEY` (for real connector)
- `SALLING_API_BASE_URL` (default `https://api.sallinggroup.com/v1-beta`)
- `PLAN_RATE_LIMIT_PER_HOUR` (default `5`)

## Prisma models

Defined in `prisma/schema.prisma`:

- `User`
- `PantryItem`
- `Store`
- `StoreConnectorStatus`
- `Offer`
- `MealPlan`
- `GenerationLog`

## Connector architecture

`lib/connectors/types.ts`:

```ts
interface StoreConnector {
  storeKey: string;
  fetchLatestFlyers(): Promise<FlyerRef[]>;
  fetchOffers(flyer: FlyerRef): Promise<NormalizedOffer[]>;
}
```

Implemented connectors:

- `MockConnector` (`lib/connectors/mock-connector.ts`)
- `SallingConnector` (`lib/connectors/salling-connector.ts`) as real HTTP connector

Manual fallback:

- UI: `/offers`
- API: `POST /api/offers/upload`
- Parser: `lib/offers/upload-parser.ts`

## Core API routes

- `GET/POST /api/settings`
- `GET/POST/DELETE /api/pantry`
- `GET /api/offers`
- `POST /api/offers/refresh`
- `POST /api/offers/upload`
- `POST /api/plan/generate`
- `POST /api/plan/send-email`

## MVP pages

- `/` landing
- `/settings`
- `/pantry`
- `/generate`
- `/offers` (manual flyer upload)
- `/results/[id]`

## Flow (Step A-F)

- Step A: scaffold + Prisma + pages
- Step B: mock offers pipeline + offer status UI
- Step C: AI plan generation + strict JSON schema validation + repair retry
- Step D: scoring/reranking (offer match, overlap, waste penalty, pantry utilization)
- Step E: email delivery + resend
- Step F: real connector + connector cache status + cron refresh

## Notes on scraping and compliance

- Connector implementation is designed to use official/public endpoints where available.
- Use only sources allowed by store terms and robots policies.
- Manual upload path is included to avoid unsupported scraping patterns.

## Quick test path

1. Go to `/settings`, save `demo@example.com`.
2. Go to `/pantry`, add a couple of expiring items.
3. Go to `/generate`, click `Refresh offers`, then `Generate plan`.
4. Review `/results/:token` and click `Send to email`.
