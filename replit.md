# Action Ladder Billiards

## Overview
Action Ladder Billiards is a dark, gritty billiards tournament ladder system aiming to redefine the competitive billiards scene. It integrates live streaming, secure Stripe payment processing, and comprehensive player support features. The project's vision is to foster a vibrant, engaged community around billiards, offering not just competition but also player development, financial incentives, and social responsibility. Key capabilities include a robust player ranking system, a credit-based challenge pool with anti-ghosting measures, and an innovative AI billiards coach. The project targets both casual players and high-stakes enthusiasts, providing a platform for skill development, community interaction, and competitive play with significant market potential in the digital sports and entertainment sector.

## User Preferences
- **Communication Style**: Concise, professional, no emojis in code
- **Code Style**: TypeScript strict mode, functional components, proper error handling
- **Theme**: Dark mode preferred, green accent colors for billiards aesthetic

## System Architecture
The system is built on a modern web stack designed for performance, scalability, and a unique user experience.

### UI/UX Decisions
- **Aesthetic**: Dark, gritty green theme representing a pool hall atmosphere.
- **Color Scheme**: Black backgrounds with bright green (#00ff00) accents.
- **Typography**: Monospace fonts for an underground tech feel.
- **QR Code Join Flow**: Facilitates easy player registration via mobile devices.
- **Automated Poster Generator**: One-click creation of event posters.

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Wouter for routing, and TanStack Query for data fetching.
- **Backend**: Express.js, primarily utilizing in-memory storage (MemStorage) with a PostgreSQL database available for persistent data.
- **Mobile App**: React Native with Expo, functioning as a WebView wrapper for the web application, incorporating native features like camera access for OCR, push notifications, and location services.
- **Styling**: Tailwind CSS with a custom dark theme.
- **Challenge Pool System**: Features credit-based entries, wallet management, configurable challenge markets, automated resolution, and a transaction ledger. Includes anti-ghosting protection via pre-funding and a tiered service fee structure.
- **AI Billiards Coach**: Integrates Dr. Dave's physics rules for shot analysis, provides insights on overdraw, spin bias, break accuracy, and other techniques. It includes a scoring formula for improvement and monthly leaderboards.
- **Authentication**: A three-tier system with Creator/Owner, Operator, and Player roles, supporting password login and 2FA for Creator accounts.
- **Language Sanitization**: An automatic system replaces gambling terms with league-safe terminology across the application, enforced via middleware and a SafeText React component.
- **Live Streaming**: Multi-platform integration (Twitch, YouTube, Facebook, TikTok, Kick) with geographic filtering and stream categories.

### Feature Specifications
- **Player Ladder System**: Tracks rankings, points, wins, and losses.
- **Special Events**: Supports birthday bonuses, charity nights, and player support programs (e.g., "Player in Need Rule").
- **Respect Points System**: Community recognition for sportsmanship.
- **Side Betting System**: Credit-based wagering with closed-loop funds.
- **Financial Features**: Entry ranges from $60 to $500,000 for high-stakes players. League fees are 5% for members, 15% for non-members. Membership tiers include Basic ($25/month) and Pro ($60/month).
- **Automated Rewards**: The AI Coach system includes automated monthly rewards for top trainers, offering Stripe subscription discounts.

## External Dependencies
- **Payment Processing**: Stripe (Checkout Sessions API for one-time payments, subscriptions, and webhooks).
- **Streaming Platforms**: Twitch, YouTube, Facebook, TikTok, Kick (for live streaming integration).
- **Email Notifications**: SendGrid (for admin summaries and notifications related to rewards).
- **OCR**: tesseract.js (for optical character recognition capabilities within tournament features).
- **Database**: PostgreSQL (available as an option, currently in-memory storage is used for core data).

## Stripe Configuration
- **Account**: `acct_1RzCXFDc2BliYufw` (blazn03@gmail.com, "Action Ladder sandbox")
- **Price IDs are hardcoded with correct fallbacks** in `server/controllers/financial.controller.ts` (no env vars needed)
- Player subscriptions: Rookie $25.99/mo, Basic $35.99/mo, Pro $59.99/mo
- Operator halls: Small $199/mo, Medium $299/mo, Large $499/mo, Mega $799/mo
- Charity donations: $5, $10, $25, $50, $100, $250, $500 (one-time)
- Player billing (`/api/player-billing/checkout`) uses dynamic `price_data` — does not rely on pre-created price IDs
- Generic billing (`/api/billing/checkout`) uses pre-created price IDs from the hardcoded `prices` object
- All billing endpoints require authentication
- Webhook endpoint: `POST /api/stripe/webhook` with signature verification

### Ban/Suspension System
- Admin endpoints: `POST /api/admin/users/:id/ban`, `/suspend`, `/unban`, `GET /api/admin/bans`, `GET /api/admin/users`
- `accountStatus` field on users: "active", "suspended", "banned", "pending"
- Ban fields: `banReason`, `bannedAt`, `bannedBy`, `banExpiresAt`
- Middleware order: isAuthenticated → ban/suspend check → role check (no info leakage)
- Banned users blocked at login with clear message and reason
- Suspended users auto-reactivate when `banExpiresAt` passes
- Owner accounts cannot be banned
- Email notifications sent on ban/suspend/unban (via SendGrid)
- Admin dashboard "Users & Bans" tab with search, ban dialog, and banned users list

### Ban Appeal System
- `banAppeals` table: id, userId, userEmail, userName, reason, supportingContext, status (pending/approved/denied), adminResponse, reviewedBy, reviewedAt, createdAt
- Appeal endpoints: `POST /api/appeals` (public, no auth required since banned users can't authenticate), `GET /api/admin/appeals`, `GET /api/admin/appeals/user/:userId`, `POST /api/admin/appeals/:id/review`
- Banned/suspended users see ban notification screen at login with "Appeal This Decision" button
- Appeal form captures reason and optional supporting context
- Only one pending appeal allowed per user at a time
- Admin dashboard "Appeals" tab shows pending/all appeals with approve/deny actions and optional admin response
- Approving an appeal automatically reinstates the user (sets accountStatus to "active", clears ban fields)
- Email notifications sent to admins on appeal submission, and to users on approval/denial

### Email Verification
- Uses SendGrid API (`@sendgrid/mail`) with `SENDGRID_API_KEY` secret
- From address: `osiraogene@gmail.com` (verified Single Sender in SendGrid)
- Signup sets `emailVerified=false`, sends verification email with 24hr token
- Login blocks unverified users with resend option
- OAuth users automatically marked as verified
- Owner/Staff bypass verification

## Recent Changes (Session Notes)

### Ladder Page Standardization
- All three ladder pages (9ft LadderPage, 8ft EightFootLadderPage, 7ft BarboxLadderPage) now share consistent structure: Hero → Challenger Handicap → Top 3 Podium → Contenders/Elite divisions → Games → CTA
- MembershipDisplay, pricing, and subscription upsells removed from all ladder pages (membership info belongs only in registration: PlayerSubscriptionTiers, Signup, SelectRole)
- WeightRulesDisplay (challenger handicap) improved with plain-English 3-tier explanation, present on all 3 pages
- App.tsx imports 9ft ladder from `@/pages/LadderPage` (not `@/components/ladder`)
- "Kiddie Box King" dev notes added — humorous name for 7ft table, NOT related to children

### Bug Fixes
- SafeText.tsx: Guard against undefined/non-string `children` in `sanitizeText()` (was crashing `/player/career`)
- Fixed `<a>` inside `<Link>` nesting in OwnerLogin.tsx, TrusteeLogin.tsx, ForgotPassword.tsx (wouter v2 renders its own `<a>`)
- 404 page: Replaced developer text with user-friendly message + dark theme styling
- Privacy page: Updated email from `privacy@tricityladder.com` to `privacy@actionladder.com`
- Branding: Header.tsx → "ACTIONLADDER BILLIARDS", Footer.tsx → "Action Ladder Billiards", Landing.tsx footer year → 2025

### Revenue Split
- 23% Founder, 33% Operator, 43% Player Prize Pool, 1% Platform Ops

### Challenger Fee Model
- Rookie = $0/match, Standard = $60/match, Premium = $60/match

### /join Page
- `/join` route added — renders an info page directing users to `/signup` (no backend queue API yet)
- JoinPage shows 3-step flow: Create Account → Pick Table Size → Start Competing
- "Create Account" button links to `/signup`, "Sign In" button links to `/login`
- "Join the Queue" button on 9ft LadderPage navigates to `/join`
- Queue API (`POST /api/player-queue`) not yet implemented — can be added later when needed

### Route Audit & Fixes
- **Fixed broken post-login redirects**: Login.tsx, OwnerLogin.tsx, TrusteeLogin.tsx now redirect to proper `/app?tab=...` routes instead of non-existent `/owner-dashboard`, `/trustee-dashboard`, `/operator-dashboard`, `/home`
- **Added legacy redirect routes** in App.tsx: `/home` → dashboard, `/owner-dashboard` → admin, `/trustee-dashboard` → admin, `/operator-dashboard` → operator-settings
- **Fixed server-side `tab=matches`** references in email-service.ts and tournament.controller.ts → changed to `tab=escrow-challenges`
- **Fixed `/player/services/:id`** dead link in PlayerCareerDashboard.tsx — removed navigation to non-existent route