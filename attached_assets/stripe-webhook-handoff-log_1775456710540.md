# Stripe Webhook Fix Handoff (2026-04-06)

## What Was Fixed

- Webhook membership flow now resolves a real player id from user id before player updates.
- Stripe subscription handlers now use resolved player id when:
  - reading existing membership subscriptions
  - creating membership subscriptions
  - updating player.member
- DatabaseStorage membership subscription methods were switched from memStorage delegation to Postgres-backed queries/inserts/updates/deletes.
- Webhook event persistence/idempotency remains DB-backed via webhook_events methods.

## Key Files Changed

- server/controllers/financial.controller.ts
- server/storage.ts
- scripts/verify-stripe-webhook-flow.ts

## Validation Performed

- Type check completed successfully (`npm.cmd run check`).
- Local server started and webhook endpoint accepted signed test events.
- Server logs showed subscription handling for test users.
- Duplicate event probe previously returned HTTP 200 on repeat delivery and did not show duplicate processing behavior.

## Current Verifier (Single Script)

- Use: `npx tsx scripts/verify-stripe-webhook-flow.ts`
- Behavior:
  - creates disposable user/player rows
  - sends signed Stripe webhook test events
  - verifies player.member + membership_subscriptions + webhook_events
  - cleans up test rows (unless `KEEP_WEBHOOK_TEST_DATA=1`)

## What Replit Agent Should Do Next

1. Confirm Stripe Dashboard webhook endpoint URL is production-correct:
   - `https://BilliardsLadder.replit.app/api/stripe/webhook`
2. Ensure subscribed Stripe events include:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
3. Run one real checkout in the target environment and confirm DB state:
   - a row exists in `membership_subscriptions` for that player
   - `players.member = true`
   - corresponding `webhook_events` rows exist
4. If needed, run the TS verifier script from this repo for regression checks.
