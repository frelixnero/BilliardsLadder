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