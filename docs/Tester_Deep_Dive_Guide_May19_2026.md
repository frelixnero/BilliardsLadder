# BilliardsLadder Tester Deep-Dive Guide

Date: May 19, 2026
Audience:
- UI/UX Designer Tester
- Full-Stack Functional Tester

Companion document for tester account setup:
- `docs/Tester_Admin_Access_Plan_May19_2026.md`

## 1) Purpose
This guide prepares testers for the deep analysis phase by explaining:
- what BilliardsLadder is supposed to do
- which user roles matter
- how the major product areas fit together
- how to begin testing in a controlled order
- which production-facing features deserve break-testing after orientation

Use this guide together with `docs/Production_Testing_Handoff_Report_May8_2026.md`.

## 2) What BilliardsLadder Is
BilliardsLadder is a competitive billiards platform for players, halls, and operators. It combines league-style ladder competition with supporting tools for scheduling, tournaments, challenges, subscriptions, hall operations, media, and admin oversight.

At a high level, the product supports five recurring jobs:
- getting players into the platform and assigned the right role
- letting players compete through ladder and challenge systems
- organizing tournament and team activity
- handling subscriptions, fees, and operator business settings
- giving admins and operators tools to manage the ecosystem

## 3) Core Product Mental Model
Before testing, testers should understand the platform as a set of connected systems rather than a set of disconnected pages.

### A) Identity and Access
Every meaningful workflow depends on the current user role.

Role order:
- OWNER
- TRUSTEE
- OPERATOR
- STAFF
- PLAYER
- anonymous visitor

What to watch:
- page visibility by role
- redirects for protected pages
- actions visible but not actually permitted
- actions hidden when they should be available

### B) Competition Systems
These are the product's core gameplay surfaces.

Main areas:
- ladder divisions: 9ft, 8ft, 7ft
- rookie section
- challenge workflows
- challenge calendar
- standings and match divisions

What to watch:
- challenge creation, acceptance, decline, timeout, completion
- rank or status updates after match outcomes
- consistency across related screens showing the same competition data

### C) Event Systems
These extend competition into organized play.

Main areas:
- tournaments
- tournament brackets
- special games and special events
- team management
- team matches and team challenges

What to watch:
- registration flows
- progression from list view to detail or bracket view
- edit and management permissions by role
- empty states, late-state errors, and stale UI after updates

### D) Commercial Systems
These determine whether production usage is sustainable.

Main areas:
- player subscriptions
- checkout and billing success/cancel flows
- operator subscriptions
- revenue and monetization dashboards

What to watch:
- pricing display consistency
- subscription status changes in UI
- successful and failed checkout handling
- messaging mismatches between plan state and account state

### E) Operations and Admin Systems
These are high-risk because they affect many users and often rely on role gating.

Main areas:
- admin dashboard
- operator settings
- revenue configuration
- QR registration
- training rewards admin
- file manager

What to watch:
- sensitive actions exposed to the wrong role
- save flows that appear successful but do not persist
- destructive or important actions lacking confirmation or error recovery

### F) Community and Media Systems
These are engagement features and should still be tested for consistency and resilience.

Main areas:
- players directory
- sportsmanship
- bounties
- charity
- live stream
- poster generator
- AI features

What to watch:
- upload/generation feedback
- moderation or safe-display issues
- failed integrations handled cleanly in UI

## 4) Key Roles Testers Must Think In

### Anonymous
Use for:
- landing page checks
- auth entry points
- protected route redirect testing

Expected behavior:
- can browse public pages
- cannot use protected competition, billing, or admin functions

### PLAYER
Use for:
- ladder play
- challenges
- tournaments
- subscriptions
- profile and dashboard behaviors

Expected behavior:
- can access core competitive features
- cannot access higher-privilege admin or revenue controls

### STAFF
Use for:
- admin-lite flows
- check-in and basic management behavior
- training reward administration checks if available

Expected behavior:
- more access than a player
- still restricted from operator-only and trustee-only areas

### OPERATOR
Use for:
- hall management
- operator settings
- operator subscriptions
- venue-facing analytics and management

Expected behavior:
- operational control over hall-level features
- no access to trustee-only or owner-only global controls

### TRUSTEE and OWNER
Use for:
- high-privilege workflows
- revenue configuration
- hall unlock or governance features
- full admin visibility

Expected behavior:
- broad access, but still subject to sane validation and UX safeguards

## 5) Testing Directive for the Deep Analysis Phase
The testing order matters. Do not start by trying to break Stripe, AI, or advanced admin flows on minute one. Build product understanding first, then escalate into failure testing.

Required order:
1. Learn the product surfaces.
2. Confirm navigation and role boundaries.
3. Walk the core player journey end to end.
4. Expand into operator and admin workflows.
5. Stress critical production features.
6. Retest cross-module regressions.

## 6) Step-by-Step Familiarization Plan

### Phase 1: Orientation Pass
Goal: understand what exists before judging quality.

Steps:
1. Open the app as an anonymous user.
2. List every major navigation area visible from the landing and auth entry points.
3. Log in as a PLAYER and map the primary menus, dashboards, and tabs.
4. Repeat with OPERATOR and, if available, TRUSTEE or OWNER.
5. Note which pages are role-specific, which are shared, and which seem unfinished or integration-gated.

Deliverable:
- a tester-made screen map of the app's main modules

### Phase 2: Role and Access Pass
Goal: verify that the product's permission model matches the interface.

Steps:
1. Attempt to open protected routes while logged out.
2. Attempt to open operator or admin pages as PLAYER.
3. Attempt to open trustee-only pages as OPERATOR.
4. Confirm whether blocked pages redirect, show an error state, or incorrectly render.
5. Compare visible navigation items against actual accessible pages.

Break-focus questions:
- Is an unauthorized action merely hidden, or actually protected?
- Can a user deep-link into a page they should not reach?
- Does the UI suggest a capability that the role cannot actually complete?

### Phase 3: Core Player Journey Pass
Goal: verify the product's main value path.

Run this sequence as PLAYER:
1. Sign in.
2. Open dashboard.
3. Visit ladder divisions and rookie section.
4. Attempt a challenge-related workflow.
5. Visit standings or match-related pages.
6. Visit tournament areas and team areas.
7. Visit player subscription or billing entry points.
8. Return to dashboard and confirm state consistency.

What to check:
- navigation dead ends
- stale data after actions
- inconsistent labels or terminology between pages
- missing success, loading, or error states
- actions that appear complete but do not visibly update related screens

### Phase 4: Operator and Admin Pass
Goal: verify the product beyond the player surface.

Run this sequence as OPERATOR, then TRUSTEE or OWNER if available:
1. Open operator dashboard and settings.
2. Review operator subscriptions and monetization or revenue pages.
3. Visit admin dashboards and training rewards areas.
4. Inspect QR registration and file manager flows.
5. Check if sensitive controls are understandable, reversible, and properly validated.

What to check:
- role-gated navigation
- save or update confirmations
- visible warnings before impactful actions
- mismatches between displayed metrics and filter or state changes

### Phase 5: Integrated Production Feature Pass
Goal: move from familiarization into realistic production-risk testing.

Prioritize these areas:
1. authentication and protected routes
2. ladder and challenge progression
3. tournament registration and bracket visibility
4. subscriptions and checkout entry points
5. operator settings and revenue/admin controls
6. file upload or file manager flows
7. AI and media features

## 7) Production Features to Test, Use, and Try to Break

### Highest Priority

#### Authentication and Session Handling
Try to break by:
- opening protected URLs directly while logged out
- switching accounts and revisiting cached pages
- using browser back after logout
- refreshing during sensitive flows

Watch for:
- unauthorized access
- broken redirects
- stale user identity in the header or dashboard

#### Ladder and Challenge Flows
Try to break by:
- creating incomplete or edge-case challenge inputs
- using back/refresh mid-flow
- opening the same workflow in multiple tabs
- submitting twice quickly

Watch for:
- duplicate actions
- incorrect status transitions
- rank or record inconsistencies across pages

#### Subscription and Billing Flows
Try to break by:
- canceling checkout and returning
- re-entering billing pages after success or failure
- using plan switches or repeated clicks
- checking whether membership display updates correctly afterward

Watch for:
- checkout loops
- wrong plan labels
- success page shown without actual state change
- blocked or confusing recovery from failure

### Medium-High Priority

#### Operator and Revenue Controls
Try to break by:
- editing values at limits or with invalid formats
- leaving fields blank
- saving partial configurations
- using the wrong role to access controls

Watch for:
- invalid values accepted silently
- saved values not reflected after reload
- permissions enforced in UI but not on actual action

#### Tournament and Team Systems
Try to break by:
- moving between list, detail, and bracket pages rapidly
- using empty or partial registrations
- checking behavior when no data exists
- revisiting after an action to confirm state changed everywhere

Watch for:
- bracket or standings mismatch
- missing empty states
- hidden validation errors

#### File Manager and Upload Surfaces
Try to break by:
- unsupported file types
- large files
- canceling uploads midway
- refreshing after upload completion

Watch for:
- false success messages
- file entries with broken links or missing previews
- silent failures with no error state

### Exploratory Priority

#### AI, Poster Generation, Live Stream, Community Features
Try to break by:
- empty prompts
- long prompts or repeated generation requests
- unusual characters or unsafe content
- running generation features on slow connections

Watch for:
- unsafe rendering
- endless loading states
- errors hidden from the user
- outputs that look successful but never complete

## 8) Suggested Tester Split

### UI/UX Designer Tester
Primary lens:
- discoverability
- terminology clarity
- visual consistency
- feedback quality
- mobile and tablet usability

Use the guide to focus on:
- whether a real player can understand what to do next
- whether sensitive or complex pages create doubt or confusion
- whether error, loading, and empty states build trust

### Full-Stack Functional Tester
Primary lens:
- workflow correctness through the UI
- cross-page state consistency
- role enforcement
- network and console evidence
- integration failure handling

Use the guide to focus on:
- whether each action produces the correct visible result
- whether the same state is represented consistently across related screens
- whether failures are actual feature bugs versus environment or integration blockers

## 9) Evidence Rules During Deep Testing
For every meaningful issue captured, record:
- account role used
- exact page or URL
- preconditions
- exact steps
- expected result
- actual result
- screenshot or video
- console errors if present
- network failure summary if present
- whether the issue is reproducible, intermittent, or blocked by config

If a feature depends on Stripe, email, storage, AI, or unavailable privileged accounts, mark it `Blocked` unless the UI itself is clearly broken independent of the dependency.

## 10) Recommended Daily Execution Rhythm
Use this rhythm to keep both testers aligned.

Morning:
1. pick one primary module group
2. run familiarization or deep functional pass
3. log issues immediately with evidence

Midday:
1. compare findings between UX and functional perspectives
2. identify overlap issues versus unique findings
3. retest any quick fixes if a new build is provided

End of day:
1. summarize modules covered
2. summarize pass, fail, partial, blocked totals
3. list the highest-risk unresolved issues
4. identify what should be tested next

## 11) Exit Criteria for the Deep Analysis Phase
The deep analysis phase is complete when testers can confidently answer:
- What are the platform's core user journeys?
- Which modules are production-critical?
- Which role boundaries are reliable or broken?
- Which issues are UX problems, functional bugs, or integration blockers?
- Which production-facing features are stable enough for harder stress testing?

## 12) Final Reminder
Do not treat the app as a collection of unrelated pages. Test it as a connected operating system for billiards competition, hall management, and subscription-backed platform activity. The most valuable findings will usually come from cross-page inconsistencies, role leakage, stale state, false-success messages, and workflows that look complete but break on the last step.