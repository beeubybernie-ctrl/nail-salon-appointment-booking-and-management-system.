# Bee-U by Bernie — Appointment Booking

Client booking portal and admin dashboard for the nail salon **Bee-U by Bernie** (“Be You. Be Beautiful.”).

## Quick start

```bash
npm install
cp .env.example .env        # edit values
npx prisma db push          # create the database
npm run db:seed             # seed admin, services, hours, breaks, demo data
npm run dev                 # http://localhost:3000
```

### Default admin login (change after first login)

- Email: `bee.u.by.bernie@gmail.com`
- Password: `admin123`

Change the password via `prisma/seed.ts` (bcrypt hash) and re-seed, or set up a password-change flow. Never keep the default password in production.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm test` | Availability-engine automated tests (32 checks) |
| `npm run db:push` | Sync Prisma schema to the database |
| `npm run db:seed` | Seed admin user, services, business hours, demo data |
| `npm run db:reset` | Reset the database |
| `npx tsx prisma/cleanup-test.ts` | Remove demo/test clients & appointments |

## Configuration

All settings live in `.env` (see `.env.example`):

- `DATABASE_URL` — SQLite file for development; use **PostgreSQL** in production.
- `AUTH_SECRET` — signs the admin session cookie (HMAC).
- `WHATSAPP_NUMBER` — business WhatsApp (default `27672535540`).
- `BUSINESS_EMAIL` — business email (default `bee.u.by.bernie@gmail.com`).
- `NEXT_PUBLIC_APP_URL` — public base URL used in cancel/reschedule links.
- Optional message providers:
  - `EMAIL_PROVIDER` + `EMAIL_API_KEY`
  - `WHATSAPP_PROVIDER` + `WHATSAPP_API_KEY`

When no provider is configured, `sendEmail`/`sendWhatsApp` return `NOT_CONFIGURED` — no fake sends. Confirmation, cancellation and reschedule emails/WhatsApp messages go out once a provider is configured.

## Business hours & availability

The availability engine (`src/lib/availability.ts`) is the core. It honors:

- Business hours (per `BusinessHours`): Mon–Fri 09:00–19:00, Sat 09:00–17:00, Sun closed.
- Breaks (per `BusinessBreak`): Mon 14:30–15:00; Tue–Fri 15:00–15:30.
- Blocked times (`BlockedTime`) — holidays, maintenance, personal blocks.
- Existing appointments (status-based; `CANCELLED`/`NO_SHOW` never block).
- Default booking duration (120 minutes, configurable as a Setting).

Slots are offered in 30-minute increments between opening and closing, never overlapping a break, and always ending by closing time. Booking and reschedule endpoints re-check availability **inside a transaction** to prevent double-booking races.

Client flow:

- `/book` — multi-step wizard (service → extras → date/time → details → confirmation).
- `/cancel/[token]` and `/reschedule/[token]` — secure, account-free cancellation/rescheduling links emailed to the client.

## Admin

Admin routes are protected by `requireAdmin()` (signed session cookie). Public login at `/admin/login`.

- Dashboard — today / next 7 / next 30 days, revenue and status stats.
- Calendar — day / week / month views.
- Appointments — list, detail with status actions, manual creation (with availability check and an override option), edit, reschedule.
- Clients — search, detail with booking history.
- Services & price list — manage categories, services, prices.
- Blocked time — block arbitrary slots from availability.
- Business hours — editing hours/breaks applies immediately.
- Settings — booking rules such as default duration, advance booking windows, cancellation policy.
- Notifications — shows provider configuration status.

## Tests

`npm test` builds a fresh SQLite database in `tests/test.db`, seeds the standard schedule, and verifies the availability engine:

- Monday schedule and the 14:30–15:00 break boundary cases.
- Tuesday break (15:00–15:30), Saturday closing, Sunday closed.
- Double-booking protection (exact, overlapping, touching slots).
- Cancellation frees a slot.
- Blocked time is honored.
- Long appointments that span a break are rejected.

## Tech stack

Next.js 16 (App Router, `src/`), React 19, TypeScript, Tailwind CSS v4, Prisma 6 (SQLite for dev; PostgreSQL for production), bcryptjs, zod, date-fns, lucide-react.

## Deploy to Vercel (free)

Vercel runs the app publicly; GitHub stores the code; Neon hosts the free PostgreSQL database.

### Why PostgreSQL?

Vercel's free tier uses ephemeral storage, so the local SQLite file (`dev.db`) would be wiped on every deploy. Production therefore uses PostgreSQL via a second schema: `prisma/schema.pg.prisma` (models identical to `prisma/schema.prisma`). `vercel.json` tells Vercel to apply migrations and generate the Postgres client before each build. Local development keeps using SQLite — no changes to your workflow.

### 1. Push the code to GitHub

```bash
git add -A
git commit -m "Bee-U by Bernie booking app"
git branch -m main
git remote add origin https://github.com/beeubybernie-ctrl/nail-salon-appointment-booking-and-management-system.git
git push -u origin main
```

> Your repo is private, so GitHub will ask you to authenticate (browser login or a Personal Access Token). If the push is rejected because the repo has existing history, run `git pull origin main --allow-unrelated-histories` first, then push again.

### 2. Create a free MySQL-free database — Neon

1. Sign in at https://neon.tech (free "Launch" plan).
2. Create a project (any region, e.g. Europe). Copy the **non-pooling connection string** — it looks like:
   `postgresql://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require`
3. Keep it handy; you'll paste it into Vercel.

### 3. Connect Vercel

1. Sign in at https://vercel.com with your GitHub account.
2. **Add New Project → Import** your `nail-salon-appointment-booking-and-management-system` repo. Vercel detects `vercel.json` automatically.
3. Under **Environment Variables**, add:
   - `DATABASE_URL` — your Neon connection string (from step 2)
   - `AUTH_SECRET` — any long random string (generate one at https://generate-secret.vercel.app/32)
   - `NEXT_PUBLIC_APP_URL` — leave blank initially; fill in later with your deployed URL (e.g. `https://bee-u-app.vercel.app`)
   - `WHATSAPP_NUMBER` — `27672535540`
   - `BUSINESS_EMAIL` — `bee.u.by.bernie@gmail.com`
4. Click **Deploy**. The first build runs migrations (creating all tables) and then builds the app.
5. When it finishes, you get a public URL like `https://bee-u-app.vercel.app`. Set `NEXT_PUBLIC_APP_URL` to that URL and redeploy.

### 4. Seed the production database

From your computer, with the Neon `DATABASE_URL`:

```bash
set "DATABASE_URL=postgresql://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require" && npx tsx prisma/seed.ts
```

This creates the admin user, services, business hours, breaks and settings. **Immediately change the admin password** (default `admin123` is not safe for production) — either via a future password-change feature, or update the hash in `prisma/seed.ts` and re-run.

### 5. Going live

- **Clients** use your Vercel URL (or a custom domain under **Domains** in the Vercel project). They can also add the site to their phone home screen — the PWA manifest makes it feel like an app.
- **You** open `/admin` and sign in with the admin credentials.
- Every time you `git push` to GitHub, Vercel automatically redeploys.

### Optional paid extras

- A custom domain (e.g. `beeubypernie.co.za`) — cost of the domain only.
- None required; the free Vercel + Neon tiers are enough for a salon's booking volume.

## Production notes

- The app runs entirely on the free Vercel (Hobby) + Neon tiers.
- Configure at least one notification provider to enable automated emails/WhatsApp (see `.env.example`).
- Reminders: add a scheduled job (e.g. Vercel Cron) calling a reminder endpoint before appointments.