# Architecture — ActionLadder Billiards

## Overview
ActionLadder is a competitive billiards ladder/tournament platform. Players challenge each other for points, play in tournaments, wager in escrow matches, watch live streams, and manage their career stats.

**Stack**
| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, TanStack Query v5, Wouter v3, shadcn/ui |
| Backend | Node.js + Express + TypeScript (tsx) |
| Database | PostgreSQL (Neon serverless) via Drizzle ORM |
| Auth | Replit OpenID Connect (OIDC) + Passport.js + express-session |
| Payments | Stripe (Checkout, Billing, Connect) |
| Realtime | Socket.IO (challenge events) |
| AI | OpenAI GPT-4o |
| Email | SendGrid |
| Storage | Replit Object Storage |
| Infra | Replit (dev + prod), optional: Fly.io / Render |

---

## Module / Feature List

| Module | Description |
|---|---|
| **Ladder** | 9ft / 8ft / barbox divisions with ranked challenges |
| **Rookies** | Separate section for new players (sub-300 rating) |
| **Tournaments** | Bracket tournaments with calcutta bidding and prize pools |
| **Escrow Challenges** | 1v1 wager matches held in escrow |
| **Special Games** | Kelly Pool, Money Games, Side Bets |
| **Hall Battles** | Inter-venue competitions (locked by default, trustee-unlocked) |
| **Team Management** | Team creation, matches, and challenges |
| **League Standings** | Cross-division standings and season tracking |
| **Sportsmanship** | Attitude voting, reports, and respect points |
| **Bounties** | Player-placed bounties with escrow payouts |
| **Charity Events** | Donation-backed charity games |
| **Monetization** | Operator revenue dashboards + commission splits |
| **Player Career** | Career stats, earnings, services, and withdrawals |
| **Training** | Training sessions, coach feedback, hall leaderboards |
| **AI Features** | Matchmaking advice, climbing strategies, community chat |
| **Live Stream** | Stream status + embed URL management |
| **QR Registration** | In-venue player registration via QR code |
| **Admin** | User management, alerts, hall access control |
| **Billing** | Stripe subscription management (Rookie/Basic/Pro) |

---

## Data Flow

```
Browser (React + Vite)
  ↓ HTTP/REST  ↑ JSON
Express Server (server/index.ts)
  → Middleware (auth, rate-limit, sanitize, requestId, errorHandler)
  → Routes (server/routes/*.ts)
    → Controllers (server/controllers/*.ts)   ← thin: parse + validate
      → Services (server/services/*.ts)       ← thick: business logic
        → Storage / Repos (server/storage.ts) ← DB access (Drizzle ORM)
        → Integrations (Stripe, OpenAI, SendGrid, ObjectStorage)
  → WebSocket (Socket.IO via challengeSocketEvents)
```

---

## Key Files

| File | Purpose |
|---|---|
| `server/index.ts` | Express bootstrap: middleware, routes, Vite dev server |
| `server/routes.ts` | Main route registration (legacy inline routes) |
| `server/routes/` | Modular route files by feature |
| `server/storage.ts` | IStorage interface + DatabaseStorage + MemStorage (dev) |
| `shared/schema.ts` | Drizzle schema — source of truth for all data shapes |
| `server/config/env.ts` | Env validation — runs at startup, fails fast if missing |
| `server/lib/errors.ts` | Typed error classes (AppError, NotFoundError, etc.) |
| `server/lib/logger.ts` | Structured logger (JSON in prod, colour in dev) |
| `server/middleware/errorHandler.ts` | Global error handler + requestId middleware |
| `client/src/App.tsx` | React root: routing + navigation |
| `client/src/lib/queryClient.ts` | TanStack Query client + apiRequest helper |

---

## Authentication Flow

```
1. User clicks "Sign in" → redirected to Replit OIDC
2. Replit authenticates → callback to /api/callback
3. Passport creates session (stored in PostgreSQL sessions table)
4. Subsequent requests: session cookie → req.user populated
5. server/middleware/auth.ts: isAuthenticated / requireRole guards
```

## Role Hierarchy

```
OWNER > TRUSTEE > OPERATOR > STAFF > PLAYER (default)
```
See `docs/role-matrix.md` for full permission matrix.

---

## Payment Flow

```
Player subscribes →
  POST /api/billing/create-checkout → Stripe Checkout session
  → Player completes checkout on Stripe
  → Stripe sends webhook to POST /api/stripe/webhook
  → Webhook verifies signature → updates player subscription tier
  → Player gets member benefits (lower fees, free tournament entry)
```

See `docs/state-machines.md` for complete payment state machine.
