# Runbook — ActionLadder Deployment & Operations

## Local Development

```bash
# 1. Clone and install
git clone <repo>
cd BilliardsLadder-main
npm install

# 2. Copy and fill in env vars
cp .env.example .env
# Edit .env with your Neon DB URL, Stripe keys, etc.

# 3. Push DB schema (first time only)
npm run db:push

# 4. Start dev server (Express + Vite HMR on port 5000)
npm run dev
```

Dev server runs at: http://localhost:5000

---

## Production Build

```bash
npm run build
# → builds client to dist/public/ (Vite)
# → bundles server to dist/index.js (esbuild)

npm start
# → runs dist/index.js on PORT (default 5000)
```

---

## Deploying to Replit

### First deploy
1. Import repo into Replit
2. Open **Secrets** panel and add ALL vars from `.env.example`
3. Set Run command to: `npm start`
4. Set Build command to: `npm run build`
5. Click Deploy

### Environment Variables (Replit Secrets)
| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon dashboard → Connection string |
| `STRIPE_SECRET_KEY` | Stripe dashboard → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard → Webhooks → signing secret |
| `REPLIT_DOMAINS` | Auto-set by Replit (your-app.username.repl.co) |
| `REPL_ID` | Auto-set by Replit |
| `SESSION_SECRET` | Generate: `openssl rand -base64 32` |
| `OPENAI_API_KEY` | platform.openai.com |
| `SENDGRID_API_KEY` | app.sendgrid.com |
| `SMALL_PRICE_ID` | Stripe → Products → Operator Small tier |
| `MEDIUM_PRICE_ID` | Stripe → Products → Operator Medium tier |
| `LARGE_PRICE_ID` | Stripe → Products → Operator Large tier |
| `MEGA_PRICE_ID` | Stripe → Products → Operator Mega tier |

### Stripe Webhook Setup
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-replit-url.repl.co/api/stripe/webhook`
3. Events to listen:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
   - `charge.dispute.created`

---

## Database Operations

```bash
# Push schema changes (dev only — no migration file)
npm run db:push

# Generate migration SQL file
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

# Open Drizzle Studio (visual DB browser)
npx drizzle-kit studio
```

---

## Rollback

### Server rollback
1. In Replit: click **Deployments** → select previous deployment → **Restore**
2. Or: `git revert HEAD && npm run build && npm start`

### Database rollback
1. Neon dashboard → **Branches** → create restore branch from timestamp
2. Update `DATABASE_URL` to point to restore branch
3. Verify app works, then migrate restore branch to main

---

## Monitoring

### Health check
```
GET /api/health  → { status: "ok", ts: "...", uptime: N }
```

### Logs
- Dev: colour logs in terminal via `server/lib/logger.ts`
- Prod: JSON structured logs — pipe to cloud logging (Datadog, Logtail, etc.)
- Every request has `x-request-id` header for tracing

### Key metrics to watch
- `POST /api/stripe/webhook` — should return 200 quickly
- `GET /api/players` — if slow, check DB query performance
- Auth errors (401/403) — spike = possible session issue

---

## Common Commands

```bash
# Check TypeScript
npm run check

# Push DB schema
npm run db:push

# Kill port 5000 (if stuck)
npx kill-port 5000

# View logs (if running with pm2)
pm2 logs actionladder

# Restart (if running with pm2)
pm2 restart actionladder
```
