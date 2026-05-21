# Tester Report Triage - May 21, 2026

## Scope
This document converts the tester feedback into prioritized implementation tickets.

## P0 - Critical (Fix Immediately)

### P0-1: Escrow challenge cancel endpoint returns 404
- Symptom: Cancel action calls `/api/escrow-challenges/:id/cancel` and gets 404.
- Impact: Core challenge workflow is broken.
- Root cause: Route/controller missing on backend.
- Fix: Add route and controller handler for cancel.
- Status: Completed in this pass.

### P0-2: Poster generation endpoint mismatch
- Symptom: UI calls `/api/posters` and gets 404.
- Impact: Poster generation unusable.
- Root cause: Backend mounted at `/api/poster` only.
- Fix: Add `/api/posters` alias (or update client paths consistently).
- Status: Completed in this pass.

### P0-3: Competition action buttons are dead clicks
- Symptom: Challenge/lock/view pool buttons on ladder pages do nothing.
- Impact: Blocks user navigation into challenge workflows.
- Root cause: Missing click handlers.
- Fix: Wire buttons to working destinations.
- Status: Completed in this pass.

## P1 - High

### P1-1: Raw backend error payloads shown in toasts
- Symptom: Login/tournament and other screens can show raw backend body.
- Impact: Internal detail leakage, poor UX.
- Fix: Standardize API error parsing to use safe `message`/`error` text only.
- Status: Completed in this pass (query client parser hardened).

### P1-2: AI unavailable message exposes env var name
- Symptom: Message references `OPENAI_API_KEY` directly.
- Impact: Internal configuration detail shown to end users.
- Fix: Replace with neutral user-facing message.
- Status: Completed in this pass.

### P1-3: Challenge accept appears to spin without clear feedback
- Symptom: Accept action may appear to do nothing when errors occur.
- Impact: User uncertainty and failed workflow recovery.
- Fix: Add explicit onError toast in challenge accept flow and verify endpoint behavior in production.
- Status: Pending.

## P2 - Medium

### P2-1: Signup dropdown layering/visibility issue
- Symptom: Dropdown menus render behind surrounding UI.
- Impact: Poor signup usability.
- Fix: Raise dropdown layer (`z-index`) in signup/auth screens.
- Status: In progress.

### P2-2: Tournament bracket UX issues
- Symptom: Bracket type buttons disappear; missing add-player validation feedback.
- Impact: Confusing bracket setup.
- Fix: Preserve selected-state visibility; add empty input validation message.
- Status: Pending.

### P2-3: Hall battles locked state validation
- Symptom: Hall battles appears permanently locked.
- Impact: Feature perceived as broken.
- Fix: Validate feature flag/unlock conditions and show actionable lock reason.
- Status: Pending.

## P3 - Low / Polish

### P3-1: Verification link uses host-style backend URL
- Symptom: Verification links expose hosting domain and API path.
- Impact: Branding/trust concern (not an inherent vulnerability by itself).
- Fix: Move to branded domain and optionally front-end verification landing route.
- Status: Pending.

### P3-2: Mobile responsiveness defects in media/poster pages
- Symptom: Text overlap and button label overflow.
- Impact: Mobile UX quality issue.
- Fix: Responsive pass for small breakpoints.
- Status: Pending.

## Verification Checklist
- [ ] Cancel challenge no longer returns 404.
- [ ] Poster generation endpoint resolves without 404.
- [ ] Ladder CTA buttons navigate to working tabs.
- [ ] UI toasts no longer expose raw JSON payloads.
- [ ] AI unavailable message is user-safe and non-technical.
- [ ] Signup dropdowns are fully visible over labels and cards.
