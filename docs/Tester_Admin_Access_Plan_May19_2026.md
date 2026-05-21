# Tester Admin Access Plan

Date: May 19, 2026
Environment: Staging or non-production test environment only
Owner: Engineering lead or designated platform admin

## 1) Objective
Provide testers with elevated access needed for deep testing while minimizing security and data-integrity risk.

## 2) Access Strategy
Do not use one shared admin login.

Use separate accounts:
- one account per tester
- one baseline PLAYER account for comparison checks
- optional OWNER account only for explicitly owner-only tests

## 3) Account Matrix (Recommended)

| Account | Assigned To | Role | Purpose |
|---|---|---|---|
| `qa-ux-operator` | UI/UX tester | OPERATOR | Validate hall operations UX and operator flows |
| `qa-fs-trustee` | Full-stack tester | TRUSTEE | Validate high-privilege controls and governance flows |
| `qa-player-baseline` | Shared baseline account | PLAYER | Validate normal user path and permission boundaries |
| `qa-owner-breakglass` | Engineering only | OWNER | Owner-only verification when strictly required |

## 4) Credential and Security Policy
- Use unique passwords per account.
- Store credentials in your approved secrets manager, not in docs, chat logs, or screenshots.
- Force password reset at first login if supported.
- Enable MFA for TRUSTEE and OWNER accounts if available.
- Never reuse these credentials in production.

## 5) Provisioning Steps (Operator)
1. Create user account with clear QA naming convention.
2. Assign target role.
3. Verify role assignment persisted after refresh/logout/login.
4. Confirm expected menu visibility for that role.
5. Attempt one disallowed action to confirm permission boundary.
6. Record account creation date, owner, and expiry date.

## 6) First Login Procedure (Tester)
1. Sign in with assigned account.
2. Confirm displayed role and dashboard scope.
3. Capture first-login screenshot for audit trail.
4. Verify one allowed action and one blocked action.
5. Start testing sequence from the handoff report.

## 7) Required Access Boundary Checks
Every tester should perform these boundary checks before deep testing:
- Anonymous cannot access protected routes.
- PLAYER cannot access operator/trustee pages.
- OPERATOR cannot access trustee-only governance flows.
- TRUSTEE can access governance flows but still sees validation guards.
- OWNER-only controls remain hidden/inaccessible for non-owner accounts.

## 8) Logging and Accountability
- Every issue report must include account used and role.
- For admin-risk actions, include timestamp and exact route.
- If action history/audit logs exist, record relevant entry IDs.

## 9) Rotation and Decommissioning
- Set expiry for all tester admin accounts at end of test cycle.
- Rotate passwords immediately if credentials leak or are shared unintentionally.
- Disable or delete test admin accounts after sign-off.
- Keep baseline PLAYER account only if next cycle starts within 7 days.

## 10) Go / No-Go Checklist Before Test Start
- [ ] Separate accounts created (no shared admin account)
- [ ] Roles assigned and verified across re-login
- [ ] Credential handling policy communicated
- [ ] Boundary checks completed
- [ ] Expiry/decommission date scheduled
- [ ] Handoff and deep-dive guides distributed to testers

## 11) Fast Execution Summary
Minimum setup to start today:
1. Create `qa-ux-operator` as OPERATOR.
2. Create `qa-fs-trustee` as TRUSTEE.
3. Create `qa-player-baseline` as PLAYER.
4. Reserve `qa-owner-breakglass` for engineering-controlled owner tests only.
5. Run boundary checks in Section 7, then begin deep testing.