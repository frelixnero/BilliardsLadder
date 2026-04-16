import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, real, timestamp, index, unique, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication (required by Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Global user roles for platform management
export const globalRoles = ["OWNER", "STAFF", "OPERATOR", "CREATOR", "PLAYER", "TRUSTEE"] as const;
export type GlobalRole = typeof globalRoles[number];

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  // Enhanced authentication fields
  passwordHash: text("password_hash"), // For Creator/Owner email+password auth
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"), // TOTP secret
  phoneNumber: text("phone_number"), // For SMS 2FA
  lastLoginAt: timestamp("last_login_at"),
  loginAttempts: integer("login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  
  // Role and permissions
  globalRole: text("global_role").notNull().default("PLAYER"),
  role: text("role").default("player"), // player, operator, admin for side betting
  
  // Email verification
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),

  // Profile and status
  profileComplete: boolean("profile_complete").default(false),
  onboardingComplete: boolean("onboarding_complete").default(false),
  accountStatus: text("account_status").default("active"), // "active", "suspended", "banned", "pending"
  banReason: text("ban_reason"),
  bannedAt: timestamp("banned_at"),
  bannedBy: text("banned_by"),
  banExpiresAt: timestamp("ban_expires_at"),
  
  // Payment integration
  stripeCustomerId: text("stripe_customer_id"),
  stripeConnectId: text("stripe_connect_id").unique(),
  payoutShareBps: integer("payout_share_bps"), // basis points (100 bps = 1%)
  
  // Operator-specific fields
  hallName: text("hall_name"), // For operators
  city: text("city"),
  state: text("state"),
  subscriptionTier: text("subscription_tier"), // "small", "medium", "large", "mega"
  trusteeId: text("trustee_id"), // ID of trustee who signed up this operator (receives 53% of subscription)
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  seatLimit: integer("seat_limit").default(5),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payoutTransfers = pgTable("payout_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: text("invoice_id").notNull(),
  stripeTransferId: text("stripe_transfer_id").notNull(),
  recipientUserId: text("recipient_user_id").notNull(),
  amount: integer("amount").notNull(), // cents
  shareType: text("share_type").notNull(), // "OWNER" | "STAFF"
  createdAt: timestamp("created_at").defaultNow(),
});

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  rating: integer("rating").notNull().default(500),
  city: text("city"),
  member: boolean("member").default(false),
  theme: text("theme"),
  points: integer("points").notNull().default(800),
  streak: integer("streak").default(0),
  respectPoints: integer("respect_points").default(0),
  birthday: text("birthday"), // MM-DD format
  stripeCustomerId: text("stripe_customer_id"),
  userId: text("user_id"), // link to users table
  isRookie: boolean("is_rookie").default(true), // Starts as rookie, graduates at Fargo 500+
  rookieWins: integer("rookie_wins").default(0), // Track rookie division wins
  rookieLosses: integer("rookie_losses").default(0), // Track rookie division losses
  rookiePoints: integer("rookie_points").default(0), // Separate rookie points system
  rookieStreak: integer("rookie_streak").default(0), // Current rookie win streak
  rookiePassActive: boolean("rookie_pass_active").default(false), // $20/month subscription
  rookiePassExpiresAt: timestamp("rookie_pass_expires_at"), // When subscription expires
  graduatedAt: timestamp("graduated_at"), // When they left rookie division
  membershipTier: text("membership_tier").default("none"), // "none", "basic", "pro"
  createdAt: timestamp("created_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  division: text("division").notNull(), // "HI" or "LO"
  challenger: text("challenger").notNull(),
  opponent: text("opponent").notNull(),
  game: text("game").notNull(),
  table: text("table").notNull(),
  stake: integer("stake").notNull(),
  time: timestamp("time").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("scheduled"), // "scheduled", "reported"
  winner: text("winner"),
  commission: integer("commission"),
  bountyAward: integer("bounty_award").default(0),
  weightMultiplierBps: integer("weight_multiplier_bps").default(100), // Weight multiplier in basis points (100 = 1.00x)
  owedWeight: boolean("owed_weight").default(false), // Whether challenger owes weight
  
  // Commission and earnings tracking
  platformCommissionBps: integer("platform_commission_bps").default(1000), // 10% default in basis points
  operatorCommissionBps: integer("operator_commission_bps").default(500), // 5% default in basis points
  platformEarnings: integer("platform_earnings").default(0), // Platform cut in cents
  operatorEarnings: integer("operator_earnings").default(0), // Operator cut in cents
  prizePoolAmount: integer("prize_pool_amount").default(0), // Remaining for winner in cents
  
  reportedAt: timestamp("reported_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tournaments = pgTable("tournaments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  entry: integer("entry").notNull(),
  prizePool: integer("prize_pool").notNull(),
  format: text("format").notNull(),
  game: text("game").notNull(),
  maxPlayers: integer("max_players").notNull(),
  currentPlayers: integer("current_players").default(0),
  status: text("status").default("open"), // "open", "in_progress", "completed"
  stripeProductId: text("stripe_product_id"),
  addedMoney: integer("added_money").default(0), // ActionLadder added money in cents
  calcuttaEnabled: boolean("calcutta_enabled").default(false), // Enable bidding on participants
  calcuttaDeadline: timestamp("calcutta_deadline"), // When bidding closes
  seasonPredictionEnabled: boolean("season_prediction_enabled").default(false), // Link to season championship
  createdAt: timestamp("created_at").defaultNow(),
});

// Tournament Calcutta - Players bid on tournament participants before event starts
export const tournamentCalcuttas = pgTable("tournament_calcuttas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: text("tournament_id").notNull(),
  participantId: text("participant_id").notNull(), // Player being bid on
  currentBid: integer("current_bid").default(0), // Highest bid in cents
  currentBidderId: text("current_bidder_id"), // Player who made highest bid
  minimumBid: integer("minimum_bid").default(1000), // Starting bid $10 default
  totalBids: integer("total_bids").default(0), // Number of bids placed
  biddingOpen: boolean("bidding_open").default(true),
  finalPayout: integer("final_payout").default(0), // Winner's prize split in cents
  status: text("status").default("open"), // "open", "closed", "paid_out"
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual bids placed in tournament calcutta
export const calcuttaBids = pgTable("calcutta_bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  calcuttaId: text("calcutta_id").notNull(),
  bidderId: text("bidder_id").notNull(),
  bidAmount: integer("bid_amount").notNull(), // Bid amount in cents
  bidTime: timestamp("bid_time").defaultNow(),
  isWinning: boolean("is_winning").default(false), // Current highest bid
  stripePaymentIntentId: text("stripe_payment_intent_id"), // Payment confirmation
  createdAt: timestamp("created_at").defaultNow(),
});

// Season Championship Predictions - Most wins after 3+ matches
export const seasonPredictions = pgTable("season_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seasonId: text("season_id").notNull(), // Season identifier
  name: text("name").notNull(), // "Most Wins End of Season Q1 2025"
  description: text("description"),
  entryFee: integer("entry_fee").notNull().default(5000), // $50 default entry
  totalPool: integer("total_pool").default(0), // Total entry fees collected
  serviceFee: integer("service_fee").default(0), // 10% service fee in cents
  prizePool: integer("prize_pool").default(0), // Remaining after service fee
  addedMoneyContribution: integer("added_money_contribution").default(0), // Goes to tournaments
  minimumMatches: integer("minimum_matches").default(3), // Players need 3+ matches to be eligible
  predictionsOpen: boolean("predictions_open").default(true),
  predictionDeadline: timestamp("prediction_deadline"), // When predictions close
  seasonEndDate: timestamp("season_end_date"), // When to determine winners
  status: text("status").default("open"), // "open", "closed", "determining_winners", "completed"
  firstPlaceWins: integer("first_place_wins").default(70), // 70% payout
  secondPlaceWins: integer("second_place_wins").default(20), // 20% payout  
  thirdPlaceWins: integer("third_place_wins").default(10), // 10% payout
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual predictions for season championship
export const predictionEntries = pgTable("prediction_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  predictionId: text("prediction_id").notNull(),
  predictorId: text("predictor_id").notNull(), // Player making prediction
  firstPlacePick: text("first_place_pick").notNull(), // Player ID predicted for 1st
  secondPlacePick: text("second_place_pick").notNull(), // Player ID predicted for 2nd
  thirdPlacePick: text("third_place_pick").notNull(), // Player ID predicted for 3rd
  entryFee: integer("entry_fee").notNull(), // Entry fee paid in cents
  predictionScore: integer("prediction_score").default(0), // Points for correct predictions
  payout: integer("payout").default(0), // Prize money earned in cents
  stripePaymentIntentId: text("stripe_payment_intent_id"), // Payment confirmation
  createdAt: timestamp("created_at").defaultNow(),
});

// Tournament Added Money tracking - Revenue allocation for tournaments
export const addedMoneyFund = pgTable("added_money_fund", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceType: text("source_type").notNull(), // "season_prediction_fee", "challenge_pool_fee", "calcutta_fee"
  sourceId: text("source_id").notNull(), // Reference to source transaction
  amount: integer("amount").notNull(), // Amount in cents added to fund
  allocationType: text("allocation_type").notNull(), // "monthly_tournament", "season_championship"
  allocationDate: timestamp("allocation_date"), // When funds were allocated
  tournamentId: text("tournament_id"), // Tournament that received the funds
  remainingBalance: integer("remaining_balance").default(0), // Running balance
  createdAt: timestamp("created_at").defaultNow(),
});

export const kellyPools = pgTable("kelly_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  entry: integer("entry").notNull(),
  prizePool: integer("prize_pool").notNull(), // renamed from "pot" for compliance
  maxPlayers: integer("max_players").notNull(),
  currentPlayers: integer("current_players").default(0),
  balls: text("balls").array(), // JSON array of assigned balls
  status: text("status").default("open"), // "open", "active", "completed"
  table: text("table"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const moneyGames = pgTable("money_games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  billAmount: integer("bill_amount").notNull(),
  prizePool: integer("prize_pool").notNull(),
  currentPlayers: integer("current_players").default(0),
  maxPlayers: integer("max_players").notNull(),
  table: text("table").notNull(),
  gameType: text("game_type").notNull(), // "straight-lag", "rail-first", "progressive"
  status: text("status").default("waiting"), // "waiting", "active", "completed"
  winner: text("winner"),
  players: text("players").array().default(sql`ARRAY[]::text[]`), // Array of player names/IDs
  createdAt: timestamp("created_at").defaultNow(),
});

export const bounties = pgTable("bounties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // "onRank", "onPlayer"
  rank: integer("rank"),
  targetId: text("target_id"),
  prize: integer("prize").notNull(),
  active: boolean("active").default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const charityEvents = pgTable("charity_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  goal: integer("goal").notNull(),
  raised: integer("raised").default(0),
  percentage: real("percentage").default(0.1), // 10% default
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const supportRequests = pgTable("support_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  type: text("type").notNull(), // "birthday", "family", "need"
  description: text("description"),
  amount: integer("amount"),
  status: text("status").default("pending"), // "pending", "approved", "denied"
  createdAt: timestamp("created_at").defaultNow(),
});

export const poolHalls = pgTable("pool_halls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  city: text("city").notNull(),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  points: integer("points").notNull().default(0),
  description: text("description"),
  address: text("address"),
  phone: text("phone"),
  active: boolean("active").default(true),
  battlesUnlocked: boolean("battles_unlocked").default(false),
  unlockedBy: text("unlocked_by"),
  unlockedAt: timestamp("unlocked_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const hallMatches = pgTable("hall_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  homeHallId: text("home_hall_id").notNull(),
  awayHallId: text("away_hall_id").notNull(),
  format: text("format").notNull(), // "team_9ball", "team_8ball", "mixed_format"
  totalRacks: integer("total_racks").notNull().default(9), // First to X racks
  homeScore: integer("home_score").default(0),
  awayScore: integer("away_score").default(0),
  status: text("status").notNull().default("scheduled"), // "scheduled", "in_progress", "completed"
  winnerHallId: text("winner_hall_id"),
  scheduledDate: timestamp("scheduled_date"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  stake: integer("stake").default(0), // Venue entry or prize pool
  createdAt: timestamp("created_at").defaultNow(),
});

export const hallRosters = pgTable("hall_rosters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hallId: text("hall_id").notNull(),
  playerId: text("player_id").notNull(),
  position: text("position"), // "captain", "player", "substitute"
  isActive: boolean("is_active").default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const liveStreams = pgTable("live_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull(), // "twitch", "youtube", "facebook", "tiktok", "kick", "other"
  url: text("url").notNull(),
  title: text("title"),
  poolHallName: text("pool_hall_name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  category: text("category").default("casual"), // "tournament", "casual", "practice", "event"
  quality: text("quality").default("hd"), // "hd", "fhd", "4k"
  isLive: boolean("is_live").default(false),
  viewerCount: integer("viewer_count").default(0),
  maxViewers: integer("max_viewers").default(0),
  matchId: text("match_id"),
  hallMatchId: text("hall_match_id"), // Link to inter-hall matches
  tournamentId: text("tournament_id"), // Link to tournaments
  streamerId: text("streamer_id"), // Link to player/user
  embedUrl: text("embed_url"), // Processed embed URL
  thumbnailUrl: text("thumbnail_url"), // Stream thumbnail
  tags: text("tags").array(), // Searchable tags
  language: text("language").default("en"), // Stream language
  createdAt: timestamp("created_at").defaultNow(),
  lastLiveAt: timestamp("last_live_at"),
});

export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stripeEventId: text("stripe_event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at").defaultNow(),
  payloadJson: text("payload_json").notNull(),
});

// Operator settings for customization and free months
export const operatorSettings = pgTable("operator_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorUserId: text("operator_user_id").notNull().unique(), // Links to users table
  cityName: text("city_name").default("Your City"),
  areaName: text("area_name").default("Your Area"),
  customBranding: text("custom_branding"), // Optional custom branding text
  hasFreeMonths: boolean("has_free_months").default(false), // Trustee can toggle this
  freeMonthsCount: integer("free_months_count").default(0), // How many free months left
  freeMonthsGrantedBy: text("free_months_granted_by"), // Which trustee granted it
  freeMonthsGrantedAt: timestamp("free_months_granted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced authentication schemas
export const createOwnerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
  phoneNumber: z.string().optional(),
  twoFactorEnabled: z.boolean().default(false),
});

export const createOperatorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2),
  hallName: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2),
  subscriptionTier: z.enum(["small", "medium", "large", "mega"]),
  stripePaymentMethodId: z.string().optional(),
});

export const createPlayerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2),
  tier: z.enum(["rookie", "barbox", "eight_foot", "nine_foot"]),
  membershipTier: z.enum(["none", "basic", "pro"]).default("none"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFactorCode: z.string().optional(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: true, // Don't allow direct password hash insertion
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
});

export const insertPayoutTransferSchema = createInsertSchema(payoutTransfers).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  createdAt: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
  reportedAt: true,
});

export const insertTournamentSchema = createInsertSchema(tournaments).omit({
  id: true,
  createdAt: true,
});

export const insertTournamentCalcuttaSchema = createInsertSchema(tournamentCalcuttas).omit({
  id: true,
  createdAt: true,
});

export const insertCalcuttaBidSchema = createInsertSchema(calcuttaBids).omit({
  id: true,
  createdAt: true,
  bidTime: true,
});

export const insertSeasonPredictionSchema = createInsertSchema(seasonPredictions).omit({
  id: true,
  createdAt: true,
});

export const insertPredictionEntrySchema = createInsertSchema(predictionEntries).omit({
  id: true,
  createdAt: true,
});

export const insertAddedMoneyFundSchema = createInsertSchema(addedMoneyFund).omit({
  id: true,
  createdAt: true,
});

export const insertKellyPoolSchema = createInsertSchema(kellyPools).omit({
  id: true,
  createdAt: true,
});

export const insertMoneyGameSchema = createInsertSchema(moneyGames).omit({
  id: true,
  createdAt: true,
});

export const insertBountySchema = createInsertSchema(bounties).omit({
  id: true,
  createdAt: true,
});

export const insertCharityEventSchema = createInsertSchema(charityEvents).omit({
  id: true,
  createdAt: true,
});

export const insertSupportRequestSchema = createInsertSchema(supportRequests).omit({
  id: true,
  createdAt: true,
});

export const insertPoolHallSchema = createInsertSchema(poolHalls).omit({
  id: true,
  createdAt: true,
});

export const insertHallMatchSchema = createInsertSchema(hallMatches).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertHallRosterSchema = createInsertSchema(hallRosters).omit({
  id: true,
  joinedAt: true,
});

export const insertLiveStreamSchema = createInsertSchema(liveStreams).omit({
  id: true,
  createdAt: true,
  lastLiveAt: true,
  maxViewers: true,
  embedUrl: true,
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
  id: true,
  processedAt: true,
});

export const insertOperatorSettingsSchema = createInsertSchema(operatorSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// === PRICING TIER SYSTEM ===

// Player membership subscriptions with exact pricing from monetization plan
export const membershipSubscriptions = pgTable("membership_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull().unique(),
  tier: text("tier").notNull(), // "rookie", "basic", "pro"
  monthlyPrice: integer("monthly_price").notNull(), // $20/$25/$60 in cents
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  status: text("status").default("active"), // "active", "cancelled", "past_due"
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  perks: text("perks").array(), // Available perks for this tier
  commissionRate: integer("commission_rate").default(1000), // Commission rate in basis points
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Challenge fee commission tracking with round-up profit
export const challengeCommissions = pgTable("challenge_commissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: text("challenge_id").notNull(), // Links to match or challenge
  originalAmount: integer("original_amount").notNull(), // Original fee in cents
  commissionRate: integer("commission_rate").notNull(), // Rate in basis points (500-1000)
  calculatedCommission: integer("calculated_commission").notNull(), // Math.ceil(amount * rate)
  roundedCommission: integer("rounded_commission").notNull(), // Rounded up to nearest $1
  actionLadderShare: integer("action_ladder_share").notNull(), // Platform cut in cents
  operatorShare: integer("operator_share").notNull(), // Operator cut in cents  
  bonusFundShare: integer("bonus_fund_share").notNull(), // League bonus pot in cents
  operatorId: text("operator_id").notNull(),
  playerId: text("player_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === ANTI-SANDBAGGING DETECTION ===

// Suspicion scoring system for fair play enforcement
export const suspicionScores = pgTable("suspicion_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  currentScore: real("current_score").notNull().default(0), // 0-10 scale
  winStreakVsHigher: integer("win_streak_vs_higher").default(0), // Wins against higher tier
  breakRunPercent: real("break_run_percent").default(0), // Break and run percentage
  rackDifferentialAvg: real("rack_differential_avg").default(0), // Average rack differential
  suddenRatingDrops: integer("sudden_rating_drops").default(0), // Suspicious rating drops
  operatorFlags: integer("operator_flags").default(0), // Operator suspicious activity reports
  peerReports: integer("peer_reports").default(0), // Peer reports of sandbagging
  outlierPerformance: real("outlier_performance").default(0), // Performance vs expected
  lastCalculated: timestamp("last_calculated").defaultNow(),
  triggerThreshold: real("trigger_threshold").default(7.0), // Auto-review at 7+
  lockThreshold: real("lock_threshold").default(9.0), // Auto-lock at 9+
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Dynamic tier adjustments based on performance
export const tierAdjustments = pgTable("tier_adjustments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  fromTier: text("from_tier").notNull(),
  toTier: text("to_tier").notNull(),
  reason: text("reason").notNull(), // "auto_promotion", "sandbagging_detected", "manual_adjustment"
  triggerMetric: text("trigger_metric"), // What triggered the adjustment
  triggerValue: real("trigger_value"), // Value that triggered adjustment
  adminId: text("admin_id"), // Admin who made manual adjustment
  suspicionScore: real("suspicion_score"), // Score at time of adjustment
  effectiveDate: timestamp("effective_date").defaultNow(),
  pastResultsAdjusted: boolean("past_results_adjusted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// === NO-SHOW PREVENTION ===

// Challenge holds and deposits for no-show prevention
export const challengeHolds = pgTable("challenge_holds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: text("challenge_id").notNull(),
  playerId: text("player_id").notNull(),
  holdAmount: integer("hold_amount").notNull(), // Pre-auth amount in cents
  holdType: text("hold_type").notNull(), // "deposit", "challenge_fee", "penalty"
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  status: text("status").default("active"), // "active", "released", "captured", "forfeited"
  expiresAt: timestamp("expires_at").notNull(),
  releasedAt: timestamp("released_at"),
  forfeitReason: text("forfeit_reason"), // "no_show", "late_cancel", "other"
  createdAt: timestamp("created_at").defaultNow(),
});

// No-show tracking and penalty system
export const noShows = pgTable("no_shows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  challengeId: text("challenge_id").notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  gracePeriod: integer("grace_period").default(10), // Minutes of grace period
  checkInDeadline: timestamp("check_in_deadline").notNull(),
  actualCheckIn: timestamp("actual_check_in"),
  noShowConfirmed: boolean("no_show_confirmed").default(false),
  penaltyApplied: boolean("penalty_applied").default(false),
  penaltyAmount: integer("penalty_amount").default(0), // Penalty in cents
  operatorId: text("operator_id").notNull(),
  opponentId: text("opponent_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Player penalty tracking
export const playerPenalties = pgTable("player_penalties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  penaltyType: text("penalty_type").notNull(), // "no_show", "late_cancel", "sandbagging", "misconduct"
  severity: text("severity").notNull(), // "warning", "minor", "major", "severe"
  description: text("description"),
  relatedChallengeId: text("related_challenge_id"),
  penaltyCount: integer("penalty_count").default(1), // Cumulative count for this type
  suspensionDays: integer("suspension_days").default(0),
  suspensionStart: timestamp("suspension_start"),
  suspensionEnd: timestamp("suspension_end"),
  isActive: boolean("is_active").default(true),
  appliedBy: text("applied_by").notNull(), // Admin or system who applied penalty
  createdAt: timestamp("created_at").defaultNow(),
});

// === REVENUE SHARING AUTOMATION ===

// Operator revenue sharing configuration
export const operatorRevenue = pgTable("operator_revenue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorId: text("operator_id").notNull().unique(),
  hallName: text("hall_name").notNull(),
  baseCommissionRate: integer("base_commission_rate").default(500), // 5% in basis points
  memberCommissionRate: integer("member_commission_rate").default(300), // 3% for members
  monthlyMinimum: integer("monthly_minimum").default(0), // Minimum monthly guarantee
  payoutFrequency: text("payout_frequency").default("weekly"), // "daily", "weekly", "monthly"
  stripeConnectId: text("stripe_connect_id"),
  autoPayoutEnabled: boolean("auto_payout_enabled").default(true),
  lastPayoutAt: timestamp("last_payout_at"),
  totalEarningsToDate: integer("total_earnings_to_date").default(0),
  currentPeriodEarnings: integer("current_period_earnings").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Revenue split calculations for each transaction
export const revenueSplits = pgTable("revenue_splits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: text("transaction_id").notNull(), // Links to match, challenge, etc.
  transactionType: text("transaction_type").notNull(), // "challenge_fee", "membership", "tournament"
  totalAmount: integer("total_amount").notNull(), // Total transaction in cents
  actionLadderShare: integer("action_ladder_share").notNull(), // Platform cut
  operatorShare: integer("operator_share").notNull(), // Operator cut
  bonusFundShare: integer("bonus_fund_share").notNull(), // League bonus fund
  prizePoolShare: integer("prize_pool_share").notNull(), // Remaining for winner
  operatorId: text("operator_id").notNull(),
  playerId: text("player_id"),
  processed: boolean("processed").default(false),
  processedAt: timestamp("processed_at"),
  stripeTransferId: text("stripe_transfer_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === FAIR PLAY ENFORCEMENT ===

// Fair play violations and enforcement actions
export const fairPlayViolations = pgTable("fair_play_violations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  violationType: text("violation_type").notNull(), // "sandbagging", "cheating", "misconduct", "rating_manipulation"
  severity: text("severity").notNull(), // "minor", "major", "severe"
  description: text("description").notNull(),
  evidence: jsonb("evidence"), // Links to footage, reports, etc.
  reportedBy: text("reported_by"), // User ID who reported
  reportedByType: text("reported_by_type"), // "player", "operator", "system", "admin"
  investigatedBy: text("investigated_by"),
  investigationNotes: text("investigation_notes"),
  status: text("status").default("pending"), // "pending", "investigating", "confirmed", "dismissed"
  relatedMatches: text("related_matches").array(), // Array of match IDs
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Penalty ladder system (1st, 2nd, 3rd offense escalation)
export const penaltyLadder = pgTable("penalty_ladder", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  violationId: text("violation_id").notNull(), // Links to fairPlayViolations
  offenseNumber: integer("offense_number").notNull(), // 1st, 2nd, 3rd offense
  penaltyType: text("penalty_type").notNull(), // "warning", "tier_correction", "suspension", "pro_only"
  penaltyDescription: text("penalty_description").notNull(),
  creditLoss: integer("credit_loss").default(0), // Credits forfeited
  suspensionDays: integer("suspension_days").default(0),
  tierRestriction: text("tier_restriction"), // "pro_only", "basic_only", etc.
  publicNotice: boolean("public_notice").default(false), // Fair Play Notice published
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  appliedBy: text("applied_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Play-up incentives and positive reinforcement
export const playUpIncentives = pgTable("play_up_incentives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  incentiveType: text("incentive_type").notNull(), // "play_up_bonus", "upset_king", "savage_spotlight", "fast_track", "streak_bonus", "weekly_mini_prize"
  title: text("title").notNull(),
  description: text("description"),
  bonusAmount: integer("bonus_amount").default(0), // Credits or cash bonus
  badgeEarned: text("badge_earned"), // Badge/achievement name
  publicRecognition: boolean("public_recognition").default(false),
  triggerMatch: text("trigger_match"), // Match that triggered incentive
  opponentTier: text("opponent_tier"), // Tier of opponent beaten
  awarded: boolean("awarded").default(false),
  awardedAt: timestamp("awarded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Player attendance streak tracking
export const playerStreaks = pgTable("player_streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull().unique(),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  lastMatchDate: timestamp("last_match_date"),
  totalRewardsEarned: integer("total_rewards_earned").default(0), // Total in cents
  streakRewardsClaimed: integer("streak_rewards_claimed").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Weekly mini-prize drawings
export const weeklyMiniPrizes = pgTable("weekly_mini_prizes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  week: text("week").notNull().unique(), // "2024-01"
  prizeAmount: integer("prize_amount").notNull(), // $50 in cents
  participants: text("participants").array().default([]),
  winner: text("winner"),
  drawn: boolean("drawn").default(false),
  drawnAt: timestamp("drawn_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Operator Subscription Management
export const operatorSubscriptions = pgTable("operator_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorId: text("operator_id").notNull().unique(), // Links to users table with globalRole "OPERATOR"
  hallName: text("hall_name").notNull(),
  playerCount: integer("player_count").notNull().default(0),
  tier: text("tier").notNull(), // "small", "medium", "large", "mega"
  basePriceMonthly: integer("base_price_monthly").notNull(), // Base price in cents
  extraPlayersCharge: integer("extra_players_charge").default(0), // Extra player charges in cents
  extraLadders: integer("extra_ladders").default(0), // Number of extra ladders/divisions
  extraLadderCharge: integer("extra_ladder_charge").default(0), // Extra ladder charges in cents
  rookieModuleActive: boolean("rookie_module_active").default(false),
  rookieModuleCharge: integer("rookie_module_charge").default(0), // $50/mo in cents
  rookiePassesActive: integer("rookie_passes_active").default(0), // Number of active rookie passes
  rookiePassCharge: integer("rookie_pass_charge").default(0), // $15/pass/month in cents
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  status: text("status").default("active"), // "active", "cancelled", "past_due"
  billingCycleStart: timestamp("billing_cycle_start").defaultNow(),
  nextBillingDate: timestamp("next_billing_date"),
  totalMonthlyCharge: integer("total_monthly_charge").notNull(), // Calculated total in cents
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Operator Subscription Split Ledger - tracks revenue distribution
export const operatorSubscriptionSplits = pgTable("operator_subscription_splits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: text("subscription_id").notNull(), // Links to operatorSubscriptions or Stripe subscription ID
  operatorId: text("operator_id").notNull(), // Operator who paid the subscription
  trusteeId: text("trustee_id"), // Trustee who signed up the operator (receives 53%)
  potAmount: integer("pot_amount").notNull(), // 20% to pot/special games in cents
  trusteeAmount: integer("trustee_amount").notNull(), // 53% to trustee in cents
  founderAmount: integer("founder_amount").notNull(), // 23% to founder in cents
  payrollAmount: integer("payroll_amount").notNull(), // 4% to payroll in cents
  totalAmount: integer("total_amount").notNull(), // Total subscription amount in cents
  stripePaymentIntentId: text("stripe_payment_intent_id"), // Stripe payment reference
  billingPeriodStart: timestamp("billing_period_start"),
  billingPeriodEnd: timestamp("billing_period_end"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Team Division System for 3-man and 5-man teams
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  operatorId: text("operator_id").notNull(), // Links to operator
  hallId: text("hall_id"), // Links to pool halls
  captainId: text("captain_id").notNull(), // Team captain player ID
  teamType: text("team_type").notNull(), // "2man", "3man" (5man discontinued)
  maxPlayers: integer("max_players").notNull(), // 2 or 3 (5man discontinued)
  maxSubs: integer("max_subs").notNull(), // 2 or 3
  currentPlayers: integer("current_players").default(1), // Start with captain
  currentSubs: integer("current_subs").default(0),
  rosterLocked: boolean("roster_locked").default(false), // Locked for season
  status: text("status").default("active"), // "active", "inactive", "disbanded"
  seasonWins: integer("season_wins").default(0),
  seasonLosses: integer("season_losses").default(0),
  ladderPoints: integer("ladder_points").default(800), // Team ladder points
  consecutiveLosses: integer("consecutive_losses").default(0), // For captain's burden rule
  captainForcedNext: boolean("captain_forced_next").default(false), // Captain must play first after 2 losses
  createdAt: timestamp("created_at").defaultNow(),
});

// Team rosters and player assignments
export const teamPlayers = pgTable("team_players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: text("team_id").notNull(),
  playerId: text("player_id").notNull(),
  role: text("role").notNull(), // "captain", "player", "substitute"
  position: integer("position"), // Lineup order (1-2 for 2man, 1-3 for 3man)
  isActive: boolean("is_active").default(true),
  seasonWins: integer("season_wins").default(0),
  seasonLosses: integer("season_losses").default(0),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Team matches with special put-up rules
export const teamMatches = pgTable("team_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  homeTeamId: text("home_team_id").notNull(),
  awayTeamId: text("away_team_id").notNull(),
  operatorId: text("operator_id").notNull(),
  homeScore: integer("home_score").default(0),
  awayScore: integer("away_score").default(0),
  maxSets: integer("max_sets").notNull(), // 2 for 2man, 3 for 3man (5man discontinued)
  currentSet: integer("current_set").default(1),
  status: text("status").default("scheduled"), // "scheduled", "in_progress", "completed"
  winnerTeamId: text("winner_team_id"),
  isHillHill: boolean("is_hill_hill").default(false), // If score tied and at final sets
  putUpRound: text("put_up_round"), // "best_vs_best", "worst_vs_worst"
  homeLineupOrder: text("home_lineup_order").array(), // Secret lineup order
  awayLineupOrder: text("away_lineup_order").array(), // Secret lineup order
  homeLineupRevealed: boolean("home_lineup_revealed").default(false),
  awayLineupRevealed: boolean("away_lineup_revealed").default(false),
  moneyBallActive: boolean("money_ball_active").default(false), // $20 bonus pot active
  moneyBallAmount: integer("money_ball_amount").default(2000), // $20 in cents
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual sets within team matches
export const teamSets = pgTable("team_sets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamMatchId: text("team_match_id").notNull(),
  setNumber: integer("set_number").notNull(),
  homePlayerId: text("home_player_id").notNull(),
  awayPlayerId: text("away_player_id").notNull(),
  winnerId: text("winner_id"),
  loserId: text("loser_id"),
  isPutUpSet: boolean("is_put_up_set").default(false), // Special best vs best / worst vs worst
  putUpType: text("put_up_type"), // "best_vs_best", "worst_vs_worst"
  isMoneyBallSet: boolean("is_money_ball_set").default(false), // Final deciding set with bonus
  status: text("status").default("scheduled"), // "scheduled", "in_progress", "completed"
  completedAt: timestamp("completed_at"),
  clipUrl: text("clip_url"), // Auto-generated highlight clip for social media
  createdAt: timestamp("created_at").defaultNow(),
});

// Team Challenges: 2-Man Army, 3-Man Crew (5-Man Squad discontinued)
export const teamChallenges = pgTable("team_challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengingTeamId: text("challenging_team_id").notNull(), // Team creating the challenge
  challengeType: text("challenge_type").notNull(), // "2man_army", "3man_crew" (5man_squad discontinued)
  individualFee: integer("individual_fee").notNull(), // Fee per player in cents ($10-$10,000)
  totalStake: integer("total_stake").notNull(), // Total team stake (individualFee × team size)
  title: text("title").notNull(), // Challenge title/description
  description: text("description"),
  status: text("status").default("open"), // "open", "accepted", "in_progress", "completed", "cancelled"
  acceptingTeamId: text("accepting_team_id"), // Team that accepts the challenge
  challengePoolId: text("challenge_pool_id"), // Links to existing challenge pool system
  winnerId: text("winner_id"), // Winning team ID
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"), // Challenge expiry time
  requiresProMembership: boolean("requires_pro_membership").default(true), // All team challenges require Pro
  operatorId: text("operator_id").notNull(), // Operator managing this challenge
  createdAt: timestamp("created_at").defaultNow(),
});

// Team Challenge Participants: Links individual players to team challenges
export const teamChallengeParticipants = pgTable("team_challenge_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamChallengeId: text("team_challenge_id").notNull(),
  teamId: text("team_id").notNull(),
  playerId: text("player_id").notNull(),
  feeContribution: integer("fee_contribution").notNull(), // Individual player's fee in cents
  hasPaid: boolean("has_paid").default(false), // Payment status
  membershipTier: text("membership_tier").notNull(), // Must be "pro" for team challenges
  createdAt: timestamp("created_at").defaultNow(),
});

// === SPORTSMANSHIP VOTE-OUT SYSTEM ===

// Track who's checked in at a venue (determines voter eligibility)
export const checkins = pgTable("checkins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  venueId: text("venue_id").notNull(),
  sessionId: text("session_id").notNull(), // Current ladder session ID
  role: text("role").notNull(), // "player", "attendee", "operator"
  verified: boolean("verified").default(false), // QR check-in verification
  createdAt: timestamp("created_at").defaultNow(),
});

// Active sportsmanship votes
export const attitudeVotes = pgTable("attitude_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  targetUserId: text("target_user_id").notNull(), // User being voted on
  sessionId: text("session_id").notNull(), // Current ladder session
  venueId: text("venue_id").notNull(), // Venue where vote is happening
  status: text("status").default("open"), // "open", "closed", "cancelled"
  startedAt: timestamp("started_at").defaultNow(),
  endsAt: timestamp("ends_at").notNull(), // Auto-close time (90 seconds)
  quorumRequired: real("quorum_required").notNull(), // Minimum weighted votes needed
  thresholdRequired: real("threshold_required").notNull(), // % needed to pass (0.65 = 65%)
  result: text("result"), // "pass", "fail_quorum", "fail_threshold"
  createdBy: text("created_by").notNull(), // Operator who initiated
});

// Individual ballots in a vote
export const attitudeBallots = pgTable("attitude_ballots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  voteId: text("vote_id").notNull(), // References attitude_votes.id
  voterUserId: text("voter_user_id").notNull(),
  weight: real("weight").notNull(), // 0.5 (attendee), 1.0 (player), 2.0 (operator)
  choice: text("choice").notNull(), // "out" or "keep"
  tags: text("tags").array(), // ["A", "B", "C", "D"] - violation categories
  note: text("note"), // Optional note (max 140 chars)
  createdAt: timestamp("created_at").defaultNow(),
});

// Moderation incident log
export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(), // User involved in incident
  sessionId: text("session_id"), // Ladder session if applicable
  venueId: text("venue_id"), // Venue if applicable
  type: text("type").notNull(), // "warning", "ejection", "suspension"
  details: text("details").notNull(), // Description of incident
  consequence: text("consequence"), // "ejected_night", "suspended_7d", "suspended_30d"
  pointsPenalty: integer("points_penalty").default(0), // Ladder points deducted
  creditsFine: integer("credits_fine").default(0), // Credits fine in cents
  createdBy: text("created_by"), // Operator who logged incident
  voteId: text("vote_id"), // If this came from a vote-out
  createdAt: timestamp("created_at").defaultNow(),
});


// Weight Rules tracking table for consecutive losses
export const weightRules = pgTable("weight_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  opponentId: text("opponent_id").notNull(), 
  consecutiveLosses: integer("consecutive_losses").default(0),
  totalLosses: integer("total_losses").default(0),
  weightOwed: boolean("weight_owed").default(false),
  lastLossAt: timestamp("last_loss_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Rookie-specific tables
export const rookieMatches = pgTable("rookie_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challenger: text("challenger").notNull(),
  opponent: text("opponent").notNull(),
  game: text("game").notNull(),
  table: text("table").notNull(),
  fee: integer("fee").notNull().default(6000), // $60 in cents
  commission: integer("commission").notNull().default(200), // $2 in cents
  time: timestamp("time").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("scheduled"), // "scheduled", "completed"
  winner: text("winner"),
  pointsAwarded: integer("points_awarded").default(10), // 10 points for win, 5 for loss
  reportedAt: timestamp("reported_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rookieEvents = pgTable("rookie_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // "tournament", "jackpot", "achievement"
  buyIn: integer("buy_in").default(6000), // $60 in cents
  prizePool: integer("prize_pool").default(0),
  maxPlayers: integer("max_players").default(8),
  currentPlayers: integer("current_players").default(0),
  status: text("status").default("open"), // "open", "active", "completed"
  prizeType: text("prize_type").default("credit"), // "credit", "voucher", "merch"
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rookieAchievements = pgTable("rookie_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  type: text("type").notNull(), // "first_win", "streak_3", "graduated"
  title: text("title").notNull(),
  description: text("description"),
  badge: text("badge"), // Badge icon/image reference
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const rookieSubscriptions = pgTable("rookie_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull().unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  status: text("status").notNull().default("active"), // "active", "cancelled", "expired"
  monthlyFee: integer("monthly_fee").default(2000), // $20 in cents
  startedAt: timestamp("started_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  cancelledAt: timestamp("cancelled_at"),
});

// Insert schemas for rookie tables
export const insertRookieMatchSchema = createInsertSchema(rookieMatches).omit({
  id: true,
  createdAt: true,
  reportedAt: true,
});

export const insertRookieEventSchema = createInsertSchema(rookieEvents).omit({
  id: true,
  createdAt: true,
});

export const insertRookieAchievementSchema = createInsertSchema(rookieAchievements).omit({
  id: true,
  earnedAt: true,
});

export const insertRookieSubscriptionSchema = createInsertSchema(rookieSubscriptions).omit({
  id: true,
  startedAt: true,
});

// Types
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type TournamentCalcutta = typeof tournamentCalcuttas.$inferSelect;
export type InsertTournamentCalcutta = z.infer<typeof insertTournamentCalcuttaSchema>;
export type CalcuttaBid = typeof calcuttaBids.$inferSelect;
export type InsertCalcuttaBid = z.infer<typeof insertCalcuttaBidSchema>;
export type SeasonPrediction = typeof seasonPredictions.$inferSelect;
export type InsertSeasonPrediction = z.infer<typeof insertSeasonPredictionSchema>;
export type PredictionEntry = typeof predictionEntries.$inferSelect;
export type InsertPredictionEntry = z.infer<typeof insertPredictionEntrySchema>;
export type AddedMoneyFund = typeof addedMoneyFund.$inferSelect;
export type InsertAddedMoneyFund = z.infer<typeof insertAddedMoneyFundSchema>;
export type KellyPool = typeof kellyPools.$inferSelect;
export type InsertKellyPool = z.infer<typeof insertKellyPoolSchema>;
export type MoneyGame = typeof moneyGames.$inferSelect;
export type InsertMoneyGame = z.infer<typeof insertMoneyGameSchema>;
export type Bounty = typeof bounties.$inferSelect;
export type InsertBounty = z.infer<typeof insertBountySchema>;
export type CharityEvent = typeof charityEvents.$inferSelect;
export type InsertCharityEvent = z.infer<typeof insertCharityEventSchema>;
export type SupportRequest = typeof supportRequests.$inferSelect;
export type InsertSupportRequest = z.infer<typeof insertSupportRequestSchema>;
export type PoolHall = typeof poolHalls.$inferSelect;
export type InsertPoolHall = z.infer<typeof insertPoolHallSchema>;
export type HallMatch = typeof hallMatches.$inferSelect;
export type InsertHallMatch = z.infer<typeof insertHallMatchSchema>;
export type HallRoster = typeof hallRosters.$inferSelect;
export type InsertHallRoster = z.infer<typeof insertHallRosterSchema>;
export type LiveStream = typeof liveStreams.$inferSelect;
export type InsertLiveStream = z.infer<typeof insertLiveStreamSchema>;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;
export type OperatorSettings = typeof operatorSettings.$inferSelect;
export type InsertOperatorSettings = z.infer<typeof insertOperatorSettingsSchema>;
export type RookieMatch = typeof rookieMatches.$inferSelect;
export type InsertRookieMatch = z.infer<typeof insertRookieMatchSchema>;
export type RookieEvent = typeof rookieEvents.$inferSelect;
export type InsertRookieEvent = z.infer<typeof insertRookieEventSchema>;
export type RookieAchievement = typeof rookieAchievements.$inferSelect;
export type InsertRookieAchievement = z.infer<typeof insertRookieAchievementSchema>;
export type RookieSubscription = typeof rookieSubscriptions.$inferSelect;
export type InsertRookieSubscription = z.infer<typeof insertRookieSubscriptionSchema>;
export type OperatorSubscription = typeof operatorSubscriptions.$inferSelect;
export type InsertOperatorSubscription = z.infer<typeof insertOperatorSubscriptionSchema>;
export type OperatorSubscriptionSplit = typeof operatorSubscriptionSplits.$inferSelect;
export type InsertOperatorSubscriptionSplit = z.infer<typeof insertOperatorSubscriptionSplitSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type TeamPlayer = typeof teamPlayers.$inferSelect;
export type InsertTeamPlayer = z.infer<typeof insertTeamPlayerSchema>;
export type TeamMatch = typeof teamMatches.$inferSelect;
export type InsertTeamMatch = z.infer<typeof insertTeamMatchSchema>;
export type TeamSet = typeof teamSets.$inferSelect;
export type InsertTeamSet = z.infer<typeof insertTeamSetSchema>;
export type TeamChallenge = typeof teamChallenges.$inferSelect;
export type InsertTeamChallenge = z.infer<typeof insertTeamChallengeSchema>;
export type TeamChallengeParticipant = typeof teamChallengeParticipants.$inferSelect;
export type InsertTeamChallengeParticipant = z.infer<typeof insertTeamChallengeParticipantSchema>;

// Sportsmanship Vote-Out System Types
export type Checkin = typeof checkins.$inferSelect;
export type InsertCheckin = z.infer<typeof insertCheckinSchema>;
export type AttitudeVote = typeof attitudeVotes.$inferSelect;
export type InsertAttitudeVote = z.infer<typeof insertAttitudeVoteSchema>;
export type AttitudeBallot = typeof attitudeBallots.$inferSelect;
export type InsertAttitudeBallot = z.infer<typeof insertAttitudeBallotSchema>;
export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;

// Challenge Pool System - Wallet and credit-based competition entries
export const wallets = pgTable("wallets", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  balanceCredits: integer("balance_credits").default(0), // credits in cents
  balanceLockedCredits: integer("balance_locked_credits").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Challenge pools for competition entries
export const challengePools = pgTable("challenge_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").references(() => matches.id),
  creatorId: varchar("creator_id").references(() => users.id),
  sideALabel: varchar("side_a_label"),
  sideBLabel: varchar("side_b_label"),
  stakePerSide: integer("stake_per_side").notNull(), // in credits (cents)
  feeBps: integer("fee_bps").default(800), // 8% default
  status: varchar("status").default("open"), // open|locked|on_hold|resolved|voided
  lockCutoffAt: timestamp("lock_cutoff_at"),
  description: text("description"), // Custom challenge description (5-200 chars)
  challengeType: varchar("challenge_type").default("yes_no"), // yes_no|over_under|player_prop
  evidenceJson: text("evidence_json"), // Evidence links, timestamps, notes
  verificationSource: varchar("verification_source"), // Official Stream|Table Referee|Score App Screenshot
  customCreatedBy: varchar("custom_created_by").references(() => users.id), // Track who created custom challenge
  winningSide: varchar("winning_side"), // A or B - winner of the challenge
  resolvedAt: timestamp("resolved_at"), // When pool was resolved/winner declared
  disputeDeadline: timestamp("dispute_deadline"), // 12 hours after resolution
  disputeStatus: varchar("dispute_status").default("none"), // "none", "pending", "resolved"
  autoResolvedAt: timestamp("auto_resolved_at"), // When auto-resolution happened (12hrs after dispute deadline)
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual entries within challenge pools
export const challengeEntries = pgTable("challenge_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengePoolId: varchar("challenge_pool_id").references(() => challengePools.id),
  userId: varchar("user_id").references(() => users.id),
  side: varchar("side"), // A or B
  amount: integer("amount").notNull(), // entry credits locked
  status: varchar("status").notNull(), // pending_fund|funded|refunded|paid
  fundedAt: timestamp("funded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Financial ledger
export const ledger = pgTable("ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type"), // credit_topup, pool_lock, pool_release_win, fee
  amount: integer("amount"), // signed credits
  refId: varchar("ref_id"),
  metaJson: varchar("meta_json"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Challenge pool resolutions
export const resolutions = pgTable("resolutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengePoolId: varchar("challenge_pool_id").references(() => challengePools.id),
  winnerSide: varchar("winner_side"), // A or B
  decidedBy: varchar("decided_by").references(() => users.id),
  decidedAt: timestamp("decided_at").defaultNow(),
  notes: varchar("notes"),
});

// Insert schemas for challenge pools
export const insertWalletSchema = createInsertSchema(wallets).omit({
  createdAt: true,
});

export const insertChallengePoolSchema = createInsertSchema(challengePools).omit({
  id: true,
  createdAt: true,
});

export const insertChallengeEntrySchema = createInsertSchema(challengeEntries).omit({
  id: true,
  createdAt: true,
});

export const insertLedgerSchema = createInsertSchema(ledger).omit({
  id: true,
  createdAt: true,
});

export const insertResolutionSchema = createInsertSchema(resolutions).omit({
  id: true,
  decidedAt: true,
});

export const insertMembershipSubscriptionSchema = createInsertSchema(membershipSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWeightRuleSchema = createInsertSchema(weightRules).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for operator subscription system
export const insertOperatorSubscriptionSchema = createInsertSchema(operatorSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOperatorSubscriptionSplitSchema = createInsertSchema(operatorSubscriptionSplits).omit({
  id: true,
  createdAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertTeamPlayerSchema = createInsertSchema(teamPlayers).omit({
  id: true,
  joinedAt: true,
});

export const insertTeamMatchSchema = createInsertSchema(teamMatches).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertTeamSetSchema = createInsertSchema(teamSets).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertTeamChallengeSchema = createInsertSchema(teamChallenges).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertTeamChallengeParticipantSchema = createInsertSchema(teamChallengeParticipants).omit({
  id: true,
  createdAt: true,
});

// Sportsmanship Vote-Out Insert Schemas
export const insertCheckinSchema = createInsertSchema(checkins).omit({
  id: true,
  createdAt: true,
});
export const insertAttitudeVoteSchema = createInsertSchema(attitudeVotes).omit({
  id: true,
  startedAt: true,
});
export const insertAttitudeBallotSchema = createInsertSchema(attitudeBallots).omit({
  id: true,
  createdAt: true,
});
export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  createdAt: true,
});

// Tutoring System for Pro members
export const tutoringSession = pgTable("tutoring_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tutorId: text("tutor_id").notNull(), // Pro member (580+ Fargo)
  rookieId: text("rookie_id").notNull(), // Rookie being tutored
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull().default(30), // Minutes
  status: text("status").notNull().default("scheduled"), // "scheduled", "completed", "cancelled"
  rookieConfirmed: boolean("rookie_confirmed").default(false),
  creditAmount: integer("credit_amount").default(1000), // $10 in cents
  creditApplied: boolean("credit_applied").default(false),
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tutoringCredits = pgTable("tutoring_credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tutorId: text("tutor_id").notNull(),
  sessionId: varchar("session_id").references(() => tutoringSession.id),
  amount: integer("amount").notNull(), // Credits in cents
  applied: boolean("applied").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Commission and earnings tracking tables
export const commissionRates = pgTable("commission_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorId: text("operator_id").notNull(), // References users table
  membershipTier: text("membership_tier").notNull(), // "none", "basic", "pro"
  platformCommissionBps: integer("platform_commission_bps").notNull(), // Basis points (1000 = 10%)
  operatorCommissionBps: integer("operator_commission_bps").notNull(), // Basis points
  escrowCommissionBps: integer("escrow_commission_bps").default(250), // 2.5% default for sidepots
  effectiveDate: timestamp("effective_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const platformEarnings = pgTable("platform_earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorId: text("operator_id").notNull(),
  sourceType: text("source_type").notNull(), // "match_commission", "membership_fee", "escrow_fee", "tournament_fee"
  sourceId: text("source_id"), // Reference to match, subscription, etc.
  grossAmount: integer("gross_amount").notNull(), // Total amount in cents
  platformAmount: integer("platform_amount").notNull(), // Platform cut in cents
  operatorAmount: integer("operator_amount").notNull(), // Operator cut in cents
  platformCommissionBps: integer("platform_commission_bps").notNull(),
  operatorCommissionBps: integer("operator_commission_bps").notNull(),
  settlementStatus: text("settlement_status").default("pending"), // "pending", "settled", "disputed"
  settledAt: timestamp("settled_at"),
  stripeTransferId: text("stripe_transfer_id"), // For operator payouts
  createdAt: timestamp("created_at").defaultNow(),
});

export const membershipEarnings = pgTable("membership_earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionId: text("subscription_id").notNull(), // Stripe subscription ID
  operatorId: text("operator_id").notNull(),
  playerId: text("player_id").notNull(),
  membershipTier: text("membership_tier").notNull(), // "rookie", "basic", "pro"
  grossAmount: integer("gross_amount").notNull(), // Total membership fee
  platformAmount: integer("platform_amount").notNull(), // Platform share
  operatorAmount: integer("operator_amount").notNull(), // Operator commission
  billingPeriodStart: timestamp("billing_period_start").notNull(),
  billingPeriodEnd: timestamp("billing_period_end").notNull(),
  processedAt: timestamp("processed_at").defaultNow(),
});

export const operatorPayouts = pgTable("operator_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorId: text("operator_id").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  totalEarnings: integer("total_earnings").notNull(), // Total operator earnings in cents
  matchCommissions: integer("match_commissions").default(0),
  membershipCommissions: integer("membership_commissions").default(0),
  escrowCommissions: integer("escrow_commissions").default(0),
  otherEarnings: integer("other_earnings").default(0),
  stripeTransferId: text("stripe_transfer_id"),
  payoutStatus: text("payout_status").default("pending"), // "pending", "processing", "completed", "failed"
  payoutMethod: text("payout_method").default("stripe_transfer"), // "stripe_transfer", "manual", "held"
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === MATCH DIVISION SYSTEM ===

// Match Divisions: Poolhall vs Poolhall, City vs City, State vs State
export const matchDivisions = pgTable("match_divisions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "poolhall", "city", "state"
  displayName: text("display_name").notNull(), // "Poolhall vs Poolhall", "City vs City", "State vs State"
  minTeamSize: integer("min_team_size").notNull(), // 2, 5, 10
  maxTeamSize: integer("max_team_size").notNull(), // 5, 10, 12
  entryFeeMin: integer("entry_fee_min").notNull(), // Minimum entry fee in cents
  entryFeeMax: integer("entry_fee_max").notNull(), // Maximum entry fee in cents
  requiresStreaming: boolean("requires_streaming").default(false), // City and State require streaming
  requiresCaptain: boolean("requires_captain").default(false), // City and State require captain
  allowsSideBets: boolean("allows_side_bets").default(false), // City and State allow side bets
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Operator Tiers with revenue splits
export const operatorTiers = pgTable("operator_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "rookie_hall", "basic_hall", "elite_operator", "franchise"
  displayName: text("display_name").notNull(), // "Rookie Hall", "Basic Hall", etc.
  monthlyFee: integer("monthly_fee").notNull(), // Fee in cents
  revenueSplitPercent: integer("revenue_split_percent").notNull(), // Percentage to Action Ladder (5 or 10)
  maxTeams: integer("max_teams"), // null = unlimited for franchise
  hasPromoTools: boolean("has_promo_tools").default(false),
  hasLiveStreamBonus: boolean("has_live_stream_bonus").default(false),
  hasResellRights: boolean("has_resell_rights").default(false),
  description: text("description"),
  features: text("features").array(), // Array of feature descriptions
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Team Stripe Connect Accounts for payouts
export const teamStripeAccounts = pgTable("team_stripe_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: text("team_id").notNull().unique(), // References teams table
  stripeAccountId: text("stripe_account_id").notNull().unique(), // Stripe Connect Express account ID
  accountStatus: text("account_status").default("pending"), // "pending", "active", "restricted", "inactive"
  onboardingCompleted: boolean("onboarding_completed").default(false),
  detailsSubmitted: boolean("details_submitted").default(false),
  payoutsEnabled: boolean("payouts_enabled").default(false),
  chargesEnabled: boolean("charges_enabled").default(false),
  businessType: text("business_type"), // "individual", "company"
  country: text("country").default("US"),
  email: text("email"),
  lastOnboardingRefresh: timestamp("last_onboarding_refresh"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Match Entries with Stripe metadata and division tracking
export const matchEntries = pgTable("match_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: text("match_id").notNull().unique(), // Unique match identifier
  divisionId: text("division_id").notNull(), // References match_divisions
  homeTeamId: text("home_team_id").notNull(),
  awayTeamId: text("away_team_id"), // null if open challenge
  entryFeePerPlayer: integer("entry_fee_per_player").notNull(), // Fee per player in cents
  totalStake: integer("total_stake").notNull(), // Total match stake
  stripeCheckoutSessionId: text("stripe_checkout_session_id"), // Stripe Checkout session
  stripePaymentIntentId: text("stripe_payment_intent_id"), // Stripe Payment Intent
  paymentStatus: text("payment_status").default("pending"), // "pending", "paid", "failed", "refunded"
  matchStatus: text("match_status").default("open"), // "open", "accepted", "in_progress", "completed", "cancelled"
  winnerId: text("winner_id"), // Winning team ID
  homeScore: integer("home_score").default(0),
  awayScore: integer("away_score").default(0),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  venueId: text("venue_id"), // Where match is played
  streamUrl: text("stream_url"), // Live stream link if applicable
  captainHomeId: text("captain_home_id"), // Team captain for home team
  captainAwayId: text("captain_away_id"), // Team captain for away team
  operatorId: text("operator_id").notNull(), // Managing operator
  metadata: jsonb("metadata"), // Additional match metadata from Stripe
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payout Distribution tracking
export const payoutDistributions = pgTable("payout_distributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchEntryId: text("match_entry_id").notNull().unique(), // References match_entries
  winningTeamId: text("winning_team_id").notNull(),
  totalPayout: integer("total_payout").notNull(), // Amount paid out in cents
  platformFee: integer("platform_fee").notNull(), // Action Ladder's cut
  operatorFee: integer("operator_fee").notNull(), // Operator's commission
  teamPayout: integer("team_payout").notNull(), // Amount sent to team
  stripeTransferId: text("stripe_transfer_id"), // Stripe Transfer ID
  transferStatus: text("transfer_status").default("pending"), // "pending", "in_transit", "paid", "failed"
  transferredAt: timestamp("transferred_at"),
  operatorTierAtPayout: text("operator_tier_at_payout"), // Tier when payout was made
  revenueSplitAtPayout: integer("revenue_split_at_payout"), // Revenue split % at time of payout
  payoutMethod: text("payout_method").default("stripe_transfer"), // "stripe_transfer", "manual"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Team Registration with entry fees
export const teamRegistrations = pgTable("team_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: text("team_id").notNull(),
  divisionId: text("division_id").notNull(),
  captainId: text("captain_id").notNull(),
  teamName: text("team_name").notNull(),
  logoUrl: text("logo_url"),
  playerRoster: text("player_roster").array(), // Array of player IDs
  entryFeePaid: boolean("entry_fee_paid").default(false),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  registrationStatus: text("registration_status").default("pending"), // "pending", "confirmed", "cancelled"
  confirmedAt: timestamp("confirmed_at"),
  bracketPosition: integer("bracket_position"), // Position in tournament bracket
  seedRank: integer("seed_rank"), // Seeding rank
  operatorId: text("operator_id").notNull(),
  venueId: text("venue_id"),
  seasonId: text("season_id"), // Tournament/season identifier
  metadata: jsonb("metadata"), // Additional registration data
  createdAt: timestamp("created_at").defaultNow(),
});

// Challenge pool types
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type ChallengePool = typeof challengePools.$inferSelect;
export type InsertChallengePool = z.infer<typeof insertChallengePoolSchema>;
export type ChallengeEntry = typeof challengeEntries.$inferSelect;
export type InsertChallengeEntry = z.infer<typeof insertChallengeEntrySchema>;
export type LedgerEntry = typeof ledger.$inferSelect;
export type InsertLedgerEntry = z.infer<typeof insertLedgerSchema>;
export type Resolution = typeof resolutions.$inferSelect;
export type InsertResolution = z.infer<typeof insertResolutionSchema>;
export type WeightRule = typeof weightRules.$inferSelect;
export type InsertWeightRule = z.infer<typeof insertWeightRuleSchema>;
export type MembershipSubscription = typeof membershipSubscriptions.$inferSelect;
export type InsertMembershipSubscription = z.infer<typeof insertMembershipSubscriptionSchema>;

export const insertTutoringSessionSchema = createInsertSchema(tutoringSession).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertTutoringCreditsSchema = createInsertSchema(tutoringCredits).omit({
  id: true,
  createdAt: true,
});

export type TutoringSession = typeof tutoringSession.$inferSelect;
export type InsertTutoringSession = z.infer<typeof insertTutoringSessionSchema>;
export type TutoringCredits = typeof tutoringCredits.$inferSelect;
export type InsertTutoringCredits = z.infer<typeof insertTutoringCreditsSchema>;

// Insert schemas for commission and earnings tables
export const insertCommissionRateSchema = createInsertSchema(commissionRates).omit({
  id: true,
  createdAt: true,
});

export const insertPlatformEarningsSchema = createInsertSchema(platformEarnings).omit({
  id: true,
  createdAt: true,
});

export const insertMembershipEarningsSchema = createInsertSchema(membershipEarnings).omit({
  id: true,
  processedAt: true,
});

export const insertOperatorPayoutSchema = createInsertSchema(operatorPayouts).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

// Commission and earnings types
export type CommissionRate = typeof commissionRates.$inferSelect;
export type InsertCommissionRate = z.infer<typeof insertCommissionRateSchema>;
export type PlatformEarnings = typeof platformEarnings.$inferSelect;
export type InsertPlatformEarnings = z.infer<typeof insertPlatformEarningsSchema>;
export type MembershipEarnings = typeof membershipEarnings.$inferSelect;
export type InsertMembershipEarnings = z.infer<typeof insertMembershipEarningsSchema>;
export type OperatorPayout = typeof operatorPayouts.$inferSelect;
export type InsertOperatorPayout = z.infer<typeof insertOperatorPayoutSchema>;

// Insert schemas for new match division system
export const insertMatchDivisionSchema = createInsertSchema(matchDivisions).omit({
  id: true,
  createdAt: true,
});

export const insertOperatorTierSchema = createInsertSchema(operatorTiers).omit({
  id: true,
  createdAt: true,
});

export const insertTeamStripeAccountSchema = createInsertSchema(teamStripeAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMatchEntrySchema = createInsertSchema(matchEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPayoutDistributionSchema = createInsertSchema(payoutDistributions).omit({
  id: true,
  createdAt: true,
});

export const insertTeamRegistrationSchema = createInsertSchema(teamRegistrations).omit({
  id: true,
  createdAt: true,
});

// === FILE UPLOAD TRACKING ===

// Track uploaded files with metadata and access control
export const uploadedFiles = pgTable("uploaded_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(), // Owner of the file
  fileName: text("file_name").notNull(), // Original file name
  fileSize: integer("file_size").notNull(), // File size in bytes
  mimeType: text("mime_type").notNull(), // File MIME type
  category: text("category").notNull().default("general_upload"), // FileCategory from objectStorage
  objectPath: text("object_path").notNull().unique(), // Object storage path (/objects/...)
  visibility: text("visibility").notNull().default("private"), // "public" or "private"
  description: text("description"), // Optional file description
  tags: text("tags").array(), // Searchable tags
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at"),
  downloadCount: integer("download_count").default(0),
  isActive: boolean("is_active").default(true), // Soft delete flag
});

// Track file sharing permissions (extends ACL system)
export const fileShares = pgTable("file_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileId: text("file_id").notNull(), // Links to uploaded_files
  sharedWithUserId: text("shared_with_user_id"), // Specific user (optional)
  sharedWithRole: text("shared_with_role"), // Role-based sharing (optional)
  sharedWithHallId: text("shared_with_hall_id"), // Hall-based sharing (optional)
  permission: text("permission").notNull().default("read"), // "read" or "write"
  expiresAt: timestamp("expires_at"), // Optional expiration
  sharedBy: text("shared_by").notNull(), // User who created the share
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Insert schemas for file tracking
export const insertUploadedFileSchema = createInsertSchema(uploadedFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertFileShareSchema = createInsertSchema(fileShares).omit({
  id: true,
  createdAt: true,
});

// File tracking types
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type InsertUploadedFile = z.infer<typeof insertUploadedFileSchema>;
export type FileShare = typeof fileShares.$inferSelect;
export type InsertFileShare = z.infer<typeof insertFileShareSchema>;

// === FAN TIPS SYSTEM ===

// Fan tips for supporting players during matches and events
export const fanTips = pgTable("fan_tips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fanUserId: text("fan_user_id").notNull(), // User giving the tip
  recipientUserId: text("recipient_user_id").notNull(), // Player receiving the tip
  amount: integer("amount").notNull(), // Tip amount in cents
  message: text("message"), // Optional message from fan
  matchId: text("match_id"), // Associated match (optional)
  tournamentId: text("tournament_id"), // Associated tournament (optional)
  isAnonymous: boolean("is_anonymous").default(false), // Anonymous tip option
  stripePaymentIntentId: text("stripe_payment_intent_id"), // Stripe payment
  platformFeeBps: integer("platform_fee_bps").default(250), // 2.5% platform fee
  platformFeeAmount: integer("platform_fee_amount").notNull(), // Platform fee in cents
  netAmount: integer("net_amount").notNull(), // Amount after fees
  status: text("status").default("pending"), // "pending", "completed", "failed", "refunded"
  processedAt: timestamp("processed_at"),
  refundedAt: timestamp("refunded_at"),
  refundReason: text("refund_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Fan tip analytics and leaderboards
export const fanTipLeaderboards = pgTable("fan_tip_leaderboards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull().unique(),
  totalTipsReceived: integer("total_tips_received").default(0), // Total in cents
  totalTipsCount: integer("total_tips_count").default(0), // Number of tips
  averageTipAmount: integer("average_tip_amount").default(0), // Average tip in cents
  biggestTip: integer("biggest_tip").default(0), // Largest single tip
  thisMonthTips: integer("this_month_tips").default(0), // Current month total
  thisWeekTips: integer("this_week_tips").default(0), // Current week total
  fanCount: integer("fan_count").default(0), // Unique fans who tipped
  rank: integer("rank").default(0), // Leaderboard rank
  lastTipAt: timestamp("last_tip_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === GIFTED SUBSCRIPTIONS SYSTEM ===

// Gifted subscription purchases and tracking
export const giftedSubscriptions = pgTable("gifted_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  giftedBy: text("gifted_by").notNull(), // User who purchased the gift
  giftedTo: text("gifted_to").notNull(), // User receiving the gift
  subscriptionTier: text("subscription_tier").notNull(), // "rookie", "standard", "premium"
  monthlyPrice: integer("monthly_price").notNull(), // Price paid in cents
  durationMonths: integer("duration_months").notNull(), // How many months gifted
  totalAmount: integer("total_amount").notNull(), // Total amount paid
  message: text("message"), // Optional gift message
  isAnonymous: boolean("is_anonymous").default(false), // Anonymous gift option
  stripePaymentIntentId: text("stripe_payment_intent_id"), // Stripe payment
  stripeSubscriptionId: text("stripe_subscription_id"), // Created subscription
  status: text("status").default("pending"), // "pending", "activated", "expired", "cancelled"
  activatedAt: timestamp("activated_at"), // When recipient activated
  expiresAt: timestamp("expires_at").notNull(), // When gift expires
  remainingMonths: integer("remaining_months").notNull(), // Months left on gift
  autoRenew: boolean("auto_renew").default(false), // Auto-renew after gift expires
  notificationSent: boolean("notification_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Gift subscription redemption tracking
export const giftRedemptions = pgTable("gift_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  giftId: text("gift_id").notNull(), // Links to gifted_subscriptions
  redeemedBy: text("redeemed_by").notNull(), // User who redeemed
  redeemedAt: timestamp("redeemed_at").defaultNow(),
  ipAddress: text("ip_address"), // For fraud prevention
  userAgent: text("user_agent"), // Browser info
  redemptionCode: text("redemption_code"), // Optional redemption code
  thankYouMessageSent: boolean("thank_you_message_sent").default(false),
});

// Enhanced player incentive tracking for your competition system
export const playerIncentives = pgTable("player_incentives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull().unique(),
  currentStreak: integer("current_streak").default(0), // Current win streak
  longestStreak: integer("longest_streak").default(0), // All-time longest streak
  weeklyWins: integer("weekly_wins").default(0), // Wins this week
  monthlyWins: integer("monthly_wins").default(0), // Wins this month
  weeklyPrizeEligible: boolean("weekly_prize_eligible").default(true),
  monthlyPrizeEligible: boolean("monthly_prize_eligible").default(true),
  streakBonusCredits: integer("streak_bonus_credits").default(0), // Accumulated credits from streaks
  progressPoints: integer("progress_points").default(0), // General progress points
  milestoneLevel: integer("milestone_level").default(1), // Current milestone level
  nextMilestoneAt: integer("next_milestone_at").default(100), // Points needed for next level
  lastStreakBonusAt: timestamp("last_streak_bonus_at"),
  lastWeeklyResetAt: timestamp("last_weekly_reset_at"),
  lastMonthlyResetAt: timestamp("last_monthly_reset_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ================================
// CHALLENGE CALENDAR & AUTO FEES SYSTEM
// ================================

export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  aPlayerId: text("a_player_id").notNull(), // Challenger
  bPlayerId: text("b_player_id").notNull(), // Opponent
  aPlayerName: text("a_player_name").notNull(),
  bPlayerName: text("b_player_name").notNull(),
  
  // Match details
  gameType: text("game_type").notNull(), // "8-ball", "9-ball", "10-ball", etc
  tableType: text("table_type").notNull(), // "7ft", "8ft", "9ft"
  stakes: integer("stakes").notNull(), // in cents
  
  // Scheduling
  scheduledAt: timestamp("scheduled_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(90),
  hallId: text("hall_id").notNull(),
  hallName: text("hall_name").notNull(),
  
  // Status tracking
  status: text("status").notNull().default("scheduled"), // "scheduled", "checked_in", "in_progress", "completed", "cancelled"
  checkedInAt: timestamp("checked_in_at"),
  completedAt: timestamp("completed_at"),
  winnerId: text("winner_id"),
  
  // Auto-generated content
  posterImageUrl: text("poster_image_url"), // AI-generated match poster
  description: text("description"),
  
  // Fee tracking
  lateFeesApplied: boolean("late_fees_applied").default(false),
  noShowFeesApplied: boolean("no_show_fees_applied").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const challengeFees = pgTable("challenge_fees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: text("challenge_id").notNull(),
  playerId: text("player_id").notNull(),
  feeType: text("fee_type").notNull(), // "late", "no_show", "cancellation"
  amount: integer("amount").notNull(), // in cents
  
  // Timing details
  scheduledAt: timestamp("scheduled_at").notNull(),
  actualAt: timestamp("actual_at"), // When they actually arrived/cancelled
  minutesLate: integer("minutes_late").default(0),
  
  // Payment processing
  status: text("status").notNull().default("pending"), // "pending", "charged", "waived", "failed"
  stripeChargeId: text("stripe_charge_id"),
  stripeCustomerId: text("stripe_customer_id"),
  chargedAt: timestamp("charged_at"),
  waivedAt: timestamp("waived_at"),
  waivedBy: text("waived_by"), // operator ID who waived the fee
  waiverReason: text("waiver_reason"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const challengeCheckIns = pgTable("challenge_check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: text("challenge_id").notNull(),
  playerId: text("player_id").notNull(),
  checkedInAt: timestamp("checked_in_at").notNull(),
  checkedInBy: text("checked_in_by"), // "player" or "operator" or "qr_scan"  
  location: text("location"), // "mobile_app", "front_desk", "qr_code"
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Unique constraint to prevent duplicate check-ins for the same challenge/player
  uniqueCheckIn: unique().on(table.challengeId, table.playerId)
}));

// QR Code Security - Nonce tracking for replay protection across instances
export const qrCodeNonces = pgTable("qr_code_nonces", {
  nonce: text("nonce").primaryKey(),
  challengeId: text("challenge_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
}, (table) => {
  return {
    expiresAtIdx: index("qr_nonces_expires_at_idx").on(table.expiresAt),
    challengeIdx: index("qr_nonces_challenge_idx").on(table.challengeId),
  };
});

export const challengePolicies = pgTable("challenge_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hallId: text("hall_id").notNull(),
  
  // Late fees (15-45 minutes)
  lateFeeEnabled: boolean("late_fee_enabled").default(true),
  lateFeeAmount: integer("late_fee_amount").default(500), // $5 in cents
  lateFeeThresholdMinutes: integer("late_fee_threshold_minutes").default(15),
  
  // No-show fees (>45 minutes)
  noShowFeeEnabled: boolean("no_show_fee_enabled").default(true),
  noShowFeeAmount: integer("no_show_fee_amount").default(1500), // $15 in cents
  noShowThresholdMinutes: integer("no_show_threshold_minutes").default(45),
  
  // Cancellation fees
  cancellationFeeEnabled: boolean("cancellation_fee_enabled").default(true),
  cancellationFeeAmount: integer("cancellation_fee_amount").default(1000), // $10 in cents
  cancellationThresholdHours: integer("cancellation_threshold_hours").default(24),
  
  // Grace periods
  gracePeriodMinutes: integer("grace_period_minutes").default(5),
  
  // Auto-charge settings
  autoChargeEnabled: boolean("auto_charge_enabled").default(true),
  requireConfirmation: boolean("require_confirmation").default(false),
  
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: text("updated_by").notNull(),
});

// Secure iCal feed tokens for personal calendar access
export const icalFeedTokens = pgTable("ical_feed_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  token: text("token").notNull().unique(), // Cryptographically secure random token
  name: text("name"), // Optional descriptive name (e.g., "iPhone Calendar", "Google Calendar")
  
  // Security features
  isActive: boolean("is_active").default(true),
  lastUsedAt: timestamp("last_used_at"),
  useCount: integer("use_count").default(0),
  
  // Access control options
  hallId: text("hall_id"), // Restrict to specific hall if set
  includeCompleted: boolean("include_completed").default(false),
  
  // Token lifecycle
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration
  revokedAt: timestamp("revoked_at"),
  revokedBy: text("revoked_by"), // Who revoked the token
  revokeReason: text("revoke_reason"),
}, (table) => {
  return {
    playerIdIdx: index("ical_tokens_player_id_idx").on(table.playerId),
    tokenIdx: index("ical_tokens_token_idx").on(table.token),
    activeIdx: index("ical_tokens_active_idx").on(table.isActive),
    expiresIdx: index("ical_tokens_expires_idx").on(table.expiresAt),
  };
});

// Match division system types
export type MatchDivision = typeof matchDivisions.$inferSelect;
export type InsertMatchDivision = z.infer<typeof insertMatchDivisionSchema>;
export type OperatorTier = typeof operatorTiers.$inferSelect;
export type InsertOperatorTier = z.infer<typeof insertOperatorTierSchema>;
export type TeamStripeAccount = typeof teamStripeAccounts.$inferSelect;
export type InsertTeamStripeAccount = z.infer<typeof insertTeamStripeAccountSchema>;
export type MatchEntry = typeof matchEntries.$inferSelect;
export type InsertMatchEntry = z.infer<typeof insertMatchEntrySchema>;
export type PayoutDistribution = typeof payoutDistributions.$inferSelect;
export type InsertPayoutDistribution = z.infer<typeof insertPayoutDistributionSchema>;
export type TeamRegistration = typeof teamRegistrations.$inferSelect;
export type InsertTeamRegistration = z.infer<typeof insertTeamRegistrationSchema>;

// Insert schemas for fan tips system
export const insertFanTipSchema = createInsertSchema(fanTips).omit({
  id: true,
  createdAt: true,
  processedAt: true,
  refundedAt: true,
});

export const insertFanTipLeaderboardSchema = createInsertSchema(fanTipLeaderboards).omit({
  id: true,
  updatedAt: true,
});

// Insert schemas for gifted subscriptions
export const insertGiftedSubscriptionSchema = createInsertSchema(giftedSubscriptions).omit({
  id: true,
  createdAt: true,
  activatedAt: true,
});

export const insertGiftRedemptionSchema = createInsertSchema(giftRedemptions).omit({
  id: true,
  redeemedAt: true,
});

export const insertPlayerIncentiveSchema = createInsertSchema(playerIncentives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Insert schemas for Challenge Calendar system
export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChallengeFeeSchema = createInsertSchema(challengeFees).omit({
  id: true,
  createdAt: true,
});

export const insertChallengeCheckInSchema = createInsertSchema(challengeCheckIns).omit({
  id: true,
  createdAt: true,
});

export const insertQrCodeNonceSchema = createInsertSchema(qrCodeNonces).omit({
  createdAt: true,
});

export const insertChallengePolicySchema = createInsertSchema(challengePolicies).omit({
  id: true,
  updatedAt: true,
});

export const insertIcalFeedTokenSchema = createInsertSchema(icalFeedTokens).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
  useCount: true,
  revokedAt: true,
});

// Fan tips and gifts types
export type FanTip = typeof fanTips.$inferSelect;
export type InsertFanTip = z.infer<typeof insertFanTipSchema>;
export type FanTipLeaderboard = typeof fanTipLeaderboards.$inferSelect;
export type InsertFanTipLeaderboard = z.infer<typeof insertFanTipLeaderboardSchema>;
export type GiftedSubscription = typeof giftedSubscriptions.$inferSelect;
export type InsertGiftedSubscription = z.infer<typeof insertGiftedSubscriptionSchema>;
export type GiftRedemption = typeof giftRedemptions.$inferSelect;
export type InsertGiftRedemption = z.infer<typeof insertGiftRedemptionSchema>;
export type PlayerIncentive = typeof playerIncentives.$inferSelect;
export type InsertPlayerIncentive = z.infer<typeof insertPlayerIncentiveSchema>;

// Challenge Calendar types
export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type ChallengeFee = typeof challengeFees.$inferSelect;
export type InsertChallengeFee = z.infer<typeof insertChallengeFeeSchema>;
export type ChallengeCheckIn = typeof challengeCheckIns.$inferSelect;
export type InsertChallengeCheckIn = z.infer<typeof insertChallengeCheckInSchema>;
export type ChallengePolicy = typeof challengePolicies.$inferSelect;
export type InsertChallengePolicy = z.infer<typeof insertChallengePolicySchema>;
export type QrCodeNonce = typeof qrCodeNonces.$inferSelect;
export type InsertQrCodeNonce = z.infer<typeof insertQrCodeNonceSchema>;
export type IcalFeedToken = typeof icalFeedTokens.$inferSelect;
export type InsertIcalFeedToken = z.infer<typeof insertIcalFeedTokenSchema>;

// === ENHANCED PAYMENT SYSTEM ===

// Payment methods collected via SetupIntent during onboarding
export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  stripePaymentMethodId: text("stripe_payment_method_id").notNull().unique(),
  stripeSetupIntentId: text("stripe_setup_intent_id"),
  type: text("type").notNull(), // "card", "bank_account", etc.
  brand: text("brand"), // "visa", "mastercard", etc.
  last4: text("last4"), // Last 4 digits
  expiryMonth: integer("expiry_month"),
  expiryYear: integer("expiry_year"),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"), // Additional payment method details
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("payment_methods_user_id_idx").on(table.userId),
  defaultIdx: index("payment_methods_default_idx").on(table.userId, table.isDefault),
}));

// Enhanced stakes hold system with manual capture
export const stakesHolds = pgTable("stakes_holds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: text("challenge_id").notNull(),
  playerId: text("player_id").notNull(),
  amount: integer("amount").notNull(), // Stakes amount in cents
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull().unique(),
  status: text("status").default("held"), // "held", "captured", "released", "expired"
  holdExpiresAt: timestamp("hold_expires_at").notNull(), // ~7 days from creation
  capturedAt: timestamp("captured_at"),
  releasedAt: timestamp("released_at"),
  captureReason: text("capture_reason"), // "winner", "no_show", "forfeit"
  releaseReason: text("release_reason"), // "cancelled", "dispute_resolved"
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  challengeIdx: index("stakes_holds_challenge_idx").on(table.challengeId),
  playerIdx: index("stakes_holds_player_idx").on(table.playerId),
  statusIdx: index("stakes_holds_status_idx").on(table.status),
}));

// === NOTIFICATION SYSTEM ===

// User notification preferences and delivery settings
export const notificationSettings = pgTable("notification_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  // Email settings
  emailEnabled: boolean("email_enabled").default(true),
  emailAddress: text("email_address"),
  emailVerified: boolean("email_verified").default(false),
  // SMS settings  
  smsEnabled: boolean("sms_enabled").default(false),
  phoneNumber: text("phone_number"),
  phoneVerified: boolean("phone_verified").default(false),
  // Push notifications
  pushEnabled: boolean("push_enabled").default(true),
  // Notification types
  reminderT24h: boolean("reminder_t24h").default(true),
  reminderT2h: boolean("reminder_t2h").default(true),
  reminderT30m: boolean("reminder_t30m").default(true),
  windowOpenPing: boolean("window_open_ping").default(true),
  lateClockStarted: boolean("late_clock_started").default(true),
  noShowFeeCharged: boolean("no_show_fee_charged").default(true),
  matchResults: boolean("match_results").default(true),
  // Quiet hours
  quietHoursEnabled: boolean("quiet_hours_enabled").default(false),
  quietHoursStart: text("quiet_hours_start").default("22:00"), // 24-hour format
  quietHoursEnd: text("quiet_hours_end").default("08:00"),
  timezone: text("timezone").default("America/New_York"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notification delivery log with status tracking
export const notificationDeliveries = pgTable("notification_deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  challengeId: text("challenge_id"),
  type: text("type").notNull(), // "reminder_t24h", "reminder_t2h", "late_fee", etc.
  channel: text("channel").notNull(), // "email", "sms", "push"
  recipient: text("recipient").notNull(), // email/phone/device token
  subject: text("subject"),
  content: text("content").notNull(),
  status: text("status").default("pending"), // "pending", "sent", "delivered", "failed", "bounced"
  providerId: text("provider_id"), // SendGrid message ID, Twilio SID, etc.
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdx: index("notification_deliveries_user_idx").on(table.userId),
  challengeIdx: index("notification_deliveries_challenge_idx").on(table.challengeId),
  statusIdx: index("notification_deliveries_status_idx").on(table.status),
  typeIdx: index("notification_deliveries_type_idx").on(table.type),
}));

// === DISPUTE MANAGEMENT SYSTEM ===

// Evidence and dispute resolution tracking
export const disputeResolutions = pgTable("dispute_resolutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: text("challenge_id").notNull(),
  challengeFeeId: text("challenge_fee_id"), // Link to specific fee being disputed
  disputeType: text("dispute_type").notNull(), // "late_fee", "no_show_fee", "stakes_dispute", "other"
  filedBy: text("filed_by").notNull(), // Player ID who filed dispute
  filedAgainst: text("filed_against"), // Player ID dispute is against (if applicable)
  description: text("description").notNull(),
  // Evidence attachments
  evidenceUrls: text("evidence_urls").array(), // URLs to uploaded evidence files
  evidenceTypes: text("evidence_types").array(), // "cctv", "receipt", "witness", "photo", "video"
  evidenceNotes: text("evidence_notes"),
  // Resolution
  status: text("status").default("open"), // "open", "investigating", "resolved", "rejected"
  resolution: text("resolution"), // Final resolution explanation
  resolvedBy: text("resolved_by"), // Operator/admin who resolved
  resolutionAction: text("resolution_action"), // "waive_fee", "partial_refund", "full_refund", "uphold_fee"
  refundAmount: integer("refund_amount").default(0), // Refund amount in cents
  operatorNotes: text("operator_notes"),
  // Timeline
  filedAt: timestamp("filed_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  // Audit trail
  auditLog: jsonb("audit_log"), // JSON array of status changes and actions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  challengeIdx: index("dispute_resolutions_challenge_idx").on(table.challengeId),
  statusIdx: index("dispute_resolutions_status_idx").on(table.status),
  filedByIdx: index("dispute_resolutions_filed_by_idx").on(table.filedBy),
}));

// === ANTI-ABUSE SYSTEM ===

// Player cooldown and blacklist management
export const playerCooldowns = pgTable("player_cooldowns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  cooldownType: text("cooldown_type").notNull(), // "no_show", "late_cancel", "abuse", "manual"
  reason: text("reason").notNull(),
  appliedBy: text("applied_by").notNull(), // Admin/system who applied cooldown
  severity: text("severity").default("minor"), // "minor", "major", "severe"
  noShowCount: integer("no_show_count").default(0), // Count in last 60 days
  cooldownDays: integer("cooldown_days").default(14),
  isActive: boolean("is_active").default(true),
  canOperatorLift: boolean("can_operator_lift").default(true),
  effectiveAt: timestamp("effective_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  liftedAt: timestamp("lifted_at"),
  liftedBy: text("lifted_by"), // Who lifted the cooldown early
  liftReason: text("lift_reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdx: index("player_cooldowns_player_idx").on(table.playerId),
  activeIdx: index("player_cooldowns_active_idx").on(table.isActive),
  expiresIdx: index("player_cooldowns_expires_idx").on(table.expiresAt),
}));

// Device attestation for check-in verification
export const deviceAttestations = pgTable("device_attestations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  challengeId: text("challenge_id").notNull(),
  deviceFingerprint: text("device_fingerprint").notNull(),
  geolocation: jsonb("geolocation"), // lat, lng, accuracy, timestamp
  withinGeofence: boolean("within_geofence").default(false),
  distanceFromHall: real("distance_from_hall"), // meters
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  isStaffScan: boolean("is_staff_scan").default(false),
  scannerStaffId: text("scanner_staff_id"),
  verificationMethod: text("verification_method").notNull(), // "geofence", "staff_scan", "manual_override"
  riskScore: real("risk_score").default(0), // 0-10 risk assessment
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  playerIdx: index("device_attestations_player_idx").on(table.playerId),
  challengeIdx: index("device_attestations_challenge_idx").on(table.challengeId),
  riskIdx: index("device_attestations_risk_idx").on(table.riskScore),
}));

// === JOB QUEUE SYSTEM ===

// Background job tracking for notifications and processing
export const jobQueue = pgTable("job_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobType: text("job_type").notNull(), // "notification", "fee_evaluation", "poster_generation", etc.
  payload: jsonb("payload").notNull(), // Job-specific data
  priority: integer("priority").default(5), // 1-10, higher = more priority
  status: text("status").default("pending"), // "pending", "processing", "completed", "failed", "retrying"
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  processedBy: text("processed_by"), // Worker ID that processed the job
  scheduledFor: timestamp("scheduled_for").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  result: jsonb("result"), // Job result data
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  statusIdx: index("job_queue_status_idx").on(table.status),
  priorityIdx: index("job_queue_priority_idx").on(table.priority),
  scheduledIdx: index("job_queue_scheduled_idx").on(table.scheduledFor),
  typeIdx: index("job_queue_type_idx").on(table.jobType),
}));

// === METRICS & MONITORING ===

// System health and business metrics tracking
export const systemMetrics = pgTable("system_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricType: text("metric_type").notNull(), // "fee_rate", "no_show_rate", "charge_failure", etc.
  hallId: text("hall_id"), // Null for system-wide metrics
  timeWindow: text("time_window").notNull(), // "hour", "day", "week", "month"
  windowStart: timestamp("window_start").notNull(),
  windowEnd: timestamp("window_end").notNull(),
  value: real("value").notNull(),
  count: integer("count").default(0),
  metadata: jsonb("metadata"), // Additional metric context
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  typeIdx: index("system_metrics_type_idx").on(table.metricType),
  hallIdx: index("system_metrics_hall_idx").on(table.hallId),
  windowIdx: index("system_metrics_window_idx").on(table.windowStart, table.windowEnd),
}));

// Alert configuration and firing history
export const systemAlerts = pgTable("system_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertType: text("alert_type").notNull(), // "evaluator_backlog", "webhook_failures", "charge_failures"
  severity: text("severity").default("medium"), // "low", "medium", "high", "critical"
  condition: text("condition").notNull(), // Alert trigger condition
  threshold: real("threshold").notNull(),
  currentValue: real("current_value"),
  isActive: boolean("is_active").default(true),
  isFiring: boolean("is_firing").default(false),
  lastTriggered: timestamp("last_triggered"),
  notificationChannels: text("notification_channels").array(), // "slack", "email", "sms"
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  typeIdx: index("system_alerts_type_idx").on(table.alertType),
  activeIdx: index("system_alerts_active_idx").on(table.isActive),
  firingIdx: index("system_alerts_firing_idx").on(table.isFiring),
}));

// Insert schemas for new tables
export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStakesHoldSchema = createInsertSchema(stakesHolds).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationDeliverySchema = createInsertSchema(notificationDeliveries).omit({
  id: true,
  createdAt: true,
});

export const insertDisputeResolutionSchema = createInsertSchema(disputeResolutions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  filedAt: true,
});

export const insertPlayerCooldownSchema = createInsertSchema(playerCooldowns).omit({
  id: true,
  createdAt: true,
});

export const insertDeviceAttestationSchema = createInsertSchema(deviceAttestations).omit({
  id: true,
  createdAt: true,
});

export const insertJobQueueSchema = createInsertSchema(jobQueue).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemMetricSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertSystemAlertSchema = createInsertSchema(systemAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for new tables
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type StakesHold = typeof stakesHolds.$inferSelect;
export type InsertStakesHold = z.infer<typeof insertStakesHoldSchema>;
export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
export type NotificationDelivery = typeof notificationDeliveries.$inferSelect;
export type InsertNotificationDelivery = z.infer<typeof insertNotificationDeliverySchema>;
export type DisputeResolution = typeof disputeResolutions.$inferSelect;
export type InsertDisputeResolution = z.infer<typeof insertDisputeResolutionSchema>;
export type PlayerCooldown = typeof playerCooldowns.$inferSelect;
export type InsertPlayerCooldown = z.infer<typeof insertPlayerCooldownSchema>;
export type DeviceAttestation = typeof deviceAttestations.$inferSelect;
export type InsertDeviceAttestation = z.infer<typeof insertDeviceAttestationSchema>;
export type JobQueue = typeof jobQueue.$inferSelect;
export type InsertJobQueue = z.infer<typeof insertJobQueueSchema>;
export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = z.infer<typeof insertSystemMetricSchema>;
export type SystemAlert = typeof systemAlerts.$inferSelect;
export type InsertSystemAlert = z.infer<typeof insertSystemAlertSchema>;

// Revenue Configuration table for persistent storage
export const revenueConfigs = pgTable("revenue_configs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(false),
  splitPercentages: jsonb("split_percentages").notNull(),
  commissionRates: jsonb("commission_rates").notNull(), 
  membershipPricing: jsonb("membership_pricing").notNull(),
  settings: jsonb("settings").notNull(),
  lastModified: timestamp("last_modified").defaultNow(),
  modifiedBy: text("modified_by").notNull(),
});

export const insertRevenueConfigSchema = createInsertSchema(revenueConfigs).omit({
  lastModified: true,
});

export type InsertRevenueConfig = z.infer<typeof insertRevenueConfigSchema>;
export type SelectRevenueConfig = typeof revenueConfigs.$inferSelect;

// === AI BILLIARDS COACH - TRAINING ANALYTICS ===

// Session analytics - tracks individual training/match sessions
export const sessionAnalytics = pgTable("session_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  hallId: text("hall_id").notNull(),
  ladderId: text("ladder_id"),
  sessionType: text("session_type").notNull(), // "practice" or "match"
  focusArea: text("focus_area"), // "Break", "Position Play", "Bank Shots", "Safety", "Speed Control", "General Practice"
  opponentId: text("opponent_id"),
  date: timestamp("date").notNull(),
  coachScore: real("coach_score").notNull(), // 0-100 AI coach rating
  hours: real("hours").notNull(), // Duration in hours
  win: boolean("win"), // If match type
  makePercentage: real("make_percentage"),
  breakSuccess: real("break_success"),
  avgBallsRun: real("avg_balls_run"),
  safetyWinPct: real("safety_win_pct"),
  positionalErrorIn: real("positional_error_in"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Individual shots within a session
export const shots = pgTable("shots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  timestamp: integer("timestamp").notNull(), // Milliseconds from session start
  result: text("result").notNull(), // "MAKE" or "MISS"
  shotType: text("shot_type").notNull(), // "cut", "bank", "kick", "safety", "break"
  cutAngleDeg: real("cut_angle_deg"),
  distanceIn: real("distance_in").notNull(), // Distance in inches
  spinType: text("spin_type").notNull(), // "none", "draw", "follow", "left", "right"
  cueSpeed: real("cue_speed"),
  positionalErrorIn: real("positional_error_in"), // Inches off target
  difficultyScore: real("difficulty_score"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ladder training scores - aggregated monthly scores for training ladder
export const ladderTrainingScores = pgTable("ladder_training_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  hallId: text("hall_id").notNull(),
  ladderId: text("ladder_id").notNull(),
  period: text("period").notNull(), // "YYYY-MM" format
  coachAvg: real("coach_avg").notNull(), // Average coach score
  hoursTotal: real("hours_total").notNull(), // Total training hours
  winRate: real("win_rate").notNull(), // Win percentage
  totalScore: real("total_score").notNull(), // Weighted: 0.5*coach + 0.3*hours_norm + 0.2*winRate
  rank: integer("rank").notNull(),
  isWinner: boolean("is_winner").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniquePlayerPeriod: unique("unique_player_period").on(table.playerId, table.hallId, table.ladderId, table.period),
}));

// Subscription rewards - track training ladder rewards
export const subscriptionRewards = pgTable("subscription_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: text("player_id").notNull(),
  hallId: text("hall_id").notNull(),
  ladderId: text("ladder_id").notNull(),
  period: text("period").notNull(), // "YYYY-MM" format
  rewardType: text("reward_type").notNull(), // "half" or "free"
  appliedToStripe: boolean("applied_to_stripe").default(false),
  stripeCouponId: text("stripe_coupon_id"),
  appliedDate: timestamp("applied_date"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueRewardPeriod: unique("unique_reward_period").on(table.playerId, table.hallId, table.ladderId, table.period),
}));

// Prize Pool Aggregation - Track all prize pool contributions and distributions
export const prizePools = pgTable("prize_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: text("pool_id").notNull().unique(), // e.g., "tournament_123", "monthly_2025_01"
  poolType: text("pool_type").notNull(), // "tournament", "monthly", "special_event"
  hallId: text("hall_id"), // Operator's hall identifier
  name: text("name").notNull(),
  description: text("description"),
  period: text("period"), // "YYYY-MM" for monthly pools
  totalContributions: integer("total_contributions").default(0), // Total in cents
  challengeFees: integer("challenge_fees").default(0), // Head-to-head challenge fees
  subscriptionFees: integer("subscription_fees").default(0), // Tournament % from subscriptions
  nonMemberFees: integer("non_member_fees").default(0), // Non-member match fees
  extras: integer("extras").default(0), // Break & Run, Hill-Hill, Fines, Sponsors
  platformFee: integer("platform_fee").default(0), // Platform commission in cents
  operatorCut: integer("operator_cut").default(0), // Operator share in cents
  trusteeCut: integer("trustee_cut").default(0), // Trustee/Admin share in cents
  growthFund: integer("growth_fund").default(0), // Growth fund allocation in cents
  availableForDistribution: integer("available_for_distribution").default(0), // Net prize pool
  distributed: integer("distributed").default(0), // Amount already distributed
  status: text("status").default("active"), // "active", "locked", "distributed", "completed"
  distributionPlan: jsonb("distribution_plan"), // JSON with distribution percentages
  lockedAt: timestamp("locked_at"), // When pool was locked for distribution
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  poolIdIdx: index("prize_pools_pool_id_idx").on(table.poolId),
  hallIdIdx: index("prize_pools_hall_id_idx").on(table.hallId),
  periodIdx: index("prize_pools_period_idx").on(table.period),
}));

// Prize Pool Contributions - Track individual contributions to prize pools
export const prizePoolContributions = pgTable("prize_pool_contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: text("pool_id").notNull(), // References prize_pools.pool_id
  contributionType: text("contribution_type").notNull(), // "challenge_fee", "subscription", "non_member_fee", "extra"
  sourceType: text("source_type"), // "match", "tournament_entry", "break_and_run", "hill_hill", "fine", "sponsor"
  sourceId: text("source_id"), // Reference to source entity (match_id, tournament_id, etc.)
  playerId: text("player_id"), // Player who contributed
  amount: integer("amount").notNull(), // Contribution amount in cents
  stripePaymentIntentId: text("stripe_payment_intent_id"), // Stripe payment reference
  metadata: jsonb("metadata"), // Additional metadata from Stripe or source
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  poolIdIdx: index("prize_pool_contributions_pool_id_idx").on(table.poolId),
  playerIdIdx: index("prize_pool_contributions_player_id_idx").on(table.playerId),
}));

// Prize Pool Distributions - Track prize pool payouts
export const prizePoolDistributions = pgTable("prize_pool_distributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: text("pool_id").notNull(), // References prize_pools.pool_id
  recipientType: text("recipient_type").notNull(), // "winner", "operator", "trustee", "growth_fund", "platform"
  recipientId: text("recipient_id"), // User ID or entity ID
  amount: integer("amount").notNull(), // Distribution amount in cents
  percentage: real("percentage"), // Percentage of total pool
  stripeTransferId: text("stripe_transfer_id"), // Stripe Connect transfer reference
  status: text("status").default("pending"), // "pending", "processing", "completed", "failed"
  distributedAt: timestamp("distributed_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  poolIdIdx: index("prize_pool_distributions_pool_id_idx").on(table.poolId),
  recipientIdIdx: index("prize_pool_distributions_recipient_id_idx").on(table.recipientId),
}));

// Insert schemas for training analytics tables
export const insertSessionAnalyticsSchema = createInsertSchema(sessionAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertShotSchema = createInsertSchema(shots).omit({
  id: true,
  createdAt: true,
});

export const insertLadderTrainingScoreSchema = createInsertSchema(ladderTrainingScores).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionRewardSchema = createInsertSchema(subscriptionRewards).omit({
  id: true,
  createdAt: true,
});

// Types for training analytics tables
export type SessionAnalytics = typeof sessionAnalytics.$inferSelect;
export type InsertSessionAnalytics = z.infer<typeof insertSessionAnalyticsSchema>;
export type SelectSessionAnalytics = SessionAnalytics;

export type Shot = typeof shots.$inferSelect;
export type InsertShot = z.infer<typeof insertShotSchema>;
export type SelectShot = Shot;

export type LadderTrainingScore = typeof ladderTrainingScores.$inferSelect;
export type InsertLadderTrainingScore = z.infer<typeof insertLadderTrainingScoreSchema>;
export type SelectLadderTrainingScore = LadderTrainingScore;

export type SubscriptionReward = typeof subscriptionRewards.$inferSelect;
export type InsertSubscriptionReward = z.infer<typeof insertSubscriptionRewardSchema>;
export type SelectSubscriptionReward = SubscriptionReward;

// Insert schemas for Prize Pool tables
export const insertPrizePoolSchema = createInsertSchema(prizePools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPrizePoolContributionSchema = createInsertSchema(prizePoolContributions).omit({
  id: true,
  createdAt: true,
});

export const insertPrizePoolDistributionSchema = createInsertSchema(prizePoolDistributions).omit({
  id: true,
  createdAt: true,
});

// Types for Prize Pool tables
export type PrizePool = typeof prizePools.$inferSelect;
export type InsertPrizePool = z.infer<typeof insertPrizePoolSchema>;
export type SelectPrizePool = PrizePool;

export type PrizePoolContribution = typeof prizePoolContributions.$inferSelect;
export type InsertPrizePoolContribution = z.infer<typeof insertPrizePoolContributionSchema>;
export type SelectPrizePoolContribution = PrizePoolContribution;

export type PrizePoolDistribution = typeof prizePoolDistributions.$inferSelect;
export type InsertPrizePoolDistribution = z.infer<typeof insertPrizePoolDistributionSchema>;
export type SelectPrizePoolDistribution = PrizePoolDistribution;

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER CAREER / SERVICE MARKETPLACE TABLES
// ─────────────────────────────────────────────────────────────────────────────

export const serviceTypes = [
  "COACHING",
  "EXHIBITION",
  "CLINIC",
  "CONTENT_SUB",
  "APPEARANCE",
  "TIP",
] as const;
export type ServiceType = typeof serviceTypes[number];

export const serviceStatuses = ["draft", "active", "paused"] as const;
export type ServiceStatus = typeof serviceStatuses[number];

export const serviceListings = pgTable(
  "service_listings",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    sellerUserId: text("seller_user_id").notNull(),
    sellerRole: text("seller_role").notNull(),
    serviceType: text("service_type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    priceCents: integer("price_cents").notNull(),
    currency: text("currency").notNull().default("USD"),
    durationMinutes: integer("duration_minutes"),
    status: text("status").notNull().default("draft"),
    stripeProductId: text("stripe_product_id").unique(),
    stripePriceId: text("stripe_price_id").unique(),
    bookingsCount: integer("bookings_count").notNull().default(0),
    totalEarnedCents: integer("total_earned_cents").notNull().default(0),
    isRecurring: boolean("is_recurring").default(false),
    recurringInterval: text("recurring_interval"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_service_listings_seller").on(table.sellerUserId, table.status),
    index("idx_service_listings_type").on(table.serviceType, table.status),
  ]
);

export const serviceBookings = pgTable(
  "service_bookings",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    listingId: text("listing_id").notNull(),
    buyerUserId: text("buyer_user_id").notNull(),
    sellerUserId: text("seller_user_id").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("USD"),
    platformFeeBps: integer("platform_fee_bps").notNull().default(1000),
    platformFeeCents: integer("platform_fee_cents").notNull(),
    operatorFacilitationBps: integer("operator_facilitation_bps").default(0),
    operatorFacilitationCents: integer("operator_facilitation_cents").default(0),
    netToSellerCents: integer("net_to_seller_cents").notNull(),
    stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
    status: text("status").notNull().default("pending"),
    scheduledAt: timestamp("scheduled_at"),
    deliveredAt: timestamp("delivered_at"),
    availableAt: timestamp("available_at"),
    transferredAt: timestamp("transferred_at"),
    hallId: text("hall_id"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_service_bookings_seller").on(table.sellerUserId, table.status),
    index("idx_service_bookings_buyer").on(table.buyerUserId),
    index("idx_service_bookings_listing").on(table.listingId),
    index("idx_service_bookings_available_at").on(table.availableAt, table.status),
  ]
);

export const playerEarningLedger = pgTable(
  "player_earning_ledger",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    playerUserId: text("player_user_id").notNull(),
    entryType: text("entry_type").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("USD"),
    bookingId: text("booking_id"),
    stripeTransferId: text("stripe_transfer_id"),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_earning_ledger_player").on(table.playerUserId, table.createdAt),
    index("idx_earning_ledger_booking").on(table.bookingId),
  ]
);

export const insertServiceListingSchema = createInsertSchema(serviceListings).omit({
  id: true,
  bookingsCount: true,
  totalEarnedCents: true,
  stripeProductId: true,
  stripePriceId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceBookingSchema = createInsertSchema(serviceBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ServiceListing = typeof serviceListings.$inferSelect;
export type InsertServiceListing = z.infer<typeof insertServiceListingSchema>;
export type ServiceBooking = typeof serviceBookings.$inferSelect;
export type InsertServiceBooking = z.infer<typeof insertServiceBookingSchema>;
export type PlayerEarningLedger = typeof playerEarningLedger.$inferSelect;
