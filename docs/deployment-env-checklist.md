# Deployment Env Checklist

Use this checklist to satisfy the remaining deployment blockers found by `npm run test:deploy`.

## Required Vars (Blocking)

- REPLIT_DOMAINS
  - Expected format: comma-separated domains, for example:
    - your-app.replit.app
    - your-custom-domain.com
  - Purpose: production CORS / host allowlist checks.

- REPL_ID
  - Expected format: your Replit app identifier (string).
  - Purpose: runtime environment wiring in production.

- STRIPE_SECRET_KEY
  - Must be a valid production key for production deploys:
    - starts with sk_live_
  - Current validator status: flagged weak/test-like.

## Required Vars (Already Passing Validator)

- STRIPE_WEBHOOK_SECRET
- SESSION_SECRET
- DATABASE_URL
- SMALL_PRICE_ID
- MEDIUM_PRICE_ID
- LARGE_PRICE_ID
- MEGA_PRICE_ID
- PLAYER_ROOKIE_MONTHLY_PRICE_ID
- PLAYER_STANDARD_MONTHLY_PRICE_ID
- PLAYER_PREMIUM_MONTHLY_PRICE_ID

## Recommended Additional Stripe Vars (If Used In Your Flows)

- PLAYER_ROOKIE_YEARLY_PRICE_ID
- PLAYER_STANDARD_YEARLY_PRICE_ID
- PLAYER_PREMIUM_YEARLY_PRICE_ID

## Safe Example Template

Do not copy these literal values into production.

REPLIT_DOMAINS=your-app.replit.app
REPL_ID=your-repl-id
SESSION_SECRET=replace-with-32-plus-random-characters
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
STRIPE_SECRET_KEY=sk_live_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me
SMALL_PRICE_ID=price_replace_me
MEDIUM_PRICE_ID=price_replace_me
LARGE_PRICE_ID=price_replace_me
MEGA_PRICE_ID=price_replace_me
PLAYER_ROOKIE_MONTHLY_PRICE_ID=price_replace_me
PLAYER_STANDARD_MONTHLY_PRICE_ID=price_replace_me
PLAYER_PREMIUM_MONTHLY_PRICE_ID=price_replace_me

## Verify After Setting

1. Run build:
   - npm.cmd run build
2. Run deploy checklist:
   - npm.cmd run test:deploy
3. Confirm no remaining blocking items in the output.

## Notes

- This project currently builds to:
  - dist/index.js (server)
  - dist/public/index.html (client)
- The deployment checklist script was updated to validate this layout.
