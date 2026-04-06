# Stripe Production Verification — Pre-Handoff Checklist

## Objective
Run comprehensive verification to confirm the Stripe integration is production-ready and safe to hand back to client.

## Instructions for AI Agent

Execute the production verification script:

```bash
NODE_ENV=production npx tsx scripts/stripe-production-verification.ts
```

### What This Script Validates

1. **Stripe Account** — Confirms STRIPE_SECRET_KEY connects to correct account (acct_1RzCX3DvTG8XWAaK)
2. **All 14 Price IDs** — Validates live on Stripe with correct amounts:
   - Rookie ($20/mo), Basic ($25/mo), Pro ($60/mo)
   - Charity ($5–$500 one-time, 7 tiers)
   - Hall bookings ($99–$499/mo, 4 tiers)
3. **Database Tables** — Confirms all required tables are accessible:
   - `players`, `users`, `membershipSubscriptions`, `webhookEvents`
4. **Webhook Endpoint** — Verifies `/api/stripe/webhook` is running and reachable
5. **End-to-End Flow** — Creates test user/player, simulates webhook event, records to all tables, updates player.member flag
6. **Persistence** — Confirms all data survives DB queries (then cleans up test data)

### Expected Output

The script will print a detailed report with:
- ✓ Green checkmarks for passing tests
- ✗ Red X marks for failures
- ⚠ Yellow warnings for non-critical issues
- Final recommendation: `READY_FOR_HANDOFF`, `READY_WITH_WARNINGS`, or `NOT_READY`

### Prerequisites

- Server must be running (`npm run dev` from root or `npm run dev` from server/)
- `STRIPE_SECRET_KEY` must be set to acct_1RzCX3DvTG8XWAaK key
- `STRIPE_WEBHOOK_SECRET` must be set (for webhook validation)
- Database must be accessible (Postgres running)
- Network access to Stripe API

### Interpreting Results

| Status | Action |
|--------|--------|
| `READY_FOR_HANDOFF` | ✅ All green. Safe to hand back to client immediately. |
| `READY_WITH_WARNINGS` | ⚠️ Minor issues detected. Review warnings and decide if safe to proceed. |
| `NOT_READY` | ❌ Critical failures. Fix and re-run before any handoff. |

---

## After Running

Report back with:
1. **Exit code** (0 = success, 1 = failure)
2. **Final recommendation** (READY_FOR_HANDOFF / READY_WITH_WARNINGS / NOT_READY)
3. **Any failures** (if NOT_READY, list each failure)
4. **Stripe account confirmed**: acct_1RzCX3DvTG8XWAaK
5. **All 14 prices validate**: Yes/No
6. **Database persistence verified**: Yes/No
7. **E2E webhook test passed**: Yes/No

Then we can proceed with client handoff.
