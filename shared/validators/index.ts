/**
 * shared/validators/index.ts
 *
 * Zod validators shared between server (request validation) and client (form validation).
 * These are the single source of truth for input shapes.
 *
 * Usage (server):
 *   import { createPlayerSchema } from '@shared/validators';
 *   const data = createPlayerSchema.parse(req.body);
 *
 * Usage (client):
 *   import { createPlayerSchema } from '@shared/validators';
 *   const form = useForm({ resolver: zodResolver(createPlayerSchema) });
 */

import { z } from "zod";

// ─── Utilities ────────────────────────────────────────────────────────────────

const nonEmptyString = z.string().min(1, "Required").trim();
const optionalString = z.string().trim().optional();
const positiveInt = z.number().int().positive();
const nonNegativeNumber = z.number().min(0);

// ─── Player ──────────────────────────────────────────────────────────────────

export const createPlayerSchema = z.object({
  name: nonEmptyString.max(100, "Name too long"),
  email: z.string().email("Invalid email").optional(),
  phone: optionalString,
  city: optionalString,
  rating: z.number().int().min(0).max(1000).optional().default(300),
  theme: optionalString.pipe(z.string().max(200).optional()),
});

export const updatePlayerSchema = createPlayerSchema.partial();

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;

// ─── Match / Challenge ───────────────────────────────────────────────────────

export const createMatchSchema = z.object({
  challenger: positiveInt,
  opponent: positiveInt,
  entryFee: nonNegativeNumber,
  division: z.enum(["HI", "LO", "BARBOX", "EIGHTFOOT"]).optional().default("HI"),
  scheduledAt: z.string().datetime().optional(),
});

export const reportResultSchema = z.object({
  winnerId: positiveInt,
});

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type ReportResultInput = z.infer<typeof reportResultSchema>;

// ─── Tournament ───────────────────────────────────────────────────────────────

export const createTournamentSchema = z.object({
  name: nonEmptyString.max(200),
  format: z.enum(["SINGLE_ELIM", "DOUBLE_ELIM", "ROUND_ROBIN"]).default("SINGLE_ELIM"),
  entryFee: nonNegativeNumber.default(0),
  addedMoney: nonNegativeNumber.default(0),
  maxPlayers: positiveInt.min(4).max(256).default(16),
  startDate: z.string().datetime(),
  description: optionalString,
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;

// ─── Escrow Challenge ─────────────────────────────────────────────────────────

export const createEscrowChallengeSchema = z.object({
  challengerId: positiveInt,
  opponentId: positiveInt,
  wagerAmount: nonNegativeNumber.min(1, "Wager must be at least $1"),
  gameType: z.enum(["9ball", "8ball", "10ball", "onepocket", "straight"]).default("9ball"),
  raceLength: positiveInt.min(1).max(25).default(7),
  notes: optionalString.pipe(z.string().max(500).optional()),
});

export type CreateEscrowChallengeInput = z.infer<typeof createEscrowChallengeSchema>;

// ─── Billing ──────────────────────────────────────────────────────────────────

export const createCheckoutSchema = z.object({
  tier: z.enum(["rookie", "basic", "pro"]),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupSchema = loginSchema.extend({
  name: nonEmptyString.max(100),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

// ─── Hall ────────────────────────────────────────────────────────────────────

export const unlockHallBattlesSchema = z.object({
  unlockedBy: nonEmptyString.max(100, "Name too long"),
});

export type UnlockHallBattlesInput = z.infer<typeof unlockHallBattlesSchema>;

// ─── Player Career ────────────────────────────────────────────────────────────

export const createPlayerServiceSchema = z.object({
  serviceType: nonEmptyString,
  price: nonNegativeNumber,
});

export const withdrawSchema = z.object({
  amount: nonNegativeNumber.min(10, "Minimum withdrawal is $10"),
  method: z.enum(["stripe", "paypal", "venmo", "zelle"]).default("stripe"),
  account: nonEmptyString,
});

export type CreatePlayerServiceInput = z.infer<typeof createPlayerServiceSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;

// ─── Common ───────────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
