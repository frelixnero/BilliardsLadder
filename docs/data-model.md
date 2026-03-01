# Data Model — ActionLadder

> Source of truth: `shared/schema.ts` (Drizzle ORM definitions)
> Database: PostgreSQL (Neon serverless)

---

## Core Tables

### users
| Column | Type | Notes |
|---|---|---|
| id | text PK | Replit user ID |
| email | text | |
| firstName | text | |
| lastName | text | |
| profileImageUrl | text | |
| globalRole | text | `PLAYER \| STAFF \| OPERATOR \| TRUSTEE \| OWNER` |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### sessions
| Column | Type | Notes |
|---|---|---|
| sid | varchar PK | Session ID |
| sess | jsonb | Session data |
| expire | timestamp | |

---

## Player Domain

### players
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| userId | text FK→users | nullable (for guest players) |
| name | text | Display name |
| email | text | |
| phone | text | |
| city | text | |
| rating | int | Fargo-style rating |
| points | int | Ladder points |
| member | boolean | Has active membership |
| membershipTier | text | `none\|rookie\|basic\|pro` |
| streak | int | Current win streak |
| respectPoints | int | Sportsmanship metric |
| theme | text | Player's personal motto/theme |
| specialStatus | text | e.g., "Hall Champion" |
| achievements | text[] | Array of achievement keys |
| weightOwed | boolean | Handicap owed from consecutive losses |
| consecutiveLosses | int | To same higher-ranked player |
| subscriptionId | text | Stripe subscription ID |
| customerId | text | Stripe customer ID |
| createdAt | timestamp | |

### player_services
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| playerId | int FK→players | |
| serviceType | text | |
| status | text | `INACTIVE\|PENDING\|ACTIVE\|COMPLETED` |
| price | numeric | |
| createdAt | timestamp | |

---

## Ladder / Match Domain

### matches
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| challenger | int FK→players | |
| opponent | int FK→players | |
| winner | int FK→players | nullable until decided |
| status | text | `PENDING\|IN_PROGRESS\|COMPLETED\|CANCELED` |
| entryFee | numeric | |
| escrowAmount | numeric | |
| division | text | `HI\|LO\|BARBOX\|EIGHTFOOT` |
| scheduledAt | timestamp | |
| completedAt | timestamp | |
| createdAt | timestamp | |

### match_entries
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| matchId | int FK→matches | |
| playerId | int FK→players | |
| fee | numeric | Commission amount |
| createdAt | timestamp | |

### match_divisions
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| name | text | |
| minRating | int | |
| maxRating | int | nullable (no cap) |
| entryFee | numeric | |
| createdAt | timestamp | |

---

## Tournament Domain

### tournaments
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| name | text | |
| format | text | `SINGLE_ELIM\|DOUBLE_ELIM\|ROUND_ROBIN` |
| status | text | `registration_open\|registration_closed\|in_progress\|completed\|canceled` |
| entryFee | numeric | |
| prizePool | numeric | |
| addedMoney | numeric | Operator-added money |
| maxPlayers | int | |
| startDate | timestamp | |
| createdAt | timestamp | |

### tournament_entries
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| tournamentId | int FK | |
| playerId | int FK | |
| seed | int | nullable |
| calcuttaOwnerId | int FK→players | nullable — who bought them at auction |
| createdAt | timestamp | |

### tournament_calcuttas
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| tournamentId | int FK | |
| totalPool | numeric | |
| status | text | `open\|closed\|paid` |

### calcutta_bids
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| calcuttaId | int FK | |
| bidderId | int FK→players | |
| targetPlayerId | int FK→players | |
| amount | numeric | |
| createdAt | timestamp | |

---

## Financial Domain

### ledger
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| playerId | int FK | |
| type | text | `CREDIT\|DEBIT` |
| amount | numeric | |
| description | text | |
| relatedMatchId | int | nullable |
| createdAt | timestamp | |

### wallets
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| playerId | int FK | UNIQUE |
| balance | numeric | |
| updatedAt | timestamp | |

### payout_distributions
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| matchId | int FK | |
| playerId | int FK | |
| amount | numeric | |
| type | text | `WINNINGS\|REFUND\|COMMISSION` |
| createdAt | timestamp | |

---

## Operator Domain

### halls (pool halls / venues)
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| name | text | |
| city | text | |
| ownerId | text FK→users | |
| battlesUnlocked | boolean | Default false |
| unlockedBy | text | nullable |
| unlockedAt | timestamp | nullable |
| seatLimit | int | Max operators |
| createdAt | timestamp | |

### operator_subscriptions
| Column | Type | Notes |
|---|---|---|
| id | serial PK | |
| hallId | int FK | |
| tier | text | `SMALL\|MEDIUM\|LARGE\|MEGA` |
| stripeSubscriptionId | text | |
| status | text | |
| createdAt | timestamp | |

---

## Indexes & Constraints

- `players.userId` — indexed (frequent lookup by auth user)
- `matches.challenger`, `matches.opponent` — indexed (leaderboard queries)
- `ledger.playerId` — indexed (earnings history)
- `sessions.expire` — indexed (cleanup queries)
- Foreign keys enforced at DB level via Drizzle `references()`

---

## Schema Changes

```bash
# After editing shared/schema.ts:
npm run db:push        # push schema to Neon (dev)

# For production migrations, use Drizzle migrate:
npx drizzle-kit generate  # generates SQL migration files
npx drizzle-kit migrate   # applies them
```
