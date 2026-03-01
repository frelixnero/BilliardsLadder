# State Machines — ActionLadder

## 1. Subscription / Membership State

```
┌──────────┐    checkout.session.completed     ┌──────────┐
│   none   │ ─────────────────────────────────▶│  active  │
└──────────┘                                    └──────────┘
                                                     │  │
                              customer.subscription  │  │  invoice.payment_failed
                              .deleted               │  │
                                                     ▼  ▼
                                               ┌──────────────┐
                                               │ past_due /   │
                                               │  canceled    │
                                               └──────────────┘
```

**States:** `none` | `rookie` | `basic` | `pro` | `past_due` | `canceled`

**Transitions:**
| Event | From → To |
|---|---|
| `checkout.session.completed` | `none` → `rookie/basic/pro` |
| `invoice.paid` | `past_due` → `active` |
| `invoice.payment_failed` | `active` → `past_due` |
| `customer.subscription.deleted` | any → `none` |
| Manual cancel | any → `canceled` |

---

## 2. Escrow Challenge State

```
OPEN ──── accepted ────▶ IN_PROGRESS ──── result reported ────▶ DISPUTED
  │                          │                                       │
  │ declined / expired       │ result agreed                        │ resolved
  ▼                          ▼                                       ▼
CANCELED               COMPLETED                              RESOLVED
```

**States:** `OPEN` | `IN_PROGRESS` | `COMPLETED` | `DISPUTED` | `CANCELED` | `RESOLVED`

**Transitions:**
| Action | From → To | Side effect |
|---|---|---|
| Challenger creates | → `OPEN` | Escrow held |
| Opponent accepts | `OPEN` → `IN_PROGRESS` | |
| Opponent declines / timeout | `OPEN` → `CANCELED` | Escrow released to challenger |
| Result reported (both agree) | `IN_PROGRESS` → `COMPLETED` | Winner paid out, loser fee deducted |
| Result disputed | `IN_PROGRESS` → `DISPUTED` | Admin notified |
| Admin resolves | `DISPUTED` → `RESOLVED` | Manual payout |
| No-show timeout | `IN_PROGRESS` → `CANCELED` | Forfeit rules applied |

---

## 3. Tournament State

```
REGISTRATION_OPEN ──▶ REGISTRATION_CLOSED ──▶ IN_PROGRESS ──▶ COMPLETED
        │                                                          │
        │ canceled any time                                        │
        └──────────────────────── CANCELED ◀───────────────────────
```

**States:** `registration_open` | `registration_closed` | `in_progress` | `completed` | `canceled`

**Calcutta Auction** (happens during REGISTRATION_OPEN):
- Players listed → Bidding opens → Highest bidder owns the player's calcutta slot
- `in_progress` locks calcutta; results flow into calcutta payout

---

## 4. Hall Battle State

```
LOCKED (default) ──── trustee unlocks ────▶ UNLOCKED
     ▲                                          │
     └────────────── trustee locks ─────────────┘
```

**Default:** All new halls start LOCKED. Hall battles require explicit trustee unlock.
See `server/controllers/hall.controller.ts` → `unlockHallBattles()`.

---

## 5. Ladder Challenge State

```
PENDING ──── accepted ────▶ IN_PROGRESS ──── result ────▶ COMPLETED
    │                                                          │
    │ declined / 48h timeout                                   │ points/rank updated
    ▼                                                          ▼
DECLINED / EXPIRED                                     WINNER promoted, LOSER adjusted
```

**Weight Handicap Rules:**
- 2 consecutive losses to same higher-ranked player → challenger receives handicap advantage
- 3 consecutive losses → opponent owes 1.5× entry fee OR handicap points

---

## 6. Player Career / Service State

```
INACTIVE ──── player creates ────▶ PENDING ──── player activates ────▶ ACTIVE
                                                      │
                                                      │ expires / cancels
                                                      ▼
                                                  COMPLETED
```
