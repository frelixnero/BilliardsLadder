# BilliardsLadder Stripe QA Report

**Date**: April 5, 2026
**Environment**: Replit Development (Test Mode)
**Stripe Account**: `acct_1RzCXFDc2BliYufw` (blazn03@gmail.com, "Action Ladder sandbox")

---

## Executive Summary

A full end-to-end QA validation was performed on the Stripe payment system. The audit uncovered **3 critical issues** that would have caused payment failures in production. All issues have been resolved and verified.

**Status before fixes**: NOT READY FOR PRODUCTION
**Status after fixes**: All payment flows operational in test mode

---

## Section 1: Pre-Flight Checks

| Check | Result |
|-------|--------|
| Server running | PASS (HTTP 200 on port 5000) |
| `STRIPE_SECRET_KEY` set | PASS |
| `STRIPE_WEBHOOK_SECRET` set | PASS |
| `APP_BASE_URL` resolution | PASS (resolves to `https://BilliardsLadder.replit.app`) |
| Webhook endpoint exists (`POST /api/stripe/webhook`) | PASS (returns 400 without signature = endpoint is live) |
| Stripe SDK connectivity | PASS (connected to account `acct_1RzCXFDc2BliYufw`) |

---

## Section 2: Authentication Setup

A test user was registered and authenticated successfully.

| Step | Result |
|------|--------|
| Register test user (`stripeqa_*@test.com`) | PASS |
| Login with credentials | PASS |
| Session cookie captured | PASS |
| `/api/auth/me` returns user data | PASS |
| User exists in database with correct fields | PASS |
| `stripe_customer_id` initially null | PASS (expected) |

---

## Section 3: Checkout Tests

### 3a. Player Billing Checkout (`/api/player-billing/checkout`) — PASS

- **Request**: `POST /api/player-billing/checkout` with `{"tier":"rookie","billingPeriod":"monthly"}`
- **Response**: HTTP 200 with valid Stripe checkout URL
- **Checkout session details**:
  - Mode: `subscription`
  - Success URL: `https://BilliardsLadder.replit.app/app?tab=dashboard&subscription=success`
  - Cancel URL: `https://BilliardsLadder.replit.app/app?tab=dashboard&subscription=cancelled`
  - Customer created in Stripe: `cus_UHKkTI7uQhMqrE`
  - Metadata correctly includes `userId`, `tier`, `billingPeriod`, `type`
- **Why it worked**: This endpoint uses `price_data` (dynamic pricing) — it creates prices on the fly rather than referencing pre-created Stripe price IDs.

### 3b. Generic Billing Checkout (`/api/billing/checkout`) — FAILED

- **Request**: `POST /api/billing/checkout` with rookie monthly price ID from environment variable
- **Response**: HTTP 500
- **Error**: `"Error creating checkout session: No such price: 'price_1THmhwDvTG8XWAaKP5IdXAic'"`
- **Root Cause**: The price ID belongs to a different Stripe account (`DvTG8XWAaK`), not the current account (`Dc2BliYufw`)

### 3c. Operator Hall Checkout — FAILED

- **Request**: `POST /api/billing/checkout` with small hall price ID
- **Response**: HTTP 500
- **Error**: `"Error creating checkout session: No such price: 'price_1THmiLDvTG8XWAaKhXE4JvZq'"`
- **Same root cause**: Price ID from wrong Stripe account

### 3d. Payment Intent — PASS (but security issue found)

- **Request**: `POST /api/create-payment-intent` with `{"amount":2500}`
- **Response**: HTTP 200 with valid `clientSecret`
- **Security Issue**: This endpoint had NO authentication guard — anyone could call it without logging in

---

## Section 4: Stripe Customer Verification

| Check | Result |
|-------|--------|
| Stripe customer created during checkout | PASS (`cus_UHKkTI7uQhMqrE`) |
| Customer linked to user in database | PASS |
| Customer email matches user email | PASS |
| Customer metadata contains `userId` and `userRole` | PASS |

---

## Section 5: Redirect URL Verification

| Check | Result |
|-------|--------|
| Success URL uses deployed domain (not localhost) | PASS |
| Cancel URL uses deployed domain | PASS |
| Success URL: `https://BilliardsLadder.replit.app/app?tab=dashboard&subscription=success` | PASS |
| Cancel URL: `https://BilliardsLadder.replit.app/app?tab=dashboard&subscription=cancelled` | PASS |
| Frontend routes `/billing/success` and `/billing/cancel` exist in App.tsx | PASS |

---

## Section 6: Webhook Validation

### Signature Verification — PASS

| Test | HTTP Status | Result |
|------|-------------|--------|
| No `stripe-signature` header | 400 | Correctly rejected |
| Invalid signature | 400 | Correctly rejected |

### Event Handler Coverage — PASS

The webhook handler processes 8 Stripe event types:

1. `checkout.session.completed`
2. `customer.subscription.created`
3. `customer.subscription.updated`
4. `customer.subscription.deleted`
5. `invoice.paid`
6. `invoice.payment_failed`
7. `payment_intent.succeeded`
8. `charge.refunded`

### Idempotency — PASS

- `alreadyProcessed()` deduplication check is implemented
- `webhook_events` table exists with columns: `id`, `stripe_event_id`, `event_type`, `processed_at`, `payload_json`

---

## Section 7: Security Audit

### Authentication Guards

| Endpoint | Auth Required? | Result |
|----------|---------------|--------|
| `POST /api/billing/checkout` | Yes (401 without auth) | PASS |
| `POST /api/player-billing/checkout` | Yes (401 without auth) | PASS |
| `POST /api/create-payment-intent` | **NO — returned 200 without auth** | **FAILED** |

### Price ID Validation Against Stripe Account

**ALL 7 environment variable price IDs were INVALID:**

| Variable | Stored Value | Result |
|----------|-------------|--------|
| `PLAYER_ROOKIE_MONTHLY_PRICE_ID` | `price_1THmhwDvTG8XWAaKP5IdXAic` | INVALID |
| `PLAYER_STANDARD_MONTHLY_PRICE_ID` | `price_1THmi0DvTG8XWAaKGZwVO8WR` | INVALID |
| `PLAYER_PREMIUM_MONTHLY_PRICE_ID` | `price_1THmi2DvTG8XWAaKpyx6VNyR` | INVALID |
| `SMALL_PRICE_ID` | `price_1THmiLDvTG8XWAaKhXE4JvZq` | INVALID |
| `MEDIUM_PRICE_ID` | `price_1THmiPDvTG8XWAaKkeveuEqq` | INVALID |
| `LARGE_PRICE_ID` | `price_1THmiRDvTG8XWAaK39Gg3Nb9` | INVALID |
| `MEGA_PRICE_ID` | `price_1THmiUDvTG8XWAaKa43Y9Bm9` | INVALID |

**Root cause**: All price IDs contain the prefix `DvTG8XWAaK`, which belongs to a completely different Stripe account. The current account is `Dc2BliYufw`. These were likely copied from a previous Stripe setup that is no longer connected.

Additionally, **14 hardcoded fallback price IDs** in `server/controllers/financial.controller.ts` (lines 34-49) were also from the wrong account, including:
- 3 player subscription prices
- 7 charity donation prices
- 1 charity product ID (`prod_UGJKFusMczHWQ3` — does not exist in current account)

---

## Section 8: Failure Handling Tests

| Test | HTTP | Response | Result |
|------|------|----------|--------|
| Invalid price ID (`price_INVALID`) | 500 | `"No such price: 'price_INVALID'"` | PASS (proper error) |
| Missing tier in player-billing | 400 | `"tier required"` | PASS |
| Invalid tier name | 400 | `"Invalid subscription tier"` | PASS |
| Zero amount payment intent | 500 | Stripe minimum charge error | PASS (proper error) |

---

## Issues Found and Fixes Applied

### Issue 1: All Stripe Price IDs From Wrong Account (CRITICAL)

**What went wrong**: Every Stripe price ID in the system — both the 7 stored as environment variables and the 14 hardcoded as fallbacks in the source code — belonged to Stripe account `DvTG8XWAaK`. The app is connected to a different Stripe account: `Dc2BliYufw` (blazn03@gmail.com). This meant that every checkout attempt using pre-created price IDs would fail with "No such price" errors.

**How it was fixed**:

1. Queried the current Stripe account (`Dc2BliYufw`) for all active prices and products
2. Mapped each code reference to the correct price in the current account:

| Purpose | Old (Invalid) ID | New (Valid) ID | Amount |
|---------|-----------------|----------------|--------|
| Rookie monthly | `price_1THmhwDvTG8XWAaKP5IdXAic` | `price_1T50oRDc2BliYufwrfHeSzfg` | $25.99/mo |
| Basic monthly | `price_1THmi0DvTG8XWAaKGZwVO8WR` | `price_1T50oUDc2BliYufwltyeKc3v` | $35.99/mo |
| Pro monthly | `price_1THmi2DvTG8XWAaKpyx6VNyR` | `price_1T50oYDc2BliYufw6h8lK7x9` | $59.99/mo |
| Small hall | `price_1THmiLDvTG8XWAaKhXE4JvZq` | `price_1S0WigDc2BliYufwwhMBtfBp` | $199/mo |
| Medium hall | `price_1THmiPDvTG8XWAaKkeveuEqq` | `price_1S0WmcDc2BliYufwIHGYbmh2` | $299/mo |
| Large hall | `price_1THmiRDvTG8XWAaK39Gg3Nb9` | `price_1S0WolDc2BliYufwyArihWAl` | $499/mo |
| Mega hall | `price_1THmiUDvTG8XWAaKa43Y9Bm9` | `price_1S0WzuDc2BliYufwG7E2CJbS` | $799/mo |
| Charity $5 | `price_1THmi4DvTG8XWAaKLE6mESxA` | `price_1S36mVDc2BliYufwKkppBTdZ` | $5 |
| Charity $10 | `price_1THmi7DvTG8XWAaKdKDzSjXE` | `price_1S36mWDc2BliYufw9SnYauG6` | $10 |
| Charity $25 | `price_1THmi9DvTG8XWAaKY0S3p2Cf` | `price_1S36mWDc2BliYufwdLec5IH6` | $25 |
| Charity $50 | `price_1THmiCDvTG8XWAaKbUxZQUnc` | `price_1S36mWDc2BliYufwnyruktLt` | $50 |
| Charity $100 | `price_1THmiEDvTG8XWAaK0aXNtqxB` | `price_1S36mWDc2BliYufwMMQxtrpd` | $100 |
| Charity $250 | `price_1THmiGDvTG8XWAaK1Lh1RO9i` | `price_1S36mXDc2BliYufw8KoRGk5g` | $250 |
| Charity $500 | `price_1THmiJDvTG8XWAaKPVETvXvR` | `price_1S36mXDc2BliYufwhW9OUZng` | $500 |
| Charity product | `prod_UGJKFusMczHWQ3` | `prod_Sz4wWq0exnJOBv` | N/A |

3. Updated all 15 values in `server/controllers/financial.controller.ts` (lines 35-52)
4. Removed the 7 stale environment variables that were overriding the code with invalid values

**Files changed**: `server/controllers/financial.controller.ts`

### Issue 2: Payment Intent Endpoint Had No Authentication (HIGH)

**What went wrong**: The `POST /api/create-payment-intent` endpoint had no `isAuthenticated` middleware, meaning anyone on the internet could create Stripe payment intents against the account without logging in. During testing, calling this endpoint without any session cookie returned HTTP 200 with a valid payment intent client secret.

**How it was fixed**: Added the `isAuthenticated` middleware to the route definition in `server/routes/financial.routes.ts`.

**Before**:
```typescript
app.post("/api/create-payment-intent",
  sanitizeBody(["description", "statement_descriptor"]),
  financialController.createPaymentIntent()
);
```

**After**:
```typescript
app.post("/api/create-payment-intent",
  isAuthenticated,
  sanitizeBody(["description", "statement_descriptor"]),
  financialController.createPaymentIntent()
);
```

**Files changed**: `server/routes/financial.routes.ts`

### Issue 3: Stale Environment Variables Overriding Code (MEDIUM)

**What went wrong**: The 7 invalid price IDs were stored as environment variables (`PLAYER_ROOKIE_MONTHLY_PRICE_ID`, `PLAYER_STANDARD_MONTHLY_PRICE_ID`, `PLAYER_PREMIUM_MONTHLY_PRICE_ID`, `SMALL_PRICE_ID`, `MEDIUM_PRICE_ID`, `LARGE_PRICE_ID`, `MEGA_PRICE_ID`). Since the code uses `process.env.VAR || "fallback"`, these invalid env vars would override the corrected fallback values.

**How it was fixed**: Deleted all 7 environment variables so the corrected hardcoded fallbacks in the source code are used. The code still supports environment variable overrides if you want to set them in the future — but they are no longer required.

**Action taken**: Removed via Replit environment variable management

---

## Post-Fix Verification

All fixes were verified after server restart:

| Test | Result |
|------|--------|
| Player billing checkout (rookie) | HTTP 200 — valid Stripe checkout URL |
| Generic billing checkout (basic membership) | HTTP 200 — valid Stripe checkout URL |
| Operator hall checkout (mega) | HTTP 200 — valid Stripe checkout URL |
| Payment intent WITHOUT auth | HTTP 401 — correctly blocked |
| Payment intent WITH auth | HTTP 200 — correctly allowed |
| All 14 price IDs validated against Stripe API | 14/14 PASS |
| Webhook signature rejection (no signature) | HTTP 400 — correctly rejected |

---

## Remaining Considerations

1. **Stripe account mode**: The account reports `charges_enabled: true`. Ensure you are using test-mode API keys (`sk_test_...`) during development. If live keys are in use, real charges could be created.

2. **Stripe price nicknames**: None of the 30+ prices in your Stripe account have nicknames assigned. Adding descriptive nicknames in the Stripe Dashboard would make future audits much easier.

3. **In-memory rate limiter**: The auth rate limiter (10 attempts per 15 minutes) uses in-memory storage and resets on server restart. For production, consider a persistent rate limiter backed by Redis or the database.

4. **Browser-based checkout completion**: This QA validated checkout session creation and URL generation via API calls. The actual Stripe-hosted checkout page (card entry, payment confirmation) and webhook delivery after payment could not be tested without a browser and the Stripe CLI. These should be tested manually using Stripe test card `4242 4242 4242 4242`.

---

## Files Modified

| File | Change |
|------|--------|
| `server/controllers/financial.controller.ts` | Replaced 14 invalid price IDs + 1 product ID with correct ones from current Stripe account |
| `server/routes/financial.routes.ts` | Added `isAuthenticated` middleware to `/api/create-payment-intent` route |
| `replit.md` | Added Stripe configuration documentation section |

---

*Report generated April 5, 2026*
