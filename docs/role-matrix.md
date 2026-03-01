# Role Matrix — ActionLadder

## Roles (hierarchy, highest to lowest)

| Role | Description |
|---|---|
| `OWNER` | Full access to everything — platform owner |
| `TRUSTEE` | Can unlock hall battles, manage operators, revenue config |
| `OPERATOR` | Manages their hall/venue — subscriptions, settings, players |
| `STAFF` | Venue staff — can manage check-ins, basic admin tasks |
| `PLAYER` | Default role for all registered players |
| (anonymous) | Public pages only |

---

## Permission Matrix

| Permission | OWNER | TRUSTEE | OPERATOR | STAFF | PLAYER |
|---|:---:|:---:|:---:|:---:|:---:|
| **Auth** |||||
| Login / register | ✅ | ✅ | ✅ | ✅ | ✅ |
| Change own password | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Ladder** |||||
| View ladder | ✅ | ✅ | ✅ | ✅ | ✅ |
| Issue challenge | ✅ | ✅ | ✅ | ✅ | ✅ |
| Accept challenge | ✅ | ✅ | ✅ | ✅ | ✅ |
| Report match result | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Tournaments** |||||
| View tournaments | ✅ | ✅ | ✅ | ✅ | ✅ |
| Register for tournament | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create tournament | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage brackets | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Billing / Payments** |||||
| Subscribe (player plans) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create escrow challenge | ✅ | ✅ | ✅ | ✅ | ✅ |
| Process payouts | ✅ | ✅ | ✅ | ❌ | ❌ |
| View revenue dashboard | ✅ | ✅ | ✅ | ❌ | ❌ |
| Configure revenue / fees | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Hall Battles** |||||
| View hall battles | ✅ | ✅ | ✅ | ✅ | ✅ |
| Unlock hall battles | ✅ | ✅ | ❌ | ❌ | ❌ |
| Lock hall battles | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Operator** |||||
| Manage operator settings | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage operator subscriptions | ✅ | ✅ | ✅ | ❌ | ❌ |
| View operator analytics | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Admin** |||||
| View admin dashboard | ✅ | ✅ | ✅ | ✅ | ❌ |
| Resolve alerts | ✅ | ✅ | ✅ | ✅ | ❌ |
| Ban / manage players | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage all halls | ✅ | ✅ | ❌ | ❌ | ❌ |
| Configure training rewards | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Revenue Admin** |||||
| View revenue config | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit commission rates | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Platform** |||||
| Access Replit Object Storage | ✅ | ❌ | ❌ | ❌ | ❌ |
| Modify global settings | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## How Permissions Are Enforced

```typescript
// server/middleware/auth.ts
export const isAuthenticated: RequestHandler // checks req.isAuthenticated()
export const requireRole = (roles: GlobalRole[]): RequestHandler

// Usage in routes:
router.post('/unlock-battles', isAuthenticated, requireRole(['OWNER', 'TRUSTEE']), handler);
```

---

## Fee Rates by Membership

| Membership | League Fee Rate | Tournament Entry | Monthly Cost |
|---|---|---|---|
| None | 15% | $30 | Free |
| Rookie | 10% | $27 | $20/mo |
| Basic | 5% | $25–30 | $25/mo |
| Pro (580+ Fargo) | 3% | FREE | $60/mo ($50 effective with 2 tutoring sessions) |
