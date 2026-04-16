# BilliardsLadder Operator Subscription Eligibility Gate Report

Date: April 16, 2026

## 1) Objective
Implement a strict operator subscription eligibility policy with a shared backend source of truth:

- Rule 3 threshold gate: block operator subscription checkout when active hall players are below 20.
- Rule 2 tier floor after threshold: when active players are 20 or more, allow only the matching tier or higher.

## 2) Business Rules Implemented

### 2.1 Threshold Gate
- Minimum active players required to start operator subscription checkout: 20.
- If active players are below 20, checkout is rejected by the API.

### 2.2 Tier Eligibility (minimum tier floor)
The minimum eligible tier is determined by active player count:

- 20 to 25 players: minimum tier medium (allowed: medium, large, mega)
- 26 to 40 players: minimum tier large (allowed: large, mega)
- 41 or more players: minimum tier mega (allowed: mega)

Note: The previous small tier band (up to 15 players) remains in pricing definitions but is unreachable under the 20-player threshold gate by design.

## 3) Backend Implementation

### 3.1 File: server/controllers/financial.controller.ts

Added shared operator eligibility logic used by both checkout enforcement and a new read endpoint.

#### New types/constants/helpers
- OperatorTier union type: small, medium, large, mega.
- OPERATOR_TIER_ORDER list.
- OPERATOR_SUBSCRIPTION_MIN_PLAYERS constant set to 20.
- normalizeOperatorTier(value): validates tier metadata.
- getOperatorTierForPlayerCount(playerCount): computes minimum tier for a count.
- getOperatorTierForPriceId(priceId): maps Stripe operator price IDs to tier.
- getAllowedOperatorTiers(playerCount): returns minimum tier and higher tiers.
- OperatorSubscriptionEligibility type.
- getOperatorSubscriptionEligibilityForUser(storage, userId): shared eligibility resolver.

#### Active player count source of truth
Eligibility resolver calculates active players as:

- rosterPlayerCount = active hall roster size from storage.getRosterByHall(hallId)
- subscriptionPlayerCount = existing operator subscription playerCount (if present)
- activePlayerCount = max(rosterPlayerCount, subscriptionPlayerCount)

This prevents checkout from being blocked by stale or underreported values if one source lags the other.

### 3.2 Checkout hard enforcement
Updated createCheckoutSession(storage):

- Detects operator subscription checkout based on productType, tier metadata, or operator price IDs.
- Requires authenticated dbUser.
- Enforces role gate: OPERATOR or OWNER only.
- Resolves eligibility via shared resolver.
- Rejects with HTTP 400 if activePlayerCount < 20.
- Rejects with HTTP 400 if selected tier is below minimum allowed tier.
- On pass, normalizes/overwrites metadata for integrity:
  - metadata.tier
  - metadata.operatorId
  - metadata.hallId
  - metadata.activePlayerCount

Error payloads include machine-usable fields such as code, minPlayers, activePlayerCount, minimumAllowedTier, allowedTiers.

### 3.3 New shared eligibility endpoint
Added controller:

- getOperatorSubscriptionEligibility(storage)

Behavior:
- Requires authenticated user.
- Requires OPERATOR or OWNER role.
- Returns activePlayerCount, minPlayers, meetsMinimumPlayers, minimumAllowedTier, allowedTiers, and count breakdown fields.

### 3.4 Route registration
File: server/routes/financial.routes.ts

Added route:

- GET /api/operator-subscriptions/eligibility

Important ordering note:
- Registered before /api/operator-subscriptions/:operatorId to avoid route-parameter shadowing.

## 4) Frontend Implementation

### 4.1 File: client/src/pages/OperatorSubscriptions.tsx

Replaced local tier-gating logic with backend-provided eligibility data.

#### New client model
- Added OperatorSubscriptionEligibility interface matching API response.

#### Data source update
- Removed direct roster-based gate calculation in page logic.
- Added query to GET /api/operator-subscriptions/eligibility.

#### UI behavior changes
- Displays active player count from backend eligibility payload.
- Displays threshold requirement using minPlayers from backend.
- Displays minimum allowed tier from backend.
- Enables/disables each tier button based on allowedTiers returned by backend.

This removes client/server rule drift and keeps policy centralized.

## 5) Security and Integrity Outcomes

- Client payload tampering cannot bypass eligibility checks.
- Tier selection is validated against authoritative server rules.
- Unauthorized roles cannot start operator hall subscriptions.
- UI and API now use a single source of truth for eligibility policy.

## 6) API Behavior Summary

### 6.1 GET /api/operator-subscriptions/eligibility
Success payload fields:
- activePlayerCount
- rosterPlayerCount
- subscriptionPlayerCount
- minPlayers
- meetsMinimumPlayers
- minimumAllowedTier
- allowedTiers

### 6.2 POST /api/billing/checkout (operator subscription path)
Possible outcomes:
- 401: authentication missing
- 403: non-operator/non-owner role
- 400: below minimum players
- 400: selected tier below allowed minimum tier
- 200: checkout session created

## 7) Verification Performed

Checked edited files for Problems/compile issues:
- server/controllers/financial.controller.ts: no errors
- server/routes/financial.routes.ts: no errors
- client/src/pages/OperatorSubscriptions.tsx: one pre-existing lint rule warning for inline styles in TierCard component

## 8) Files Changed

- server/controllers/financial.controller.ts
- server/routes/financial.routes.ts
- client/src/pages/OperatorSubscriptions.tsx

## 9) Recommended Follow-Up Tests

1. Operator with 0 to 19 active players
- Expect all plan buttons disabled in UI
- Expect checkout API to return 400 with min player error code

2. Operator with 20 to 25 active players
- Expect medium, large, mega enabled
- Expect small blocked by API

3. Operator with 26 to 40 active players
- Expect large and mega enabled
- Expect medium/small blocked by API

4. Operator with 41 or more active players
- Expect only mega enabled
- Expect lower tiers blocked by API

5. Non-operator account
- Expect 403 on eligibility and/or checkout operator path

## 10) Final Result

The operator subscription flow now strictly enforces:
- a 20-player minimum gate, and
- a minimum tier floor based on active player count,
with centralized server-side policy and client alignment to that policy.
