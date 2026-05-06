# Action Ladder Billiards

Action Ladder Billiards is a competitive billiards tournament ladder system with live streaming, secure payments, and an AI billiards coach.

## Run & Operate

*   **Run**: `npm start` (Frontend) or `npm run dev` (Backend)
*   **Build**: `npm run build`
*   **Typecheck**: `npm run typecheck`
*   **Codegen**: _Populate as you build_
*   **DB Push**: `npx prisma db push` (for PostgreSQL)

**Required Environment Variables**: `SENDGRID_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

## Stack

*   **Frontend**: React 18, TypeScript, Wouter, TanStack Query, Tailwind CSS
*   **Backend**: Express.js, TypeScript, in-memory storage (MemStorage), PostgreSQL (optional)
*   **Mobile**: React Native (Expo WebView wrapper)
*   **ORM**: _Populate as you build_
*   **Validation**: _Populate as you build_
*   **Build Tool**: Vite

## Where things live

*   `/src/` - Frontend source code
*   `/server/` - Backend source code
*   `/mobile/` - React Native mobile app source code
*   `/prisma/schema.prisma` - Database schema (PostgreSQL)
*   `server/controllers/financial.controller.ts` - Stripe price ID configuration
*   `server/middleware/auth.ts`, `server/replitAuth.ts` - API Authentication guards
*   `server/services/rackPointsService.ts` - Rack Points service logic
*   `server/services/notifyService.ts` - In-app notification fire-and-forget helpers
*   `server/routes/me.routes.ts` - Authenticated `/api/me/*` routes (rack points, notifications)
*   `server/utils/ownership.ts` - Ownership helper functions for IDOR fixes
*   `server/utils/SafeText.ts` - Language sanitization logic
*   `src/components/SafeText.tsx` - React component for language sanitization

## Architecture decisions

*   **Credit-based Challenge Pool**: Implemented with pre-funding and tiered service fees to prevent "ghosting" and encourage commitment.
*   **AI Billiards Coach**: Utilizes Dr. Dave's physics rules to provide granular shot analysis and improvement insights.
*   **Three-tier Authentication**: Supports Creator/Owner, Operator, and Player roles with distinct access levels, including 2FA for Creators.
*   **Language Sanitization**: Automatic system to replace gambling-related terms with league-safe terminology, enforced via middleware.
*   **WebView Mobile App**: Uses React Native with Expo as a WebView wrapper for the web app, integrating native features like camera for OCR and push notifications.
*   **In-app Notifications**: New `notifications` table separate from `notificationDeliveries` (which tracks outbound email/SMS provider routing). `notifyService` is the single chokepoint — all helpers fire-and-forget via `safeCreate` so a failed notification never blocks the primary write. Client polls `/api/me/notifications` every 30s; cache key is scoped to the current user id to prevent leak across logout/login.

## Product

*   **Player Ladder System**: Tracks rankings, points, wins, and losses.
*   **Challenge Pool**: Credit-based challenge system with anti-ghosting measures.
*   **AI Billiards Coach**: Provides shot analysis, scoring, and monthly leaderboards.
*   **Live Streaming Integration**: Multi-platform support (Twitch, YouTube, Facebook, TikTok, Kick) with geographic filtering.
*   **Financial Features**: Supports varied entry fees, tiered league memberships, and a side betting system with closed-loop funds.
*   **Ban/Suspension & Appeal System**: Comprehensive admin controls for user status and a user-facing appeal process.
*   **Rack Points Gamification**: Lightweight system for earning points through login, match wins, and upset bonuses.
*   **Notification Bell**: In-app notifications for new challenges, accepted challenges, match results, and account status changes (bans/suspensions).

## User preferences

*   **Communication Style**: Concise, professional, no emojis in code
*   **Code Style**: TypeScript strict mode, functional components, proper error handling
*   **Theme**: Dark mode preferred, green accent colors for billiards aesthetic

## Gotchas

*   **Stripe Price IDs**: Hardcoded in `server/controllers/financial.controller.ts`. Do not rely on environment variables for these.
*   **API Authentication**: All new routes must have explicit authentication guards. Public exceptions require comments with justification.
*   **Ownership Checks**: User-specific data access requires `requireSelfOrStaff` or `requireSelfPlayerOrStaff` to prevent IDOR vulnerabilities.
*   **Wallet Top-Up Hardening**: `completeTopUp` verifies Stripe PaymentIntent metadata for integrity.
*   **Email Verification**: New user signups require email verification unless they use OAuth or are Owner/Staff.
*   **Notification calls are fire-and-forget**: Always call `notifyService` helpers without `await`. Errors are swallowed inside `safeCreate`. Never let a notification failure rollback or block a primary action.
*   **Notification cache key must include user id**: Per-user query keys prevent cached notifications from leaking across login transitions. Use `notificationsKey(currentUserId)` if adding new mutations.

## Pointers

*   **Stripe API Documentation**: [https://stripe.com/docs/api](https://stripe.com/docs/api)
*   **SendGrid Documentation**: [https://docs.sendgrid.com/](https://docs.sendgrid.com/)
*   **tesseract.js Documentation**: [https://tesseract.projectnaptha.com/](https://tesseract.projectnaptha.com/)
*   **React Documentation**: [https://react.dev/](https://react.dev/)
*   **Express.js Documentation**: [https://expressjs.com/](https://expressjs.com/)