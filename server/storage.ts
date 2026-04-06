import {
  type Player, type InsertPlayer,
  type Match, type InsertMatch,
  type Tournament, type InsertTournament,
  type TournamentCalcutta, type InsertTournamentCalcutta,
  type CalcuttaBid, type InsertCalcuttaBid,
  type SeasonPrediction, type InsertSeasonPrediction,
  type PredictionEntry, type InsertPredictionEntry,
  type AddedMoneyFund, type InsertAddedMoneyFund,
  type KellyPool, type InsertKellyPool,
  type MoneyGame, type InsertMoneyGame,
  type Bounty, type InsertBounty,
  type CharityEvent, type InsertCharityEvent,
  type SupportRequest, type InsertSupportRequest,
  type LiveStream, type InsertLiveStream,
  type WebhookEvent, type InsertWebhookEvent,
  type PoolHall, type InsertPoolHall,
  type HallMatch, type InsertHallMatch,
  type HallRoster, type InsertHallRoster,
  type OperatorSettings, type InsertOperatorSettings,
  type RookieMatch, type InsertRookieMatch,
  type RookieEvent, type InsertRookieEvent,
  type RookieAchievement, type InsertRookieAchievement,
  type RookieSubscription, type InsertRookieSubscription,
  type OperatorSubscription, type InsertOperatorSubscription,
  type OperatorSubscriptionSplit, type InsertOperatorSubscriptionSplit,
  type Team, type InsertTeam,
  type TeamPlayer, type InsertTeamPlayer,
  type TeamMatch, type InsertTeamMatch,
  type TeamSet, type InsertTeamSet,
  type TeamChallenge, type InsertTeamChallenge,
  type TeamChallengeParticipant, type InsertTeamChallengeParticipant,
  type Checkin, type InsertCheckin,
  type AttitudeVote, type InsertAttitudeVote,
  type AttitudeBallot, type InsertAttitudeBallot,
  type Incident, type InsertIncident,
  type Wallet, type InsertWallet,
  type ChallengePool, type InsertChallengePool,
  type ChallengeEntry, type InsertChallengeEntry,
  type LedgerEntry, type InsertLedgerEntry,
  type Resolution, type InsertResolution,
  type MatchDivision, type InsertMatchDivision,
  type OperatorTier, type InsertOperatorTier,
  type TeamStripeAccount, type InsertTeamStripeAccount,
  type MatchEntry, type InsertMatchEntry,
  type PayoutDistribution, type InsertPayoutDistribution,
  type TeamRegistration, type InsertTeamRegistration,
  type UploadedFile, type InsertUploadedFile,
  type FileShare, type InsertFileShare,
  type WeightRule, type InsertWeightRule,
  type TutoringSession, type InsertTutoringSession,
  type TutoringCredits, type InsertTutoringCredits,
  type CommissionRate, type InsertCommissionRate,
  type PlatformEarnings, type InsertPlatformEarnings,
  type MembershipEarnings, type InsertMembershipEarnings,
  type OperatorPayout, type InsertOperatorPayout,
  type MembershipSubscription, type InsertMembershipSubscription,
  type Challenge, type InsertChallenge,
  type ChallengeFee, type InsertChallengeFee,
  type ChallengeCheckIn, type InsertChallengeCheckIn,
  type ChallengePolicy, type InsertChallengePolicy,
  type QrCodeNonce, type InsertQrCodeNonce,
  type IcalFeedToken, type InsertIcalFeedToken,
  type PaymentMethod, type InsertPaymentMethod,
  type StakesHold, type InsertStakesHold,
  type NotificationSettings, type InsertNotificationSettings,
  type NotificationDelivery, type InsertNotificationDelivery,
  type DisputeResolution, type InsertDisputeResolution,
  type PlayerCooldown, type InsertPlayerCooldown,
  type DeviceAttestation, type InsertDeviceAttestation,
  type JobQueue, type InsertJobQueue,
  type SystemMetric, type InsertSystemMetric,
  type SystemAlert, type InsertSystemAlert,
  type GlobalRole,
  type SelectSessionAnalytics, type InsertSessionAnalytics,
  type SelectShot, type InsertShot,
  type SelectLadderTrainingScore, type InsertLadderTrainingScore,
  type SelectSubscriptionReward, type InsertSubscriptionReward,
  type PrizePool, type InsertPrizePool,
  type PrizePoolContribution, type InsertPrizePoolContribution,
  type PrizePoolDistribution, type InsertPrizePoolDistribution,
  insertUserSchema,
  insertOrganizationSchema,
  insertPayoutTransferSchema,
  membershipSubscriptions as membershipSubscriptionsTable,
  players as playersTable,
  matches as matchesTable,
  tournaments as tournamentsTable,
  users as usersTable,
  webhookEvents,
  sessionAnalytics,
  shots,
  ladderTrainingScores,
  subscriptionRewards,
  prizePools,
  prizePoolContributions,
  prizePoolDistributions
} from "@shared/schema";
import { db } from "./config/db";
import { eq, and, desc } from "drizzle-orm";

// Type aliases for backward compatibility
type SidePot = ChallengePool;
type InsertSidePot = InsertChallengePool;
type SideBet = ChallengeEntry;
type InsertSideBet = InsertChallengeEntry;

// New types for user management and payouts
export interface User {
  id: string;
  email: string;
  name?: string;
  // Enhanced authentication fields
  passwordHash?: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  phoneNumber?: string;
  lastLoginAt?: Date;
  loginAttempts?: number;
  lockedUntil?: Date;

  globalRole: GlobalRole;
  role?: string;

  // Profile and status
  profileComplete?: boolean;
  onboardingComplete: boolean;
  accountStatus?: string;

  // Payment integration
  stripeCustomerId?: string;
  stripeConnectId?: string;
  payoutShareBps?: number;

  // Operator-specific fields
  hallName?: string;
  city?: string;
  state?: string;
  subscriptionTier?: string;

  createdAt: Date;
  updatedAt?: Date;
}

export interface Organization {
  id: string;
  name: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  seatLimit: number;
  createdAt: Date;
}

export interface PayoutTransfer {
  id: string;
  invoiceId: string;
  stripeTransferId: string;
  recipientUserId: string;
  amount: number;
  shareType: string;
  createdAt: Date;
}

export type InsertUser = {
  email: string;
  name?: string;
  // Enhanced authentication fields
  passwordHash?: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  phoneNumber?: string;

  globalRole: GlobalRole;
  role?: string;

  // Profile and status
  profileComplete?: boolean;
  onboardingComplete?: boolean;
  accountStatus?: string;

  // Payment integration
  stripeCustomerId?: string;
  stripeConnectId?: string;
  payoutShareBps?: number;

  // Operator-specific fields
  hallName?: string;
  city?: string;
  state?: string;
  subscriptionTier?: string;
};

export type UpsertUser = {
  id: string;
  email?: string;
  name?: string;
  globalRole?: GlobalRole;
  stripeCustomerId?: string;
  stripeConnectId?: string;
  payoutShareBps?: number;
  onboardingComplete?: boolean;
};

export type InsertOrganization = {
  name: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  seatLimit?: number;
};

export type InsertPayoutTransfer = {
  invoiceId: string;
  stripeTransferId: string;
  recipientUserId: string;
  amount: number;
  shareType: string;
};

import { randomUUID } from "crypto";

// Utility function to safely merge objects without undefined values
function assignNoUndefined<T>(base: T, updates: Partial<T>): T {
  const out: any = { ...base };
  for (const k in updates) {
    if (updates[k] !== undefined) {
      out[k] = updates[k];
    }
  }
  return out as T;
}

// Helper to ensure nullable fields are properly set to null instead of undefined
function nullifyUndefined<T>(value: T | undefined): T | null {
  return value === undefined ? null : value;
}

// Type-safe utility for nullable fields
type NullableKeys<T> = { [K in keyof T]-?: null extends T[K] ? K : never }[keyof T];

// Centralized nullable field registry based on schema  
const NULLABLE_FIELDS = {
  Player: ["city", "theme", "birthday", "stripeCustomerId", "userId", "rookiePassExpiresAt", "graduatedAt"] as const satisfies readonly NullableKeys<Player>[],
  Match: ["notes", "winner", "commission", "reportedAt"] as const satisfies readonly NullableKeys<Match>[],
  Tournament: ["stripeProductId"] as const satisfies readonly NullableKeys<Tournament>[],
  SidePot: ["matchId", "creatorId", "sideALabel", "sideBLabel", "lockCutoffAt", "description", "evidenceJson", "verificationSource", "customCreatedBy", "winningSide", "resolvedAt", "disputeDeadline", "autoResolvedAt"] as const satisfies readonly NullableKeys<SidePot>[],
  Wallet: [] as const satisfies readonly NullableKeys<Wallet>[],
  SideBet: ["challengePoolId", "userId", "side", "fundedAt"] as const satisfies readonly NullableKeys<SideBet>[],
  Resolution: ["challengePoolId", "winnerSide", "decidedBy", "notes"] as const satisfies readonly NullableKeys<Resolution>[],
  User: [] as const satisfies readonly NullableKeys<User>[],
  Organization: [] as const satisfies readonly NullableKeys<Organization>[],
  OperatorSettings: ["customBranding", "freeMonthsGrantedBy", "freeMonthsGrantedAt"] as const satisfies readonly NullableKeys<OperatorSettings>[],
  KellyPool: ["table"] as const satisfies readonly NullableKeys<KellyPool>[],
  Bounty: ["rank", "targetId", "description"] as const satisfies readonly NullableKeys<Bounty>[],
  CharityEvent: ["description"] as const satisfies readonly NullableKeys<CharityEvent>[],
  SupportRequest: ["description", "amount"] as const satisfies readonly NullableKeys<SupportRequest>[],
  LiveStream: ["title", "matchId", "hallMatchId", "tournamentId", "streamerId", "embedUrl", "thumbnailUrl", "lastLiveAt"] as const satisfies readonly NullableKeys<LiveStream>[],
  PoolHall: ["description", "address", "phone", "unlockedBy", "unlockedAt"] as const satisfies readonly NullableKeys<PoolHall>[],
  HallMatch: ["winnerHallId", "scheduledDate", "completedAt", "notes"] as const satisfies readonly NullableKeys<HallMatch>[],
  HallRoster: ["position"] as const satisfies readonly NullableKeys<HallRoster>[],
  RookieMatch: ["notes", "winner", "reportedAt"] as const satisfies readonly NullableKeys<RookieMatch>[],
  RookieEvent: ["description"] as const satisfies readonly NullableKeys<RookieEvent>[],
  RookieSubscription: ["expiresAt", "cancelledAt"] as const satisfies readonly NullableKeys<RookieSubscription>[],
  Team: ["hallId"] as const satisfies readonly NullableKeys<Team>[],
  TeamPlayer: ["position"] as const satisfies readonly NullableKeys<TeamPlayer>[],
  TeamMatch: ["winnerTeamId", "putUpRound", "scheduledAt", "completedAt"] as const satisfies readonly NullableKeys<TeamMatch>[],
  TeamSet: ["winnerId", "loserId", "putUpType", "completedAt", "clipUrl"] as const satisfies readonly NullableKeys<TeamSet>[],
  TeamChallenge: ["description", "acceptingTeamId", "challengePoolId", "winnerId", "completedAt", "expiresAt"] as const satisfies readonly NullableKeys<TeamChallenge>[],
  TeamChallengeParticipant: [] as const satisfies readonly NullableKeys<TeamChallengeParticipant>[],
  AttitudeVote: ["result"] as const satisfies readonly NullableKeys<AttitudeVote>[],
  OperatorSubscription: ["nextBillingDate"] as const satisfies readonly NullableKeys<OperatorSubscription>[],
  MembershipSubscription: ["stripeCustomerId", "currentPeriodStart", "currentPeriodEnd"] as const satisfies readonly NullableKeys<MembershipSubscription>[],
  TeamStripeAccount: ["businessType", "email", "lastOnboardingRefresh"] as const satisfies readonly NullableKeys<TeamStripeAccount>[],
  MatchEntry: ["awayTeamId", "stripeCheckoutSessionId", "stripePaymentIntentId", "winnerId", "scheduledAt", "completedAt", "venueId", "streamUrl", "captainHomeId", "captainAwayId"] as const satisfies readonly NullableKeys<MatchEntry>[],
  PayoutDistribution: ["stripeTransferId", "transferredAt", "operatorTierAtPayout", "revenueSplitAtPayout", "notes"] as const satisfies readonly NullableKeys<PayoutDistribution>[],
  TeamRegistration: ["logoUrl", "stripePaymentIntentId", "confirmedAt", "bracketPosition", "seedRank", "venueId", "seasonId"] as const satisfies readonly NullableKeys<TeamRegistration>[],
  UploadedFile: ["description", "lastAccessedAt"] as const satisfies readonly NullableKeys<UploadedFile>[],
  FileShare: ["sharedWithUserId", "sharedWithRole", "sharedWithHallId", "expiresAt"] as const satisfies readonly NullableKeys<FileShare>[],
  WeightRule: ["lastLossAt"] as const satisfies readonly NullableKeys<WeightRule>[],
  TutoringSession: ["notes", "completedAt"] as const satisfies readonly NullableKeys<TutoringSession>[],
  Challenge: ["checkedInAt", "completedAt", "winnerId", "posterImageUrl", "description", "updatedAt"] as const satisfies readonly NullableKeys<Challenge>[],
  ChallengeFee: ["actualAt", "stripeChargeId", "stripeCustomerId", "chargedAt", "waivedAt", "waivedBy", "waiverReason"] as const satisfies readonly NullableKeys<ChallengeFee>[],
  ChallengeCheckIn: ["checkedInBy", "location"] as const satisfies readonly NullableKeys<ChallengeCheckIn>[],
  ChallengePolicy: [] as const satisfies readonly NullableKeys<ChallengePolicy>[],
  IcalFeedToken: ["name", "lastUsedAt", "hallId", "expiresAt", "revokedAt", "revokedBy", "revokeReason"] as const satisfies readonly NullableKeys<IcalFeedToken>[],
  PaymentMethod: ["stripeSetupIntentId", "brand", "last4", "expiryMonth", "expiryYear", "metadata"] as const satisfies readonly NullableKeys<PaymentMethod>[],
  StakesHold: ["capturedAt", "releasedAt", "captureReason", "releaseReason", "metadata"] as const satisfies readonly NullableKeys<StakesHold>[],
  NotificationSettings: ["emailAddress", "phoneNumber"] as const satisfies readonly NullableKeys<NotificationSettings>[],
  NotificationDelivery: ["challengeId", "providerId", "errorMessage", "sentAt", "deliveredAt", "metadata"] as const satisfies readonly NullableKeys<NotificationDelivery>[],
  DisputeResolution: ["challengeFeeId", "filedAgainst", "evidenceNotes", "resolution", "resolvedBy", "resolutionAction", "operatorNotes", "resolvedAt", "auditLog"] as const satisfies readonly NullableKeys<DisputeResolution>[],
  PlayerCooldown: ["liftedAt", "liftedBy", "liftReason", "metadata"] as const satisfies readonly NullableKeys<PlayerCooldown>[],
  DeviceAttestation: ["geolocation", "distanceFromHall", "ipAddress", "userAgent", "scannerStaffId"] as const satisfies readonly NullableKeys<DeviceAttestation>[],
  JobQueue: ["processedBy", "startedAt", "completedAt", "errorMessage", "result", "metadata"] as const satisfies readonly NullableKeys<JobQueue>[],
  SystemMetric: ["hallId", "metadata"] as const satisfies readonly NullableKeys<SystemMetric>[],
  SystemAlert: ["currentValue", "lastTriggered", "metadata"] as const satisfies readonly NullableKeys<SystemAlert>[],
} as const;

// Centralized update helper that handles nullable fields properly
function applyUpdate<T, K extends keyof T>(
  base: T,
  updates: Partial<T>,
  nullableKeys: readonly K[]
): T {
  const normalized = Object.fromEntries(
    Object.entries(updates).map(([k, v]) => [
      k,
      (nullableKeys as readonly string[]).includes(k) ? (v === undefined ? null : v) : v
    ])
  ) as Partial<T>;
  return assignNoUndefined(base, normalized);
}

// Generic update helper for Map-based storage
function updateMapRecord<T>(
  map: Map<string, T>,
  id: string,
  updates: Partial<T>,
  nullable: readonly (keyof T)[]
): T | undefined {
  const cur = map.get(id);
  if (!cur) return undefined;
  const next = applyUpdate(cur, updates, nullable);
  map.set(id, next);
  return next;
}

export interface IStorage {
  // Users (for platform management)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeConnectId(stripeConnectId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getStaffUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  deleteUser(id: string): Promise<boolean>;

  // Organizations
  getOrganization(id: string): Promise<Organization | undefined>;
  getAllOrganizations(): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined>;

  // Payout Transfers
  getPayoutTransfer(id: string): Promise<PayoutTransfer | undefined>;
  getPayoutTransfersByInvoice(invoiceId: string): Promise<PayoutTransfer[]>;
  getAllPayoutTransfers(): Promise<PayoutTransfer[]>;
  createPayoutTransfer(transfer: InsertPayoutTransfer): Promise<PayoutTransfer>;

  // Operator Settings
  getOperatorSettings(operatorUserId: string): Promise<OperatorSettings | undefined>;
  getAllOperatorSettings(): Promise<OperatorSettings[]>;
  createOperatorSettings(settings: InsertOperatorSettings): Promise<OperatorSettings>;
  updateOperatorSettings(operatorUserId: string, updates: Partial<OperatorSettings>): Promise<OperatorSettings | undefined>;

  // Players
  getPlayer(id: string): Promise<Player | undefined>;
  getPlayerByUserId(userId: string): Promise<Player | undefined>;
  getPlayers(): Promise<Player[]>;
  getAllPlayers(): Promise<Player[]>; // Alias for backwards compatibility
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined>;
  deletePlayer(id: string): Promise<boolean>;

  // Matches
  getMatch(id: string): Promise<Match | undefined>;
  getMatches(): Promise<Match[]>;
  getAllMatches(): Promise<Match[]>; // Alias for backwards compatibility
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: string, updates: Partial<Match>): Promise<Match | undefined>;

  // Tournaments
  getTournament(id: string): Promise<Tournament | undefined>;
  getTournaments(): Promise<Tournament[]>;
  getAllTournaments(): Promise<Tournament[]>; // Alias for backwards compatibility
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  updateTournament(id: string, updates: Partial<Tournament>): Promise<Tournament | undefined>;

  // Tournament Calcuttas - Bidding on tournament participants
  getTournamentCalcutta(id: string): Promise<TournamentCalcutta | undefined>;
  getTournamentCalcuttas(): Promise<TournamentCalcutta[]>;
  getTournamentCalcuttasByTournament(tournamentId: string): Promise<TournamentCalcutta[]>;
  createTournamentCalcutta(calcutta: InsertTournamentCalcutta): Promise<TournamentCalcutta>;
  updateTournamentCalcutta(id: string, updates: Partial<TournamentCalcutta>): Promise<TournamentCalcutta | undefined>;

  // Calcutta Bids
  getCalcuttaBid(id: string): Promise<CalcuttaBid | undefined>;
  getCalcuttaBids(): Promise<CalcuttaBid[]>;
  getCalcuttaBidsByCalcutta(calcuttaId: string): Promise<CalcuttaBid[]>;
  getCalcuttaBidsByBidder(bidderId: string): Promise<CalcuttaBid[]>;
  createCalcuttaBid(bid: InsertCalcuttaBid): Promise<CalcuttaBid>;
  updateCalcuttaBid(id: string, updates: Partial<CalcuttaBid>): Promise<CalcuttaBid | undefined>;

  // Season Predictions - Championship predictions
  getSeasonPrediction(id: string): Promise<SeasonPrediction | undefined>;
  getSeasonPredictions(): Promise<SeasonPrediction[]>;
  getSeasonPredictionsByStatus(status: string): Promise<SeasonPrediction[]>;
  createSeasonPrediction(prediction: InsertSeasonPrediction): Promise<SeasonPrediction>;
  updateSeasonPrediction(id: string, updates: Partial<SeasonPrediction>): Promise<SeasonPrediction | undefined>;

  // Prediction Entries
  getPredictionEntry(id: string): Promise<PredictionEntry | undefined>;
  getPredictionEntries(): Promise<PredictionEntry[]>;
  getPredictionEntriesByPrediction(predictionId: string): Promise<PredictionEntry[]>;
  getPredictionEntriesByPredictor(predictorId: string): Promise<PredictionEntry[]>;
  createPredictionEntry(entry: InsertPredictionEntry): Promise<PredictionEntry>;
  updatePredictionEntry(id: string, updates: Partial<PredictionEntry>): Promise<PredictionEntry | undefined>;

  // Added Money Fund - Tournament revenue allocation
  getAddedMoneyFund(id: string): Promise<AddedMoneyFund | undefined>;
  getAddedMoneyFunds(): Promise<AddedMoneyFund[]>;
  getAddedMoneyFundsBySource(sourceType: string): Promise<AddedMoneyFund[]>;
  getAddedMoneyFundsByTournament(tournamentId: string): Promise<AddedMoneyFund[]>;
  createAddedMoneyFund(fund: InsertAddedMoneyFund): Promise<AddedMoneyFund>;
  updateAddedMoneyFund(id: string, updates: Partial<AddedMoneyFund>): Promise<AddedMoneyFund | undefined>;

  // Kelly Pools
  getKellyPool(id: string): Promise<KellyPool | undefined>;
  getKellyPools(): Promise<KellyPool[]>;
  getAllKellyPools(): Promise<KellyPool[]>; // Alias for backwards compatibility
  createKellyPool(kellyPool: InsertKellyPool): Promise<KellyPool>;
  updateKellyPool(id: string, updates: Partial<KellyPool>): Promise<KellyPool | undefined>;

  // Money Games
  getMoneyGame(id: string): Promise<MoneyGame | undefined>;
  getMoneyGames(): Promise<MoneyGame[]>;
  getMoneyGamesByStatus(status: string): Promise<MoneyGame[]>;
  createMoneyGame(game: InsertMoneyGame): Promise<MoneyGame>;
  updateMoneyGame(id: string, updates: Partial<MoneyGame>): Promise<MoneyGame | undefined>;
  deleteMoneyGame(id: string): Promise<boolean>;

  // Bounties
  getBounty(id: string): Promise<Bounty | undefined>;
  getBounties(): Promise<Bounty[]>;
  getAllBounties(): Promise<Bounty[]>; // Alias for backwards compatibility
  createBounty(bounty: InsertBounty): Promise<Bounty>;
  updateBounty(id: string, updates: Partial<Bounty>): Promise<Bounty | undefined>;

  // Charity Events
  getCharityEvent(id: string): Promise<CharityEvent | undefined>;
  getCharityEvents(): Promise<CharityEvent[]>;
  getAllCharityEvents(): Promise<CharityEvent[]>; // Alias for backwards compatibility
  createCharityEvent(event: InsertCharityEvent): Promise<CharityEvent>;
  updateCharityEvent(id: string, updates: Partial<CharityEvent>): Promise<CharityEvent | undefined>;

  // Support Requests
  getSupportRequest(id: string): Promise<SupportRequest | undefined>;
  getSupportRequests(): Promise<SupportRequest[]>;
  getAllSupportRequests(): Promise<SupportRequest[]>; // Alias for backwards compatibility
  createSupportRequest(request: InsertSupportRequest): Promise<SupportRequest>;
  updateSupportRequest(id: string, updates: Partial<SupportRequest>): Promise<SupportRequest | undefined>;

  // Live Streams
  getLiveStream(id: string): Promise<LiveStream | undefined>;
  getLiveStreams(): Promise<LiveStream[]>;
  getAllLiveStreams(): Promise<LiveStream[]>; // Alias for backwards compatibility
  createLiveStream(stream: InsertLiveStream): Promise<LiveStream>;
  updateLiveStream(id: string, updates: Partial<LiveStream>): Promise<LiveStream | undefined>;
  deleteLiveStream(id: string): Promise<boolean>;
  getLiveStreamsByLocation(city?: string, state?: string): Promise<LiveStream[]>;
  getLiveStreamsByPlatform(platform: string): Promise<LiveStream[]>; // Alias for compatibility
  getLiveStreamStats(): Promise<any>;

  // Pool Halls
  getPoolHall(id: string): Promise<PoolHall | undefined>;
  getPoolHalls(): Promise<PoolHall[]>;
  getAllPoolHalls(): Promise<PoolHall[]>; // Alias for backwards compatibility
  createPoolHall(poolHall: InsertPoolHall): Promise<PoolHall>;
  updatePoolHall(id: string, updates: Partial<PoolHall>): Promise<PoolHall | undefined>;
  unlockHallBattles(hallId: string, unlockedBy: string): Promise<PoolHall | undefined>;
  lockHallBattles(hallId: string): Promise<PoolHall | undefined>;

  // Hall Matches
  getHallMatch(id: string): Promise<HallMatch | undefined>;
  getHallMatches(): Promise<HallMatch[]>;
  getAllHallMatches(): Promise<HallMatch[]>; // Alias for backwards compatibility
  getHallMatchesByHall(hallId: string): Promise<HallMatch[]>;
  createHallMatch(hallMatch: InsertHallMatch): Promise<HallMatch>;
  updateHallMatch(id: string, updates: Partial<HallMatch>): Promise<HallMatch | undefined>;

  // Hall Rosters
  getHallRoster(id: string): Promise<HallRoster | undefined>;
  getHallRosters(): Promise<HallRoster[]>;
  getAllHallRosters(): Promise<HallRoster[]>;
  getHallRostersByHall(hallId: string): Promise<HallRoster[]>;
  getRosterByHall(hallId: string): Promise<HallRoster[]>; // Alias for compatibility
  getRosterByPlayer(playerId: string): Promise<HallRoster[]>;
  createHallRoster(roster: InsertHallRoster): Promise<HallRoster>;
  updateHallRoster(id: string, updates: Partial<HallRoster>): Promise<HallRoster | undefined>;

  // Webhook Events
  getWebhookEvent(stripeEventId: string): Promise<WebhookEvent | undefined>;
  createWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent>;

  // Rookie System
  getRookieMatch(id: string): Promise<RookieMatch | undefined>;
  getRookieMatches(): Promise<RookieMatch[]>;
  getAllRookieMatches(): Promise<RookieMatch[]>; // Alias for backwards compatibility
  getRookieMatchesByPlayer(playerId: string): Promise<RookieMatch[]>;
  createRookieMatch(match: InsertRookieMatch): Promise<RookieMatch>;
  updateRookieMatch(id: string, updates: Partial<RookieMatch>): Promise<RookieMatch | undefined>;

  getRookieEvent(id: string): Promise<RookieEvent | undefined>;
  getRookieEvents(): Promise<RookieEvent[]>;
  getAllRookieEvents(): Promise<RookieEvent[]>; // Alias for backwards compatibility
  createRookieEvent(event: InsertRookieEvent): Promise<RookieEvent>;
  updateRookieEvent(id: string, updates: Partial<RookieEvent>): Promise<RookieEvent | undefined>;

  getRookieAchievement(id: string): Promise<RookieAchievement | undefined>;
  getRookieAchievementsByPlayer(playerId: string): Promise<RookieAchievement[]>;
  createRookieAchievement(achievement: InsertRookieAchievement): Promise<RookieAchievement>;

  getRookieSubscription(playerId: string): Promise<RookieSubscription | undefined>;
  getAllRookieSubscriptions(): Promise<RookieSubscription[]>;
  createRookieSubscription(subscription: InsertRookieSubscription): Promise<RookieSubscription>;
  updateRookieSubscription(playerId: string, updates: Partial<RookieSubscription>): Promise<RookieSubscription | undefined>;

  getRookieLeaderboard(): Promise<Player[]>;
  promoteRookieToMainLadder(playerId: string): Promise<Player | undefined>;

  // Side Betting - Wallet Operations
  getWallet(userId: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(userId: string, updates: Partial<Wallet>): Promise<Wallet | undefined>;
  creditWallet(userId: string, amount: number): Promise<Wallet | undefined>;
  lockCredits(userId: string, amount: number): Promise<boolean>;
  unlockCredits(userId: string, amount: number): Promise<boolean>;

  // Wallet aliases (for backwards compatibility)
  addCredits(userId: string, amount: number): Promise<Wallet | undefined>;

  // Side Betting - Side Pots
  getSidePot(id: string): Promise<SidePot | undefined>;
  getAllSidePots(): Promise<SidePot[]>;
  getSidePotsByMatch(matchId: string): Promise<SidePot[]>;
  getSidePotsByStatus(status: string): Promise<SidePot[]>;
  createSidePot(pot: InsertSidePot): Promise<SidePot>;
  updateSidePot(id: string, updates: Partial<SidePot>): Promise<SidePot | undefined>;
  getExpiredDisputePots(now: Date): Promise<SidePot[]>;
  processDelayedPayouts(potId: string, winningSide: string): Promise<any>;

  // Challenge Pool aliases (for backwards compatibility)
  getChallengePool(id: string): Promise<ChallengePool | undefined>;
  getAllChallengePools(): Promise<ChallengePool[]>;
  createChallengePool(pool: InsertChallengePool): Promise<ChallengePool>;
  updateChallengePool(id: string, updates: Partial<ChallengePool>): Promise<ChallengePool | undefined>;

  // Side Betting - Side Bets
  getSideBet(id: string): Promise<SideBet | undefined>;
  getSideBetsByPot(challengePoolId: string): Promise<SideBet[]>;
  getSideBetsByUser(userId: string): Promise<SideBet[]>;
  createSideBet(bet: InsertSideBet): Promise<SideBet>;
  updateSideBet(id: string, updates: Partial<SideBet>): Promise<SideBet | undefined>;

  // Challenge Entry aliases (for backwards compatibility)
  getChallengeEntry(id: string): Promise<ChallengeEntry | undefined>;
  getChallengeEntriesByPool(poolId: string): Promise<ChallengeEntry[]>;
  createChallengeEntry(entry: InsertChallengeEntry): Promise<ChallengeEntry>;
  updateChallengeEntry(id: string, updates: Partial<ChallengeEntry>): Promise<ChallengeEntry | undefined>;

  // Side Betting - Ledger
  getLedgerEntry(id: string): Promise<LedgerEntry | undefined>;
  getLedgerByUser(userId: string): Promise<LedgerEntry[]>;
  createLedgerEntry(entry: InsertLedgerEntry): Promise<LedgerEntry>;

  // Side Betting - Resolutions
  getResolution(id: string): Promise<Resolution | undefined>;
  getResolutionByPot(challengePoolId: string): Promise<Resolution | undefined>;
  createResolution(resolution: InsertResolution): Promise<Resolution>;

  // Operator Subscriptions
  getOperatorSubscription(operatorId: string): Promise<OperatorSubscription | undefined>;
  getOperatorSubscriptions(): Promise<OperatorSubscription[]>;
  getAllOperatorSubscriptions(): Promise<OperatorSubscription[]>; // Alias for backwards compatibility
  createOperatorSubscription(subscription: InsertOperatorSubscription): Promise<OperatorSubscription>;
  updateOperatorSubscription(operatorId: string, updates: Partial<OperatorSubscription>): Promise<OperatorSubscription | undefined>;

  // Operator Subscription Splits
  createOperatorSubscriptionSplit(split: InsertOperatorSubscriptionSplit): Promise<OperatorSubscriptionSplit>;
  getOperatorSubscriptionSplits(operatorId: string): Promise<OperatorSubscriptionSplit[]>;
  getOperatorSubscriptionSplitsBySubscription(subscriptionId: string): Promise<OperatorSubscriptionSplit[]>;
  getTrusteeEarnings(trusteeId: string): Promise<{ totalEarnings: number; splitCount: number; splits: OperatorSubscriptionSplit[] }>;
  getOperatorSubscriptionSplit(id: string): Promise<OperatorSubscriptionSplit | undefined>;

  // Membership Subscriptions
  getMembershipSubscription(id: string): Promise<MembershipSubscription | undefined>;
  getMembershipSubscriptionByPlayerId(playerId: string): Promise<MembershipSubscription | undefined>;
  getMembershipSubscriptionsByPlayer(playerId: string): Promise<MembershipSubscription[]>; // Alias for compatibility
  createMembershipSubscription(subscription: InsertMembershipSubscription): Promise<MembershipSubscription>;
  updateMembershipSubscription(id: string, updates: Partial<MembershipSubscription>): Promise<MembershipSubscription | undefined>;

  // Team Division System
  getTeam(id: string): Promise<Team | undefined>;
  getTeamsByOperator(operatorId: string): Promise<Team[]>;
  getTeamsByHall(hallId: string): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined>;
  deleteTeam(id: string): Promise<boolean>;

  getTeamPlayer(id: string): Promise<TeamPlayer | undefined>;
  getTeamPlayersByTeam(teamId: string): Promise<TeamPlayer[]>;
  getTeamPlayersByPlayer(playerId: string): Promise<TeamPlayer[]>;
  createTeamPlayer(teamPlayer: InsertTeamPlayer): Promise<TeamPlayer>;
  updateTeamPlayer(id: string, updates: Partial<TeamPlayer>): Promise<TeamPlayer | undefined>;
  removeTeamPlayer(id: string): Promise<boolean>;

  getTeamMatch(id: string): Promise<TeamMatch | undefined>;
  getTeamMatchesByTeam(teamId: string): Promise<TeamMatch[]>;
  getTeamMatchesByOperator(operatorId: string): Promise<TeamMatch[]>;
  createTeamMatch(teamMatch: InsertTeamMatch): Promise<TeamMatch>;
  updateTeamMatch(id: string, updates: Partial<TeamMatch>): Promise<TeamMatch | undefined>;

  getTeamSet(id: string): Promise<TeamSet | undefined>;
  getTeamSetsByMatch(teamMatchId: string): Promise<TeamSet[]>;
  createTeamSet(teamSet: InsertTeamSet): Promise<TeamSet>;
  updateTeamSet(id: string, updates: Partial<TeamSet>): Promise<TeamSet | undefined>;

  // Team Challenge System
  getTeamChallenge(id: string): Promise<TeamChallenge | undefined>;
  getAllTeamChallenges(): Promise<TeamChallenge[]>;
  getTeamChallengesByOperator(operatorId: string): Promise<TeamChallenge[]>;
  getTeamChallengesByType(challengeType: string): Promise<TeamChallenge[]>;
  getTeamChallengesByStatus(status: string): Promise<TeamChallenge[]>;
  createTeamChallenge(challenge: InsertTeamChallenge): Promise<TeamChallenge>;
  updateTeamChallenge(id: string, updates: Partial<TeamChallenge>): Promise<TeamChallenge | undefined>;
  acceptTeamChallenge(challengeId: string, acceptingTeamId: string): Promise<TeamChallenge | undefined>;

  getTeamChallengeParticipant(id: string): Promise<TeamChallengeParticipant | undefined>;
  getTeamChallengeParticipantsByChallenge(challengeId: string): Promise<TeamChallengeParticipant[]>;
  createTeamChallengeParticipant(participant: InsertTeamChallengeParticipant): Promise<TeamChallengeParticipant>;
  updateTeamChallengeParticipant(id: string, updates: Partial<TeamChallengeParticipant>): Promise<TeamChallengeParticipant | undefined>;

  // Team Challenge Business Logic
  calculateTeamChallengeStake(challengeType: string, individualFee: number): number;
  validateProMembership(playerId: string): Promise<boolean>;
  createTeamChallengeWithParticipants(challengeData: InsertTeamChallenge, teamPlayers: string[]): Promise<{ challenge: TeamChallenge; participants: TeamChallengeParticipant[] }>;

  // Team Stripe Accounts
  getTeamStripeAccount(teamId: string): Promise<TeamStripeAccount | undefined>;
  getTeamStripeAccounts(): Promise<TeamStripeAccount[]>;
  createTeamStripeAccount(account: InsertTeamStripeAccount): Promise<TeamStripeAccount>;
  updateTeamStripeAccount(teamId: string, updates: Partial<TeamStripeAccount>): Promise<TeamStripeAccount | undefined>;

  // Team Registrations
  getTeamRegistration(id: string): Promise<TeamRegistration | undefined>;
  getTeamRegistrations(): Promise<TeamRegistration[]>;
  getTeamRegistrationsByDivision(divisionId: string): Promise<TeamRegistration[]>;
  createTeamRegistration(registration: InsertTeamRegistration): Promise<TeamRegistration>;
  updateTeamRegistration(id: string, updates: Partial<TeamRegistration>): Promise<TeamRegistration | undefined>;

  // === SPORTSMANSHIP VOTE-OUT SYSTEM ===

  // Check-in management
  checkinUser(data: InsertCheckin): Promise<Checkin>;
  getCheckinsBySession(sessionId: string): Promise<Checkin[]>;
  getCheckinsByVenue(venueId: string): Promise<Checkin[]>;
  getActiveCheckins(sessionId: string, venueId: string): Promise<Checkin[]>;

  // Vote management
  createAttitudeVote(data: InsertAttitudeVote): Promise<AttitudeVote>;
  getAttitudeVote(id: string): Promise<AttitudeVote | undefined>;
  getActiveVotes(sessionId: string, venueId: string): Promise<AttitudeVote[]>;
  updateAttitudeVote(id: string, updates: Partial<AttitudeVote>): Promise<AttitudeVote | undefined>;
  closeAttitudeVote(id: string, result: string): Promise<AttitudeVote | undefined>;

  // Ballot management
  createAttitudeBallot(data: InsertAttitudeBallot): Promise<AttitudeBallot>;
  getBallotsByVote(voteId: string): Promise<AttitudeBallot[]>;
  hasUserVoted(voteId: string, userId: string): Promise<boolean>;

  // Vote calculation utilities
  calculateVoteWeights(voteId: string): Promise<{ totalWeight: number; outWeight: number; keepWeight: number }>;
  checkVoteQuorum(voteId: string): Promise<boolean>;

  // Incident management
  createIncident(data: InsertIncident): Promise<Incident>;
  getIncidentsByUser(userId: string): Promise<Incident[]>;
  getRecentIncidents(venueId: string, hours: number): Promise<Incident[]>;

  // User eligibility and cooldowns
  canUserBeVotedOn(userId: string, sessionId: string): Promise<boolean>;
  getLastVoteForUser(userId: string, sessionId: string): Promise<AttitudeVote | undefined>;
  isUserImmune(userId: string, sessionId: string): Promise<boolean>;

  // File Upload Tracking
  getUploadedFile(id: string): Promise<UploadedFile | undefined>;
  getUploadedFileByPath(objectPath: string): Promise<UploadedFile | undefined>;
  getUserUploadedFiles(userId: string, category?: string): Promise<UploadedFile[]>;
  getAllUploadedFiles(): Promise<UploadedFile[]>;
  createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile>;
  updateUploadedFile(id: string, updates: Partial<UploadedFile>): Promise<UploadedFile | undefined>;
  deleteUploadedFile(id: string): Promise<boolean>;
  incrementFileDownloadCount(id: string): Promise<void>;

  // File Sharing
  getFileShare(id: string): Promise<FileShare | undefined>;
  getFileShares(fileId: string): Promise<FileShare[]>;
  getUserSharedFiles(userId: string): Promise<FileShare[]>;
  createFileShare(share: InsertFileShare): Promise<FileShare>;
  updateFileShare(id: string, updates: Partial<FileShare>): Promise<FileShare | undefined>;
  deleteFileShare(id: string): Promise<boolean>;

  // Weight Rules
  getWeightRule(id: string): Promise<WeightRule | undefined>;
  getWeightRulesByPlayer(playerId: string): Promise<WeightRule[]>;
  createWeightRule(rule: InsertWeightRule): Promise<WeightRule>;
  updateWeightRule(id: string, updates: Partial<WeightRule>): Promise<WeightRule | undefined>;

  // Tutoring System
  getTutoringSession(id: string): Promise<TutoringSession | undefined>;
  getTutoringSessionsByTutor(tutorId: string): Promise<TutoringSession[]>;
  getTutoringSessionsByRookie(rookieId: string): Promise<TutoringSession[]>;
  createTutoringSession(session: InsertTutoringSession): Promise<TutoringSession>;
  updateTutoringSession(id: string, updates: Partial<TutoringSession>): Promise<TutoringSession | undefined>;

  getTutoringCredits(id: string): Promise<TutoringCredits | undefined>;
  getTutoringCreditsByTutor(tutorId: string): Promise<TutoringCredits[]>;
  createTutoringCredits(credits: InsertTutoringCredits): Promise<TutoringCredits>;

  // Commission and Earnings Tracking
  getCommissionRate(id: string): Promise<CommissionRate | undefined>;
  getCommissionRatesByOperator(operatorId: string): Promise<CommissionRate[]>;
  createCommissionRate(rate: InsertCommissionRate): Promise<CommissionRate>;

  getPlatformEarnings(id: string): Promise<PlatformEarnings | undefined>;
  getPlatformEarningsByOperator(operatorId: string): Promise<PlatformEarnings[]>;
  createPlatformEarnings(earnings: InsertPlatformEarnings): Promise<PlatformEarnings>;

  getMembershipEarnings(id: string): Promise<MembershipEarnings | undefined>;
  getMembershipEarningsByOperator(operatorId: string): Promise<MembershipEarnings[]>;
  createMembershipEarnings(earnings: InsertMembershipEarnings): Promise<MembershipEarnings>;

  getOperatorPayout(id: string): Promise<OperatorPayout | undefined>;
  getOperatorPayoutsByOperator(operatorId: string): Promise<OperatorPayout[]>;
  createOperatorPayout(payout: InsertOperatorPayout): Promise<OperatorPayout>;

  // === CHALLENGE CALENDAR ===
  getChallenge(id: string): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallenge(id: string, updates: Partial<Challenge>): Promise<Challenge | undefined>;
  getChallengesByPlayer(playerId: string): Promise<Challenge[]>;
  getChallengesByHall(hallId: string): Promise<Challenge[]>;
  getChallengesByDateRange(startDate: Date, endDate: Date): Promise<Challenge[]>;
  getUpcomingChallenges(limit?: number): Promise<Challenge[]>;

  // Challenge Fees
  getChallengeFee(id: string): Promise<ChallengeFee | undefined>;
  createChallengeFee(fee: InsertChallengeFee): Promise<ChallengeFee>;
  updateChallengeFee(id: string, updates: Partial<ChallengeFee>): Promise<ChallengeFee | undefined>;
  getChallengeFeesByChallenge(challengeId: string): Promise<ChallengeFee[]>;
  getChallengeFeesByStatus(statuses: string[]): Promise<ChallengeFee[]>;

  // Challenge Check-ins
  createChallengeCheckIn(checkIn: InsertChallengeCheckIn): Promise<ChallengeCheckIn>;
  getChallengeCheckInsByChallenge(challengeId: string): Promise<ChallengeCheckIn[]>;

  // QR Code Nonce Management (Replay Protection)
  createQrCodeNonce(nonce: InsertQrCodeNonce): Promise<QrCodeNonce>;
  markNonceAsUsed(nonce: string, ipAddress?: string, userAgent?: string): Promise<QrCodeNonce | undefined>;
  isNonceUsed(nonce: string): Promise<boolean>;
  isNonceValid(nonce: string): Promise<boolean>; // Checks both used status and expiration
  cleanupExpiredNonces(): Promise<number>; // Returns count of cleaned up nonces

  // Challenge Policies
  getChallengesPolicyByHall(hallId: string): Promise<ChallengePolicy | undefined>;
  createChallengePolicy(policy: InsertChallengePolicy): Promise<ChallengePolicy>;
  updateChallengePolicy(id: string, updates: Partial<ChallengePolicy>): Promise<ChallengePolicy | undefined>;

  // iCal Feed Tokens - Secure personal calendar feed authentication
  getIcalFeedToken(id: string): Promise<IcalFeedToken | undefined>;
  getIcalFeedTokenByToken(token: string): Promise<IcalFeedToken | undefined>;
  getIcalFeedTokensByPlayer(playerId: string): Promise<IcalFeedToken[]>;
  createIcalFeedToken(tokenData: InsertIcalFeedToken): Promise<IcalFeedToken>;
  updateIcalFeedToken(id: string, updates: Partial<IcalFeedToken>): Promise<IcalFeedToken | undefined>;
  revokeIcalFeedToken(id: string, revokedBy: string, reason?: string): Promise<IcalFeedToken | undefined>;
  markTokenUsed(token: string): Promise<boolean>;
  cleanupExpiredTokens(): Promise<number>;

  // === ENHANCED PAYMENT SYSTEM ===

  // Payment Methods (SetupIntent collection)
  getPaymentMethod(id: string): Promise<PaymentMethod | undefined>;
  getPaymentMethodsByUser(userId: string): Promise<PaymentMethod[]>;
  getDefaultPaymentMethod(userId: string): Promise<PaymentMethod | undefined>;
  createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: string, updates: Partial<PaymentMethod>): Promise<PaymentMethod | undefined>;
  setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<PaymentMethod | undefined>;
  deactivatePaymentMethod(id: string): Promise<PaymentMethod | undefined>;

  // Stakes Holds (manual capture system)
  getStakesHold(id: string): Promise<StakesHold | undefined>;
  getStakesHoldsByChallenge(challengeId: string): Promise<StakesHold[]>;
  getStakesHoldsByPlayer(playerId: string): Promise<StakesHold[]>;
  getStakesHoldsByStatus(status: string): Promise<StakesHold[]>;
  getExpiringStakesHolds(hours?: number): Promise<StakesHold[]>;
  createStakesHold(hold: InsertStakesHold): Promise<StakesHold>;
  updateStakesHold(id: string, updates: Partial<StakesHold>): Promise<StakesHold | undefined>;
  captureStakesHold(id: string, reason: string): Promise<StakesHold | undefined>;
  releaseStakesHold(id: string, reason: string): Promise<StakesHold | undefined>;

  // === NOTIFICATION SYSTEM ===

  // Notification Settings
  getNotificationSettings(userId: string): Promise<NotificationSettings | undefined>;
  createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings>;
  updateNotificationSettings(userId: string, updates: Partial<NotificationSettings>): Promise<NotificationSettings | undefined>;

  // Notification Deliveries
  getNotificationDelivery(id: string): Promise<NotificationDelivery | undefined>;
  getNotificationDeliveriesByUser(userId: string): Promise<NotificationDelivery[]>;
  getNotificationDeliveriesByChallenge(challengeId: string): Promise<NotificationDelivery[]>;
  getNotificationDeliveriesByStatus(status: string): Promise<NotificationDelivery[]>;
  createNotificationDelivery(delivery: InsertNotificationDelivery): Promise<NotificationDelivery>;
  updateNotificationDelivery(id: string, updates: Partial<NotificationDelivery>): Promise<NotificationDelivery | undefined>;
  markNotificationDelivered(id: string, providerId?: string): Promise<NotificationDelivery | undefined>;
  markNotificationFailed(id: string, errorMessage: string): Promise<NotificationDelivery | undefined>;

  // === DISPUTE MANAGEMENT ===

  // Dispute Resolutions
  getDisputeResolution(id: string): Promise<DisputeResolution | undefined>;
  getDisputeResolutionsByChallenge(challengeId: string): Promise<DisputeResolution[]>;
  getDisputeResolutionsByPlayer(playerId: string): Promise<DisputeResolution[]>;
  getDisputeResolutionsByStatus(status: string): Promise<DisputeResolution[]>;
  createDisputeResolution(dispute: InsertDisputeResolution): Promise<DisputeResolution>;
  updateDisputeResolution(id: string, updates: Partial<DisputeResolution>): Promise<DisputeResolution | undefined>;
  resolveDispute(id: string, resolution: string, resolvedBy: string, action: string, refundAmount?: number): Promise<DisputeResolution | undefined>;
  addDisputeEvidence(id: string, evidenceUrls: string[], evidenceTypes: string[], notes?: string): Promise<DisputeResolution | undefined>;

  // === ANTI-ABUSE SYSTEM ===

  // Player Cooldowns
  getPlayerCooldown(id: string): Promise<PlayerCooldown | undefined>;
  getPlayerCooldownsByPlayer(playerId: string): Promise<PlayerCooldown[]>;
  getActiveCooldowns(): Promise<PlayerCooldown[]>;
  getExpiringCooldowns(hours?: number): Promise<PlayerCooldown[]>;
  createPlayerCooldown(cooldown: InsertPlayerCooldown): Promise<PlayerCooldown>;
  updatePlayerCooldown(id: string, updates: Partial<PlayerCooldown>): Promise<PlayerCooldown | undefined>;
  liftPlayerCooldown(id: string, liftedBy: string, reason: string): Promise<PlayerCooldown | undefined>;
  checkPlayerEligibility(playerId: string): Promise<{ eligible: boolean; reason?: string; cooldownId?: string }>;

  // Device Attestations
  getDeviceAttestation(id: string): Promise<DeviceAttestation | undefined>;
  getDeviceAttestationsByPlayer(playerId: string): Promise<DeviceAttestation[]>;
  getDeviceAttestationsByChallenge(challengeId: string): Promise<DeviceAttestation[]>;
  getHighRiskAttestations(threshold?: number): Promise<DeviceAttestation[]>;
  createDeviceAttestation(attestation: InsertDeviceAttestation): Promise<DeviceAttestation>;

  // === JOB QUEUE SYSTEM ===

  // Job Queue
  getJob(id: string): Promise<JobQueue | undefined>;
  getJobsByType(jobType: string): Promise<JobQueue[]>;
  getJobsByStatus(status: string): Promise<JobQueue[]>;
  getPendingJobs(limit?: number): Promise<JobQueue[]>;
  getFailedJobs(limit?: number): Promise<JobQueue[]>;
  createJob(job: InsertJobQueue): Promise<JobQueue>;
  updateJob(id: string, updates: Partial<JobQueue>): Promise<JobQueue | undefined>;
  markJobStarted(id: string, processedBy: string): Promise<JobQueue | undefined>;
  markJobCompleted(id: string, result?: any): Promise<JobQueue | undefined>;
  markJobFailed(id: string, errorMessage: string): Promise<JobQueue | undefined>;
  requeueJob(id: string): Promise<JobQueue | undefined>;
  cleanupCompletedJobs(olderThanDays?: number): Promise<number>;

  // === METRICS & MONITORING ===

  // System Metrics
  getSystemMetric(id: string): Promise<SystemMetric | undefined>;
  getSystemMetricsByType(metricType: string, hallId?: string): Promise<SystemMetric[]>;
  getSystemMetricsByTimeWindow(windowStart: Date, windowEnd: Date, metricType?: string): Promise<SystemMetric[]>;
  createSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric>;
  aggregateMetrics(metricType: string, timeWindow: string, startDate: Date, endDate: Date): Promise<SystemMetric[]>;

  // System Alerts
  getSystemAlert(id: string): Promise<SystemAlert | undefined>;
  getSystemAlertsByType(alertType: string): Promise<SystemAlert[]>;
  getActiveAlerts(): Promise<SystemAlert[]>;
  getFiringAlerts(): Promise<SystemAlert[]>;
  createSystemAlert(alert: InsertSystemAlert): Promise<SystemAlert>;
  updateSystemAlert(id: string, updates: Partial<SystemAlert>): Promise<SystemAlert | undefined>;
  triggerAlert(id: string, currentValue: number): Promise<SystemAlert | undefined>;
  resolveAlert(id: string, resolvedBy?: string): Promise<SystemAlert | undefined>;

  // === AI COACH TRAINING ANALYTICS ===

  // Session Management
  createTrainingSession(session: InsertSessionAnalytics): Promise<SelectSessionAnalytics>;
  getTrainingSession(sessionId: string): Promise<SelectSessionAnalytics | null>;
  getPlayerSessions(playerId: string, limit?: number): Promise<SelectSessionAnalytics[]>;

  // Shot Recording
  recordShots(sessionId: string, shots: InsertShot[]): Promise<SelectShot[]>;
  getSessionShots(sessionId: string): Promise<SelectShot[]>;

  // Monthly Scores & Leaderboard
  calculateMonthlyScores(period: string): Promise<void>;
  getHallLeaderboard(hallId: string, period: string): Promise<SelectLadderTrainingScore[]>;
  getPlayerTrainingScore(playerId: string, period: string): Promise<SelectLadderTrainingScore | null>;

  // Reward Management
  createReward(reward: InsertSubscriptionReward): Promise<SelectSubscriptionReward>;
  getRewardsForPeriod(period: string): Promise<SelectSubscriptionReward[]>;
  markRewardApplied(rewardId: string, stripeCouponId: string): Promise<void>;

  // === PRIZE POOL AGGREGATION ===

  // Prize Pool Management
  getPrizePool(id: string): Promise<PrizePool | undefined>;
  getPrizePoolByPoolId(poolId: string): Promise<PrizePool | undefined>;
  getPrizePoolsByHall(hallId: string): Promise<PrizePool[]>;
  getPrizePoolsByPeriod(period: string): Promise<PrizePool[]>;
  getPrizePoolsByStatus(status: string): Promise<PrizePool[]>;
  createPrizePool(prizePool: InsertPrizePool): Promise<PrizePool>;
  updatePrizePool(id: string, updates: Partial<PrizePool>): Promise<PrizePool | undefined>;
  lockPrizePool(poolId: string): Promise<PrizePool | undefined>;

  // Prize Pool Contributions
  getPrizePoolContribution(id: string): Promise<PrizePoolContribution | undefined>;
  getPrizePoolContributionsByPoolId(poolId: string): Promise<PrizePoolContribution[]>;
  getPrizePoolContributionsByPlayer(playerId: string): Promise<PrizePoolContribution[]>;
  createPrizePoolContribution(contribution: InsertPrizePoolContribution): Promise<PrizePoolContribution>;
  aggregatePrizePoolContributions(poolId: string): Promise<{ total: number; byType: Record<string, number> }>;

  // Prize Pool Distributions
  getPrizePoolDistribution(id: string): Promise<PrizePoolDistribution | undefined>;
  getPrizePoolDistributionsByPoolId(poolId: string): Promise<PrizePoolDistribution[]>;
  getPrizePoolDistributionsByRecipient(recipientId: string): Promise<PrizePoolDistribution[]>;
  getPrizePoolDistributionsByStatus(status: string): Promise<PrizePoolDistribution[]>;
  createPrizePoolDistribution(distribution: InsertPrizePoolDistribution): Promise<PrizePoolDistribution>;
  updatePrizePoolDistribution(id: string, updates: Partial<PrizePoolDistribution>): Promise<PrizePoolDistribution | undefined>;
  markDistributionCompleted(id: string, stripeTransferId: string): Promise<PrizePoolDistribution | undefined>;
  markDistributionFailed(id: string, failureReason: string): Promise<PrizePoolDistribution | undefined>;
  // Match Divisions
  getMatchDivisions(): Promise<MatchDivision[]>;
  getMatchDivision(id: string): Promise<MatchDivision | undefined>;
  createMatchDivision(division: InsertMatchDivision): Promise<MatchDivision>;
  updateMatchDivision(id: string, updates: Partial<InsertMatchDivision>): Promise<MatchDivision | undefined>;
  deleteMatchDivision(id: string): Promise<boolean>;
  // Operator Tiers
  getOperatorTiers(): Promise<OperatorTier[]>;
  getOperatorTier(id: string): Promise<OperatorTier | undefined>;
  createOperatorTier(tier: InsertOperatorTier): Promise<OperatorTier>;
  updateOperatorTier(id: string, updates: Partial<InsertOperatorTier>): Promise<OperatorTier | undefined>;
  // Match Entries
  getMatchEntries(): Promise<MatchEntry[]>;
  getMatchEntry(id: string): Promise<MatchEntry | undefined>;
  createMatchEntry(entry: InsertMatchEntry): Promise<MatchEntry>;
  updateMatchEntry(id: string, updates: Partial<MatchEntry>): Promise<MatchEntry | undefined>;
  deleteMatchEntry(id: string): Promise<boolean>;
  // Payout Distributions
  getPayoutDistributions(): Promise<PayoutDistribution[]>;
  getPayoutDistribution(id: string): Promise<PayoutDistribution | undefined>;
  createPayoutDistribution(data: InsertPayoutDistribution): Promise<PayoutDistribution>;
  updatePayoutDistribution(id: string, updates: Partial<PayoutDistribution>): Promise<PayoutDistribution | undefined>;
  deletePayoutDistribution(id: string): Promise<boolean>;
  // Operator Settings
  getAllOperatorSettings(): Promise<OperatorSettings[]>;
  // Organizations
  getOrganization(id: string): Promise<Organization | undefined>;
  getAllOrganizations(): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined>;
  // Payout Transfers
  getAllPayoutTransfers(): Promise<PayoutTransfer[]>;
  getPayoutTransfer(id: string): Promise<PayoutTransfer | undefined>;
  createPayoutTransfer(transfer: InsertPayoutTransfer): Promise<PayoutTransfer>;
  // Hall methods
  getAllHallMatches(): Promise<HallMatch[]>;
  getRosterByHall(hallId: string): Promise<HallRoster[]>;
  getRosterByPlayer(playerId: string): Promise<HallRoster[]>;
  unlockHallBattles(hallId: string, unlockedBy: string): Promise<PoolHall | undefined>;
  lockHallBattles(hallId: string): Promise<PoolHall | undefined>;

}

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private organizations = new Map<string, Organization>();
  private payoutTransfers = new Map<string, PayoutTransfer>();
  private players = new Map<string, Player>();
  private matches = new Map<string, Match>();
  private tournaments = new Map<string, Tournament>();
  private tournamentCalcuttas = new Map<string, TournamentCalcutta>();
  private calcuttaBids = new Map<string, CalcuttaBid>();
  private seasonPredictions = new Map<string, SeasonPrediction>();
  private predictionEntries = new Map<string, PredictionEntry>();
  private addedMoneyFunds = new Map<string, AddedMoneyFund>();
  private kellyPools = new Map<string, KellyPool>();
  private moneyGames = new Map<string, MoneyGame>();
  private bounties = new Map<string, Bounty>();
  private charityEvents = new Map<string, CharityEvent>();
  private supportRequests = new Map<string, SupportRequest>();
  private liveStreams = new Map<string, LiveStream>();
  private poolHalls = new Map<string, PoolHall>();
  private hallMatches = new Map<string, HallMatch>();
  private rookieMatches = new Map<string, RookieMatch>();
  private rookieEvents = new Map<string, RookieEvent>();
  private rookieAchievements = new Map<string, RookieAchievement>();
  private rookieSubscriptions = new Map<string, RookieSubscription>();
  private hallRosters = new Map<string, HallRoster>();
  private webhookEvents = new Map<string, WebhookEvent>();
  private operatorSettings = new Map<string, OperatorSettings>(); // keyed by operatorUserId

  // Side Betting Storage
  private wallets = new Map<string, Wallet>(); // keyed by userId
  private sidePots = new Map<string, SidePot>();
  private sideBets = new Map<string, SideBet>();
  private ledgerEntries = new Map<string, LedgerEntry>();
  private resolutions = new Map<string, Resolution>();

  // Operator Subscription Storage
  private operatorSubscriptions = new Map<string, OperatorSubscription>(); // keyed by operatorId
  private operatorSubscriptionSplits = new Map<string, OperatorSubscriptionSplit>(); // keyed by split id

  // Team Division Storage
  private teams = new Map<string, Team>();
  private teamPlayers = new Map<string, TeamPlayer>();
  private teamMatches = new Map<string, TeamMatch>();
  private teamSets = new Map<string, TeamSet>();

  // Team Challenge Storage
  private teamChallenges = new Map<string, TeamChallenge>();
  private teamChallengeParticipants = new Map<string, TeamChallengeParticipant>();

  // === SPORTSMANSHIP VOTE-OUT SYSTEM ===
  private checkins = new Map<string, Checkin>();
  private attitudeVotes = new Map<string, AttitudeVote>();
  private attitudeBallots = new Map<string, AttitudeBallot>();
  private incidents = new Map<string, Incident>();

  // === MATCH DIVISION SYSTEM ===
  private matchDivisions = new Map<string, MatchDivision>();
  private operatorTiers = new Map<string, OperatorTier>();

  // === TEAM STRIPE & EARNINGS SYSTEM ===
  private teamStripeAccounts = new Map<string, TeamStripeAccount>();
  private matchEntries = new Map<string, MatchEntry>();
  private payoutDistributions = new Map<string, PayoutDistribution>();
  private teamRegistrations = new Map<string, TeamRegistration>();

  // === FILE MANAGEMENT SYSTEM ===
  private uploadedFiles = new Map<string, UploadedFile>();
  private fileShares = new Map<string, FileShare>();

  // === WEIGHT RULES & TUTORING SYSTEM ===
  private weightRules = new Map<string, WeightRule>();
  private tutoringSessions = new Map<string, TutoringSession>();
  private tutoringCredits = new Map<string, TutoringCredits>();

  // === COMMISSION & EARNINGS TRACKING ===
  private commissionRates = new Map<string, CommissionRate>();
  private platformEarnings = new Map<string, PlatformEarnings>();
  private membershipEarnings = new Map<string, MembershipEarnings>();
  private operatorPayouts = new Map<string, OperatorPayout>();

  // === MEMBERSHIP SUBSCRIPTIONS ===
  private membershipSubscriptions = new Map<string, MembershipSubscription>();

  // === CHALLENGE SYSTEM ===
  private challenges = new Map<string, Challenge>();
  private challengeFees = new Map<string, ChallengeFee>();
  private challengeCheckIns = new Map<string, ChallengeCheckIn>();
  private challengePolicies = new Map<string, ChallengePolicy>();

  // === QR CODE & ICAL SYSTEMS ===
  private qrCodeNonces = new Map<string, QrCodeNonce>();
  private icalFeedTokens = new Map<string, IcalFeedToken>();

  // === PAYMENT METHODS & STAKES ===
  private paymentMethods = new Map<string, PaymentMethod>();
  private stakesHolds = new Map<string, StakesHold>();

  // === NOTIFICATION SYSTEM ===
  private notificationSettings = new Map<string, NotificationSettings>();
  private notificationDeliveries = new Map<string, NotificationDelivery>();

  // === DISPUTE MANAGEMENT ===
  private disputeResolutions = new Map<string, DisputeResolution>();

  // === ANTI-ABUSE SYSTEM ===
  private playerCooldowns = new Map<string, PlayerCooldown>();
  private deviceAttestations = new Map<string, DeviceAttestation>();

  // === JOB QUEUE & SYSTEM METRICS ===
  private jobQueue = new Map<string, JobQueue>();
  private systemMetrics = new Map<string, SystemMetric>();
  private systemAlerts = new Map<string, SystemAlert>();

  constructor() {
    // Initialize with seed data for demonstration (disabled in production)
    if (process.env.NODE_ENV === "development") {
      this.initializeSeedData();
    }
  }

  // User Management Methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByStripeConnectId(stripeConnectId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.stripeConnectId === stripeConnectId);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getStaffUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user =>
      user.globalRole === "STAFF" || user.globalRole === "OWNER"
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      email: insertUser.email,
      name: insertUser.name,
      passwordHash: insertUser.passwordHash,
      twoFactorEnabled: insertUser.twoFactorEnabled ?? false,
      twoFactorSecret: insertUser.twoFactorSecret,
      phoneNumber: insertUser.phoneNumber,
      globalRole: insertUser.globalRole,
      role: insertUser.role,
      profileComplete: insertUser.profileComplete ?? false,
      onboardingComplete: insertUser.onboardingComplete ?? false,
      accountStatus: insertUser.accountStatus ?? "active",
      stripeCustomerId: insertUser.stripeCustomerId,
      stripeConnectId: insertUser.stripeConnectId,
      payoutShareBps: insertUser.payoutShareBps,
      hallName: insertUser.hallName,
      city: insertUser.city,
      state: insertUser.state,
      subscriptionTier: insertUser.subscriptionTier,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    return updateMapRecord(this.users, id, { ...updates, updatedAt: new Date() }, NULLABLE_FIELDS.User);
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const existing = this.users.get(user.id);
    if (existing) {
      const updated = await this.updateUser(user.id, user);
      return updated!;
    } else {
      const insertData: InsertUser = {
        email: user.email || "",
        globalRole: user.globalRole || "PLAYER",
        stripeCustomerId: user.stripeCustomerId,
        stripeConnectId: user.stripeConnectId,
        payoutShareBps: user.payoutShareBps,
        onboardingComplete: user.onboardingComplete ?? false,
      };
      return this.createUser(insertData);
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Organization methods
  async getOrganization(id: string): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const id = randomUUID();
    const organization: Organization = {
      id,
      name: insertOrg.name,
      stripeCustomerId: insertOrg.stripeCustomerId,
      stripeSubscriptionId: insertOrg.stripeSubscriptionId,
      seatLimit: insertOrg.seatLimit ?? 5,
      createdAt: new Date(),
    };
    this.organizations.set(id, organization);
    return organization;
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined> {
    return updateMapRecord(this.organizations, id, updates, NULLABLE_FIELDS.Organization);
  }

  // PayoutTransfer methods
  async getPayoutTransfer(id: string): Promise<PayoutTransfer | undefined> {
    return this.payoutTransfers.get(id);
  }

  async getPayoutTransfersByInvoice(invoiceId: string): Promise<PayoutTransfer[]> {
    return Array.from(this.payoutTransfers.values()).filter(
      transfer => transfer.invoiceId === invoiceId
    );
  }

  async getAllPayoutTransfers(): Promise<PayoutTransfer[]> {
    return Array.from(this.payoutTransfers.values());
  }

  async createPayoutTransfer(insertTransfer: InsertPayoutTransfer): Promise<PayoutTransfer> {
    const id = randomUUID();
    const transfer: PayoutTransfer = {
      id,
      invoiceId: insertTransfer.invoiceId,
      stripeTransferId: insertTransfer.stripeTransferId,
      recipientUserId: insertTransfer.recipientUserId,
      amount: insertTransfer.amount,
      shareType: insertTransfer.shareType,
      createdAt: new Date(),
    };
    this.payoutTransfers.set(id, transfer);
    return transfer;
  }

  // OperatorSettings methods
  async getOperatorSettings(operatorUserId: string): Promise<OperatorSettings | undefined> {
    return Array.from(this.operatorSettings.values()).find(settings =>
      settings.operatorUserId === operatorUserId
    );
  }

  async getAllOperatorSettings(): Promise<OperatorSettings[]> {
    return Array.from(this.operatorSettings.values());
  }

  async createOperatorSettings(settings: InsertOperatorSettings): Promise<OperatorSettings> {
    const newSettings: OperatorSettings = {
      id: randomUUID(),
      operatorUserId: settings.operatorUserId,
      cityName: settings.cityName || null,
      areaName: settings.areaName || null,
      customBranding: settings.customBranding || null,
      hasFreeMonths: settings.hasFreeMonths || null,
      freeMonthsCount: settings.freeMonthsCount || null,
      freeMonthsGrantedBy: settings.freeMonthsGrantedBy || null,
      freeMonthsGrantedAt: settings.freeMonthsGrantedAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.operatorSettings.set(newSettings.id, newSettings);
    return newSettings;
  }

  async updateOperatorSettings(operatorUserId: string, updates: Partial<OperatorSettings>): Promise<OperatorSettings | undefined> {
    const existing = await this.getOperatorSettings(operatorUserId);
    if (!existing) return undefined;
    return updateMapRecord(this.operatorSettings, existing.id, { ...updates, updatedAt: new Date() }, NULLABLE_FIELDS.OperatorSettings || []);
  }

  private initializeSeedData() {
    // Initialize owner user for platform management
    const ownerId = randomUUID();
    const ownerUser: User = {
      id: ownerId,
      email: "owner@actionladder.com",
      name: "Platform Owner",
      globalRole: "OWNER",
      payoutShareBps: 4000, // 40% share
      onboardingComplete: true,
      createdAt: new Date(),
    };
    this.users.set(ownerId, ownerUser);

    // Initialize test organizations for demonstration
    const testOrg1: Organization = {
      id: randomUUID(),
      name: "Seguin Winners Pool Hall",
      stripeCustomerId: "cus_test_seguin123",
      stripeSubscriptionId: "sub_test_seguin123",
      seatLimit: 25,
      createdAt: new Date(),
    };
    this.organizations.set(testOrg1.id, testOrg1);

    const testOrg2: Organization = {
      id: randomUUID(),
      name: "San Marcos Sharks",
      seatLimit: 5,
      createdAt: new Date(),
    };
    this.organizations.set(testOrg2.id, testOrg2);

    // Initialize Tri-City pool halls
    const seguin: PoolHall = {
      id: "hall-seguin",
      name: "Seguin Winners Pool Hall",
      city: "Seguin",
      wins: 12,
      losses: 8,
      points: 1200,
      description: "Home of the champions, where legends are made on felt",
      address: "123 Main St, Seguin, TX",
      phone: "(830) 555-0123",
      active: true,
      battlesUnlocked: false,
      unlockedBy: null,
      unlockedAt: null,
      createdAt: new Date(),
    };
    this.poolHalls.set(seguin.id, seguin);

    const newBraunfels: PoolHall = {
      id: "hall-new-braunfels",
      name: "New Braunfels Sharks",
      city: "New Braunfels",
      wins: 10,
      losses: 7,
      points: 1050,
      description: "Sharp shooters with precision game play",
      address: "456 River Rd, New Braunfels, TX",
      phone: "(830) 555-0456",
      active: true,
      battlesUnlocked: false,
      unlockedBy: null,
      unlockedAt: null,
      createdAt: new Date(),
    };
    this.poolHalls.set(newBraunfels.id, newBraunfels);

    const sanMarcos: PoolHall = {
      id: "hall-san-marcos",
      name: "San Marcos Hustlers",
      city: "San Marcos",
      wins: 8,
      losses: 12,
      points: 850,
      description: "Underdogs with heart and hustle",
      address: "789 University Dr, San Marcos, TX",
      phone: "(512) 555-0789",
      active: true,
      battlesUnlocked: false,
      unlockedBy: null,
      unlockedAt: null,
      createdAt: new Date(),
    };
    this.poolHalls.set(sanMarcos.id, sanMarcos);

    // Initialize some hall matches for demonstration
    const hallMatch1: HallMatch = {
      id: "match-1",
      homeHallId: seguin.id,
      awayHallId: newBraunfels.id,
      format: "team_9ball",
      totalRacks: 9,
      homeScore: 5,
      awayScore: 4,
      status: "completed",
      winnerHallId: seguin.id,
      scheduledDate: new Date("2024-01-15"),
      completedAt: new Date("2024-01-15T21:30:00"),
      notes: "Intense match, came down to the final rack",
      stake: 50000, // $500 per team
      createdAt: new Date("2024-01-10"),
    };
    this.hallMatches.set(hallMatch1.id, hallMatch1);

    const hallMatch2: HallMatch = {
      id: "match-2",
      homeHallId: sanMarcos.id,
      awayHallId: seguin.id,
      format: "team_8ball",
      totalRacks: 7,
      homeScore: 2,
      awayScore: 5,
      status: "completed",
      winnerHallId: seguin.id,
      scheduledDate: new Date("2024-01-20"),
      completedAt: new Date("2024-01-20T20:45:00"),
      notes: "Seguin dominated with solid fundamentals",
      stake: 30000, // $300 per team
      createdAt: new Date("2024-01-18"),
    };
    this.hallMatches.set(hallMatch2.id, hallMatch2);

    // Seed players
    const seedPlayers: Player[] = [
      {
        id: randomUUID(),
        name: "Tommy 'The Knife' Rodriguez",
        rating: 720,
        city: "Seguin",
        member: true,
        theme: "Blood and chalk dust",
        points: 2850,
        streak: 7,
        respectPoints: 45,
        birthday: "03-15",
        stripeCustomerId: null,
        userId: null,
        isRookie: false,
        rookieWins: 0,
        rookieLosses: 0,
        rookiePoints: 0,
        rookieStreak: 0,
        rookiePassActive: false,
        rookiePassExpiresAt: null,
        graduatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        membershipTier: "basic",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Jesse — The Spot",
        rating: 605,
        city: "Seguin",
        member: false,
        theme: "Back in Black",
        points: 350,
        streak: 1,
        respectPoints: 10,
        birthday: "01-15",
        stripeCustomerId: null,
        userId: null,
        isRookie: false,
        rookieWins: 0,
        rookieLosses: 0,
        rookiePoints: 0,
        rookieStreak: 0,
        rookiePassActive: false,
        rookiePassExpiresAt: null,
        graduatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        membershipTier: "none",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "San Marcos Sniper",
        rating: 590,
        city: "San Marcos",
        member: true,
        theme: "X Gon' Give It to Ya",
        points: 160,
        streak: 2,
        respectPoints: 5,
        birthday: "12-20",
        stripeCustomerId: null,
        userId: null,
        isRookie: false,
        rookieWins: 0,
        rookieLosses: 0,
        rookiePoints: 0,
        rookieStreak: 0,
        rookiePassActive: false,
        rookiePassExpiresAt: null,
        graduatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        membershipTier: "pro",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Seguin Shark",
        rating: 540,
        city: "Seguin",
        member: false,
        theme: "Congratulations",
        points: 280,
        streak: 0,
        respectPoints: 8,
        birthday: "06-10",
        stripeCustomerId: null,
        userId: null,
        isRookie: false,
        rookieWins: 0,
        rookieLosses: 0,
        rookiePoints: 0,
        rookieStreak: 0,
        rookiePassActive: false,
        rookiePassExpiresAt: null,
        graduatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        membershipTier: "none",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Chalktopus",
        rating: 520,
        city: "New Braunfels",
        member: true,
        theme: "Monster",
        points: 220,
        streak: 0,
        respectPoints: 25,
        birthday: "09-05",
        stripeCustomerId: null,
        userId: null,
        isRookie: false,
        rookieWins: 0,
        rookieLosses: 0,
        rookiePoints: 0,
        rookieStreak: 0,
        rookiePassActive: false,
        rookiePassExpiresAt: null,
        graduatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        membershipTier: "basic",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "New Braunfels Ninja",
        rating: 480,
        city: "New Braunfels",
        member: false,
        theme: "Ninja",
        points: 180,
        streak: 1,
        respectPoints: 3,
        birthday: "01-28",
        stripeCustomerId: null,
        userId: null,
        isRookie: true,
        rookieWins: 3,
        rookieLosses: 1,
        rookiePoints: 25,
        rookieStreak: 2,
        rookiePassActive: false,
        rookiePassExpiresAt: null,
        graduatedAt: null,
        membershipTier: "none",
        createdAt: new Date(),
      },
      // Add some rookie players for demonstration
      {
        id: randomUUID(),
        name: "Rookie Mike",
        rating: 420,
        city: "San Marcos",
        member: false,
        theme: "Learning the ropes",
        points: 100,
        streak: 2,
        respectPoints: 5,
        birthday: "05-12",
        stripeCustomerId: null,
        userId: null,
        isRookie: true,
        rookieWins: 5,
        rookieLosses: 2,
        rookiePoints: 35,
        rookieStreak: 2,
        rookiePassActive: false,
        rookiePassExpiresAt: null,
        graduatedAt: null,
        membershipTier: "none",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Sarah 'Rising Star'",
        rating: 460,
        city: "Seguin",
        member: true,
        theme: "Grinding to the top",
        points: 140,
        streak: 1,
        respectPoints: 12,
        birthday: "08-03",
        stripeCustomerId: null,
        userId: null,
        isRookie: true,
        rookieWins: 8,
        rookieLosses: 3,
        rookiePoints: 55,
        rookieStreak: 1,
        rookiePassActive: true,
        rookiePassExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        graduatedAt: null,
        membershipTier: "basic",
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Pocket Rookie",
        rating: 380,
        city: "New Braunfels",
        member: false,
        theme: "Future champion",
        points: 80,
        streak: 0,
        respectPoints: 3,
        birthday: "11-22",
        stripeCustomerId: null,
        userId: null,
        isRookie: true,
        rookieWins: 2,
        rookieLosses: 4,
        rookiePoints: 15,
        rookieStreak: 0,
        rookiePassActive: false,
        rookiePassExpiresAt: null,
        graduatedAt: null,
        membershipTier: "none",
        createdAt: new Date(),
      },
    ];

    seedPlayers.forEach(player => {
      this.players.set(player.id, player);
    });

    // Seed tournaments
    const tournament1: Tournament = {
      id: randomUUID(),
      name: "Friday Night Fights",
      entry: 50,
      prizePool: 400,
      format: "Double Elimination",
      game: "8-Ball",
      maxPlayers: 16,
      currentPlayers: 8,
      status: "open",
      stripeProductId: null,
      addedMoney: 0,
      calcuttaEnabled: false,
      calcuttaDeadline: null,
      seasonPredictionEnabled: false,
      createdAt: new Date(),
    };

    const tournament2: Tournament = {
      id: randomUUID(),
      name: "Weekly 9-Ball Open",
      entry: 25,
      prizePool: 175,
      format: "Single Elimination",
      game: "9-Ball",
      maxPlayers: 12,
      currentPlayers: 7,
      status: "open",
      stripeProductId: null,
      addedMoney: 0,
      calcuttaEnabled: false,
      calcuttaDeadline: null,
      seasonPredictionEnabled: false,
      createdAt: new Date(),
    };

    this.tournaments.set(tournament1.id, tournament1);
    this.tournaments.set(tournament2.id, tournament2);

    // Seed Kelly Pool
    const kellyPool: KellyPool = {
      id: randomUUID(),
      name: "Table 3 Kelly Pool",
      entry: 20,
      pot: 80,
      maxPlayers: 8,
      currentPlayers: 4,
      balls: ["1", "2", "3", "open"],
      status: "open",
      table: "Table 3",
      createdAt: new Date(),
    };

    this.kellyPools.set(kellyPool.id, kellyPool);

    // Seed charity event
    const charityEvent: CharityEvent = {
      id: randomUUID(),
      name: "Local Youth Center Support",
      description: "Tournament proceeds benefit Seguin Youth Programs",
      goal: 500,
      raised: 285,
      percentage: 0.1,
      active: true,
      createdAt: new Date(),
    };

    this.charityEvents.set(charityEvent.id, charityEvent);

    // Seed bounties
    const bounty1: Bounty = {
      id: randomUUID(),
      type: "onPlayer",
      rank: null,
      targetId: seedPlayers[0].id, // Tyga Hoodz
      prize: 50,
      active: true,
      description: "Beat the King of 600+ Division",
      createdAt: new Date(),
    };

    const bounty2: Bounty = {
      id: randomUUID(),
      type: "onPlayer",
      rank: null,
      targetId: seedPlayers[2].id, // San Marcos Sniper
      prize: 30,
      active: true,
      description: "Beat the King of 599 & Under Division",
      createdAt: new Date(),
    };

    this.bounties.set(bounty1.id, bounty1);
    this.bounties.set(bounty2.id, bounty2);

    // Seed money games
    const moneyGame1: MoneyGame = {
      id: randomUUID(),
      name: "High Stakes Lag Challenge",
      billAmount: 100,
      prizePool: 400,
      currentPlayers: 2,
      maxPlayers: 4,
      table: "Table 1",
      gameType: "straight-lag",
      status: "waiting",
      players: ["Mike Chen", "Sarah Rodriguez"],
      winner: null,
      createdAt: new Date(),
    };

    const moneyGame2: MoneyGame = {
      id: randomUUID(),
      name: "Rail First Money Match",
      billAmount: 50,
      prizePool: 250,
      currentPlayers: 4,
      maxPlayers: 5,
      table: "Table 2",
      gameType: "rail-first",
      status: "active",
      players: ["Alex Turner", "Jamie Lee", "Chris Davis", "Pat Johnson"],
      winner: null,
      createdAt: new Date(),
    };

    const moneyGame3: MoneyGame = {
      id: randomUUID(),
      name: "Progressive Pot Challenge",
      billAmount: 20,
      prizePool: 160,
      currentPlayers: 8,
      maxPlayers: 8,
      table: "Table 3",
      gameType: "progressive",
      status: "completed",
      players: ["Tom Wilson", "Lisa Brown", "Jordan Smith", "Casey White", "Morgan Taylor", "Riley Garcia", "Drew Martinez", "Quinn Anderson"],
      winner: "Lisa Brown",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    };

    this.moneyGames.set(moneyGame1.id, moneyGame1);
    this.moneyGames.set(moneyGame2.id, moneyGame2);
    this.moneyGames.set(moneyGame3.id, moneyGame3);

    // === INITIALIZE MATCH DIVISIONS ===
    const poolhallDivision: MatchDivision = {
      id: randomUUID(),
      name: "poolhall",
      displayName: "Poolhall vs Poolhall",
      minTeamSize: 2,
      maxTeamSize: 5,
      entryFeeMin: 1000, // $10 minimum
      entryFeeMax: 1000000, // $10,000 maximum
      requiresStreaming: false,
      requiresCaptain: false,
      allowsSideBets: true,
      description: "2v2 or 3v3 matches. Each player plays singles + one team match. Poolhall Operators set challenge rules + fee. Played in-house or neutral site. Winner takes challenge fee + points. Trash talk + walk-ins encouraged.",
      active: true,
      createdAt: new Date(),
    };

    const cityDivision: MatchDivision = {
      id: randomUUID(),
      name: "city",
      displayName: "City vs City",
      minTeamSize: 5,
      maxTeamSize: 10,
      entryFeeMin: 50000, // $500 minimum
      entryFeeMax: 200000, // $2,000 maximum
      requiresStreaming: true,
      requiresCaptain: true,
      allowsSideBets: true,
      description: "5 or 10-man squads. Played on 2–3 tables simultaneously. Each team must name a captain + streamer. 'Put-Up' Rule: Captain must pick who plays under pressure. Side bets allowed — but official result = Ladder Points only.",
      active: true,
      createdAt: new Date(),
    };

    const stateDivision: MatchDivision = {
      id: randomUUID(),
      name: "state",
      displayName: "State vs State",
      minTeamSize: 10,
      maxTeamSize: 12,
      entryFeeMin: 1000000, // $10,000 minimum
      entryFeeMax: 1000000, // $10,000 maximum
      requiresStreaming: true,
      requiresCaptain: true,
      allowsSideBets: true,
      description: "10–12 man teams. Home/Away rotation OR neutral high-end venue. 1-Day Battle Format or 3-Day Series. Includes Side Games: 3pt contest, Trick Shot, Speed Run. States build fans, merch, hype. Real MVP and 'Brick Award' for worst performance.",
      active: true,
      createdAt: new Date(),
    };

    this.matchDivisions.set(poolhallDivision.id, poolhallDivision);
    this.matchDivisions.set(cityDivision.id, cityDivision);
    this.matchDivisions.set(stateDivision.id, stateDivision);

    // === INITIALIZE OPERATOR TIERS ===
    const rookieHall: OperatorTier = {
      id: randomUUID(),
      name: "rookie_hall",
      displayName: "Rookie Hall",
      monthlyFee: 9900, // $99
      revenueSplitPercent: 5, // 5% to Action Ladder
      maxTeams: 1,
      hasPromoTools: false,
      hasLiveStreamBonus: false,
      hasResellRights: false,
      description: "Perfect for new operators getting started",
      features: ["Poolhall Ladder", "1 Team", "5% Platform Fee"],
      active: true,
      createdAt: new Date(),
    };

    const basicHall: OperatorTier = {
      id: randomUUID(),
      name: "basic_hall",
      displayName: "Basic Hall",
      monthlyFee: 19900, // $199
      revenueSplitPercent: 10, // 10% to Action Ladder
      maxTeams: 1,
      hasPromoTools: false,
      hasLiveStreamBonus: false,
      hasResellRights: false,
      description: "Access to all ladders with competitive revenue split",
      features: ["All Ladders", "1 Team", "10% Platform Fee"],
      active: true,
      createdAt: new Date(),
    };

    const eliteOperator: OperatorTier = {
      id: randomUUID(),
      name: "elite_operator",
      displayName: "Elite Operator",
      monthlyFee: 39900, // $399
      revenueSplitPercent: 10, // 10% to Action Ladder
      maxTeams: 2,
      hasPromoTools: true,
      hasLiveStreamBonus: true,
      hasResellRights: false,
      description: "Full access with promotional tools and streaming bonuses",
      features: ["All Ladders", "2 Teams", "Promo Tools", "Live Stream Bonus", "10% Platform Fee"],
      active: true,
      createdAt: new Date(),
    };

    const franchise: OperatorTier = {
      id: randomUUID(),
      name: "franchise",
      displayName: "Franchise",
      monthlyFee: 79900, // $799
      revenueSplitPercent: 10, // 10% to Action Ladder
      maxTeams: null, // Unlimited
      hasPromoTools: true,
      hasLiveStreamBonus: true,
      hasResellRights: true,
      description: "Complete control with reselling rights and unlimited teams",
      features: ["Full Control", "Unlimited Teams", "Resell Rights", "All Features", "10% Platform Fee"],
      active: true,
      createdAt: new Date(),
    };

    this.operatorTiers.set(rookieHall.id, rookieHall);
    this.operatorTiers.set(basicHall.id, basicHall);
    this.operatorTiers.set(eliteOperator.id, eliteOperator);
    this.operatorTiers.set(franchise.id, franchise);
  }

  // Player methods
  async getPlayer(id: string): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async getPlayerByUserId(userId: string): Promise<Player | undefined> {
    for (const player of Array.from(this.players.values())) {
      if (player.userId === userId) {
        return player;
      }
    }
    return undefined;
  }

  async getPlayers(): Promise<Player[]> {
    return Array.from(this.players.values());
  }

  async getAllPlayers(): Promise<Player[]> {
    return this.getPlayers();
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = randomUUID();
    const player: Player = {
      id,
      name: insertPlayer.name,
      rating: insertPlayer.rating ?? 500,
      city: nullifyUndefined(insertPlayer.city),
      member: nullifyUndefined(insertPlayer.member),
      theme: nullifyUndefined(insertPlayer.theme),
      points: insertPlayer.points ?? 800,
      streak: nullifyUndefined(insertPlayer.streak),
      respectPoints: nullifyUndefined(insertPlayer.respectPoints),
      birthday: nullifyUndefined(insertPlayer.birthday),
      stripeCustomerId: nullifyUndefined(insertPlayer.stripeCustomerId),
      userId: nullifyUndefined(insertPlayer.userId),
      isRookie: insertPlayer.isRookie ?? true,
      rookieWins: insertPlayer.rookieWins ?? 0,
      rookieLosses: insertPlayer.rookieLosses ?? 0,
      rookiePoints: insertPlayer.rookiePoints ?? 0,
      rookieStreak: insertPlayer.rookieStreak ?? 0,
      rookiePassActive: insertPlayer.rookiePassActive ?? false,
      rookiePassExpiresAt: nullifyUndefined(insertPlayer.rookiePassExpiresAt),
      graduatedAt: nullifyUndefined(insertPlayer.graduatedAt),
      membershipTier: nullifyUndefined(insertPlayer.membershipTier),
      createdAt: new Date(),
    };
    this.players.set(id, player);
    return player;
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined> {
    return updateMapRecord(this.players, id, updates, NULLABLE_FIELDS.Player);
  }

  async deletePlayer(id: string): Promise<boolean> {
    return this.players.delete(id);
  }

  // Match methods
  async getMatch(id: string): Promise<Match | undefined> {
    return this.matches.get(id);
  }

  async getMatches(): Promise<Match[]> {
    return Array.from(this.matches.values());
  }

  async getAllMatches(): Promise<Match[]> {
    return this.getMatches();
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = randomUUID();
    const match: Match = {
      id,
      division: insertMatch.division,
      challenger: insertMatch.challenger,
      opponent: insertMatch.opponent,
      game: insertMatch.game,
      table: insertMatch.table,
      stake: insertMatch.stake,
      time: insertMatch.time,
      notes: nullifyUndefined(insertMatch.notes),
      status: insertMatch.status ?? "scheduled",
      winner: nullifyUndefined(insertMatch.winner),
      commission: nullifyUndefined(insertMatch.commission),
      bountyAward: nullifyUndefined(insertMatch.bountyAward),
      weightMultiplierBps: nullifyUndefined(insertMatch.weightMultiplierBps),
      owedWeight: insertMatch.owedWeight ?? false,
      platformCommissionBps: insertMatch.platformCommissionBps ?? 1000,
      operatorCommissionBps: insertMatch.operatorCommissionBps ?? 500,
      platformEarnings: insertMatch.platformEarnings ?? 0,
      operatorEarnings: insertMatch.operatorEarnings ?? 0,
      prizePoolAmount: nullifyUndefined(insertMatch.prizePoolAmount),
      reportedAt: null,
      createdAt: new Date(),
    };
    this.matches.set(id, match);
    return match;
  }

  // Tournament methods
  async getTournament(id: string): Promise<Tournament | undefined> {
    return this.tournaments.get(id);
  }

  async getTournaments(): Promise<Tournament[]> {
    return Array.from(this.tournaments.values());
  }

  async getAllTournaments(): Promise<Tournament[]> {
    return this.getTournaments();
  }

  async createTournament(insertTournament: InsertTournament): Promise<Tournament> {
    const id = randomUUID();
    const tournament: Tournament = {
      status: null,
      currentPlayers: null,
      stripeProductId: null,
      addedMoney: null,
      calcuttaEnabled: null,
      calcuttaDeadline: null,
      seasonPredictionEnabled: null,
      ...insertTournament,
      id,
      createdAt: new Date(),
    };
    this.tournaments.set(id, tournament);
    return tournament;
  }

  async updateTournament(id: string, updates: Partial<Tournament>): Promise<Tournament | undefined> {
    const tournament = this.tournaments.get(id);
    if (!tournament) return undefined;

    const updatedTournament = { ...tournament, ...updates };
    this.tournaments.set(id, updatedTournament);
    return updatedTournament;
  }

  // Tournament Calcutta methods
  async getTournamentCalcutta(id: string): Promise<TournamentCalcutta | undefined> {
    return this.tournamentCalcuttas.get(id);
  }

  async getTournamentCalcuttas(): Promise<TournamentCalcutta[]> {
    return Array.from(this.tournamentCalcuttas.values());
  }

  async getTournamentCalcuttasByTournament(tournamentId: string): Promise<TournamentCalcutta[]> {
    return Array.from(this.tournamentCalcuttas.values()).filter(c => c.tournamentId === tournamentId);
  }

  async createTournamentCalcutta(insertCalcutta: InsertTournamentCalcutta): Promise<TournamentCalcutta> {
    const id = randomUUID();
    const calcutta: TournamentCalcutta = {
      currentBid: null,
      currentBidderId: null,
      minimumBid: null,
      totalBids: null,
      biddingOpen: null,
      finalPayout: null,
      status: null,
      ...insertCalcutta,
      id,
      createdAt: new Date(),
    };
    this.tournamentCalcuttas.set(id, calcutta);
    return calcutta;
  }

  async updateTournamentCalcutta(id: string, updates: Partial<TournamentCalcutta>): Promise<TournamentCalcutta | undefined> {
    const calcutta = this.tournamentCalcuttas.get(id);
    if (!calcutta) return undefined;

    const updatedCalcutta = { ...calcutta, ...updates };
    this.tournamentCalcuttas.set(id, updatedCalcutta);
    return updatedCalcutta;
  }

  // Calcutta Bid methods
  async getCalcuttaBid(id: string): Promise<CalcuttaBid | undefined> {
    return this.calcuttaBids.get(id);
  }

  async getCalcuttaBids(): Promise<CalcuttaBid[]> {
    return Array.from(this.calcuttaBids.values());
  }

  async getCalcuttaBidsByCalcutta(calcuttaId: string): Promise<CalcuttaBid[]> {
    return Array.from(this.calcuttaBids.values()).filter(b => b.calcuttaId === calcuttaId);
  }

  async getCalcuttaBidsByBidder(bidderId: string): Promise<CalcuttaBid[]> {
    return Array.from(this.calcuttaBids.values()).filter(b => b.bidderId === bidderId);
  }

  async createCalcuttaBid(insertBid: InsertCalcuttaBid): Promise<CalcuttaBid> {
    const id = randomUUID();
    const bid: CalcuttaBid = {
      bidTime: null,
      isWinning: null,
      stripePaymentIntentId: null,
      ...insertBid,
      id,
      createdAt: new Date(),
    };
    this.calcuttaBids.set(id, bid);
    return bid;
  }

  async updateCalcuttaBid(id: string, updates: Partial<CalcuttaBid>): Promise<CalcuttaBid | undefined> {
    const bid = this.calcuttaBids.get(id);
    if (!bid) return undefined;

    const updatedBid = { ...bid, ...updates };
    this.calcuttaBids.set(id, updatedBid);
    return updatedBid;
  }

  // Season Prediction methods
  async getSeasonPrediction(id: string): Promise<SeasonPrediction | undefined> {
    return this.seasonPredictions.get(id);
  }

  async getSeasonPredictions(): Promise<SeasonPrediction[]> {
    return Array.from(this.seasonPredictions.values());
  }

  async getSeasonPredictionsByStatus(status: string): Promise<SeasonPrediction[]> {
    return Array.from(this.seasonPredictions.values()).filter(p => p.status === status);
  }

  async createSeasonPrediction(insertPrediction: InsertSeasonPrediction): Promise<SeasonPrediction> {
    const id = randomUUID();
    const prediction: SeasonPrediction = {
      description: null,
      totalPool: null,
      serviceFee: null,
      prizePool: null,
      addedMoneyContribution: null,
      minimumMatches: null,
      predictionsOpen: null,
      predictionDeadline: null,
      seasonEndDate: null,
      status: null,
      firstPlaceWins: null,
      secondPlaceWins: null,
      thirdPlaceWins: null,
      entryFee: 5000, // Default value from schema
      ...insertPrediction,
      id,
      createdAt: new Date(),
    };
    this.seasonPredictions.set(id, prediction);
    return prediction;
  }

  async updateSeasonPrediction(id: string, updates: Partial<SeasonPrediction>): Promise<SeasonPrediction | undefined> {
    const prediction = this.seasonPredictions.get(id);
    if (!prediction) return undefined;

    const updatedPrediction = { ...prediction, ...updates };
    this.seasonPredictions.set(id, updatedPrediction);
    return updatedPrediction;
  }

  // Prediction Entry methods
  async getPredictionEntry(id: string): Promise<PredictionEntry | undefined> {
    return this.predictionEntries.get(id);
  }

  async getPredictionEntries(): Promise<PredictionEntry[]> {
    return Array.from(this.predictionEntries.values());
  }

  async getPredictionEntriesByPrediction(predictionId: string): Promise<PredictionEntry[]> {
    return Array.from(this.predictionEntries.values()).filter(e => e.predictionId === predictionId);
  }

  async getPredictionEntriesByPredictor(predictorId: string): Promise<PredictionEntry[]> {
    return Array.from(this.predictionEntries.values()).filter(e => e.predictorId === predictorId);
  }

  async createPredictionEntry(insertEntry: InsertPredictionEntry): Promise<PredictionEntry> {
    const id = randomUUID();
    const entry: PredictionEntry = {
      predictionScore: null,
      payout: null,
      stripePaymentIntentId: null,
      ...insertEntry,
      id,
      createdAt: new Date(),
    };
    this.predictionEntries.set(id, entry);
    return entry;
  }

  async updatePredictionEntry(id: string, updates: Partial<PredictionEntry>): Promise<PredictionEntry | undefined> {
    const entry = this.predictionEntries.get(id);
    if (!entry) return undefined;

    const updatedEntry = { ...entry, ...updates };
    this.predictionEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  // Added Money Fund methods
  async getAddedMoneyFund(id: string): Promise<AddedMoneyFund | undefined> {
    return this.addedMoneyFunds.get(id);
  }

  async getAddedMoneyFunds(): Promise<AddedMoneyFund[]> {
    return Array.from(this.addedMoneyFunds.values());
  }

  async getAddedMoneyFundsBySource(sourceType: string): Promise<AddedMoneyFund[]> {
    return Array.from(this.addedMoneyFunds.values()).filter(f => f.sourceType === sourceType);
  }

  async getAddedMoneyFundsByTournament(tournamentId: string): Promise<AddedMoneyFund[]> {
    return Array.from(this.addedMoneyFunds.values()).filter(f => f.tournamentId === tournamentId);
  }

  async createAddedMoneyFund(insertFund: InsertAddedMoneyFund): Promise<AddedMoneyFund> {
    const id = randomUUID();
    const fund: AddedMoneyFund = {
      allocationDate: null,
      tournamentId: null,
      remainingBalance: null,
      ...insertFund,
      id,
      createdAt: new Date(),
    };
    this.addedMoneyFunds.set(id, fund);
    return fund;
  }

  async updateAddedMoneyFund(id: string, updates: Partial<AddedMoneyFund>): Promise<AddedMoneyFund | undefined> {
    const fund = this.addedMoneyFunds.get(id);
    if (!fund) return undefined;

    const updatedFund = { ...fund, ...updates };
    this.addedMoneyFunds.set(id, updatedFund);
    return updatedFund;
  }

  // Kelly Pool methods
  async getKellyPool(id: string): Promise<KellyPool | undefined> {
    return this.kellyPools.get(id);
  }

  async getKellyPools(): Promise<KellyPool[]> {
    return Array.from(this.kellyPools.values());
  }

  async getAllKellyPools(): Promise<KellyPool[]> {
    return this.getKellyPools();
  }

  async createKellyPool(insertKellyPool: InsertKellyPool): Promise<KellyPool> {
    const id = randomUUID();
    const kellyPool: KellyPool = {
      status: null,
      table: null,
      currentPlayers: null,
      balls: null,
      ...insertKellyPool,
      id,
      createdAt: new Date(),
    };
    this.kellyPools.set(id, kellyPool);
    return kellyPool;
  }

  async updateKellyPool(id: string, updates: Partial<KellyPool>): Promise<KellyPool | undefined> {
    const kellyPool = this.kellyPools.get(id);
    if (!kellyPool) return undefined;

    const updatedKellyPool = { ...kellyPool, ...updates };
    this.kellyPools.set(id, updatedKellyPool);
    return updatedKellyPool;
  }

  // Money Game methods
  async getMoneyGame(id: string): Promise<MoneyGame | undefined> {
    return this.moneyGames.get(id);
  }

  async getMoneyGames(): Promise<MoneyGame[]> {
    return Array.from(this.moneyGames.values());
  }

  async getMoneyGamesByStatus(status: string): Promise<MoneyGame[]> {
    return Array.from(this.moneyGames.values()).filter(game => game.status === status);
  }

  async createMoneyGame(insertMoneyGame: InsertMoneyGame): Promise<MoneyGame> {
    const id = randomUUID();
    const moneyGame: MoneyGame = {
      winner: null,
      ...insertMoneyGame,
      id,
      createdAt: new Date(),
    };
    this.moneyGames.set(id, moneyGame);
    return moneyGame;
  }

  async updateMoneyGame(id: string, updates: Partial<MoneyGame>): Promise<MoneyGame | undefined> {
    const moneyGame = this.moneyGames.get(id);
    if (!moneyGame) return undefined;

    const updatedMoneyGame = { ...moneyGame, ...updates };
    this.moneyGames.set(id, updatedMoneyGame);
    return updatedMoneyGame;
  }

  async deleteMoneyGame(id: string): Promise<boolean> {
    return this.moneyGames.delete(id);
  }

  // Bounty methods
  async getBounty(id: string): Promise<Bounty | undefined> {
    return this.bounties.get(id);
  }

  async getBounties(): Promise<Bounty[]> {
    return Array.from(this.bounties.values());
  }

  async getAllBounties(): Promise<Bounty[]> {
    return this.getBounties();
  }

  async createBounty(insertBounty: InsertBounty): Promise<Bounty> {
    const id = randomUUID();
    const bounty: Bounty = {
      rank: null,
      targetId: null,
      active: null,
      description: null,
      ...insertBounty,
      id,
      createdAt: new Date(),
    };
    this.bounties.set(id, bounty);
    return bounty;
  }

  async updateBounty(id: string, updates: Partial<Bounty>): Promise<Bounty | undefined> {
    const bounty = this.bounties.get(id);
    if (!bounty) return undefined;

    const updatedBounty = { ...bounty, ...updates };
    this.bounties.set(id, updatedBounty);
    return updatedBounty;
  }

  // Charity Event methods
  async getCharityEvent(id: string): Promise<CharityEvent | undefined> {
    return this.charityEvents.get(id);
  }

  async getCharityEvents(): Promise<CharityEvent[]> {
    return Array.from(this.charityEvents.values());
  }

  async getAllCharityEvents(): Promise<CharityEvent[]> {
    return this.getCharityEvents();
  }

  async createCharityEvent(insertCharityEvent: InsertCharityEvent): Promise<CharityEvent> {
    const id = randomUUID();
    const charityEvent: CharityEvent = {
      active: null,
      description: null,
      raised: null,
      percentage: null,
      ...insertCharityEvent,
      id,
      createdAt: new Date(),
    };
    this.charityEvents.set(id, charityEvent);
    return charityEvent;
  }

  async updateCharityEvent(id: string, updates: Partial<CharityEvent>): Promise<CharityEvent | undefined> {
    const charityEvent = this.charityEvents.get(id);
    if (!charityEvent) return undefined;

    const updatedCharityEvent = { ...charityEvent, ...updates };
    this.charityEvents.set(id, updatedCharityEvent);
    return updatedCharityEvent;
  }

  // Support Request methods
  async getSupportRequest(id: string): Promise<SupportRequest | undefined> {
    return this.supportRequests.get(id);
  }

  async getSupportRequests(): Promise<SupportRequest[]> {
    return Array.from(this.supportRequests.values());
  }

  async getAllSupportRequests(): Promise<SupportRequest[]> {
    return this.getSupportRequests();
  }

  async createSupportRequest(insertSupportRequest: InsertSupportRequest): Promise<SupportRequest> {
    const id = randomUUID();
    const supportRequest: SupportRequest = {
      status: null,
      description: null,
      amount: null,
      ...insertSupportRequest,
      id,
      createdAt: new Date(),
    };
    this.supportRequests.set(id, supportRequest);
    return supportRequest;
  }

  async updateSupportRequest(id: string, updates: Partial<SupportRequest>): Promise<SupportRequest | undefined> {
    const supportRequest = this.supportRequests.get(id);
    if (!supportRequest) return undefined;

    const updatedSupportRequest = { ...supportRequest, ...updates };
    this.supportRequests.set(id, updatedSupportRequest);
    return updatedSupportRequest;
  }

  // Live Stream methods
  async getLiveStream(id: string): Promise<LiveStream | undefined> {
    return this.liveStreams.get(id);
  }

  async getLiveStreams(): Promise<LiveStream[]> {
    return Array.from(this.liveStreams.values());
  }

  async getAllLiveStreams(): Promise<LiveStream[]> {
    return this.getLiveStreams();
  }

  async createLiveStream(insertLiveStream: InsertLiveStream): Promise<LiveStream> {
    const id = randomUUID();
    const liveStream: LiveStream = {
      title: null,
      isLive: null,
      viewerCount: null,
      matchId: null,
      hallMatchId: null,
      maxViewers: 0,
      embedUrl: null,
      lastLiveAt: null,
      ...insertLiveStream,
      category: insertLiveStream.category || null,
      quality: insertLiveStream.quality || null,
      tags: insertLiveStream.tags || [],
      tournamentId: insertLiveStream.tournamentId || null,
      streamerId: insertLiveStream.streamerId || null,
      thumbnailUrl: insertLiveStream.thumbnailUrl || null,
      language: insertLiveStream.language || "en",
      id,
      createdAt: new Date(),
    };
    this.liveStreams.set(id, liveStream);
    return liveStream;
  }

  async updateLiveStream(id: string, updates: Partial<LiveStream>): Promise<LiveStream | undefined> {
    const liveStream = this.liveStreams.get(id);
    if (!liveStream) return undefined;

    const updatedLiveStream = { ...liveStream, ...updates };
    this.liveStreams.set(id, updatedLiveStream);
    return updatedLiveStream;
  }

  async deleteLiveStream(id: string): Promise<boolean> {
    return this.liveStreams.delete(id);
  }

  async getLiveStreamsByLocation(city?: string, state?: string): Promise<LiveStream[]> {
    const allStreams = Array.from(this.liveStreams.values());
    return allStreams.filter(stream => {
      const matchesCity = !city || stream.city?.toLowerCase().includes(city.toLowerCase());
      const matchesState = !state || stream.state?.toLowerCase() === state.toLowerCase();
      return matchesCity && matchesState;
    });
  }

  async getLiveStreamStats(): Promise<any> {
    const allStreams = Array.from(this.liveStreams.values());
    const liveStreams = allStreams.filter(s => s.isLive);
    const totalViewers = liveStreams.reduce((sum, stream) => sum + (stream.viewerCount || 0), 0);
    const peakViewers = allStreams.reduce((max, stream) => Math.max(max, stream.maxViewers || 0), 0);

    const platformStats = allStreams.reduce((acc, stream) => {
      acc[stream.platform] = (acc[stream.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const locationStats = allStreams.reduce((acc, stream) => {
      if (stream.state) {
        acc[stream.state] = (acc[stream.state] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalStreams: allStreams.length,
      liveStreams: liveStreams.length,
      totalViewers,
      peakViewers,
      platformStats,
      locationStats
    };
  }

  // Webhook Event methods
  async getWebhookEvent(stripeEventId: string): Promise<WebhookEvent | undefined> {
    return Array.from(this.webhookEvents.values()).find(event => event.stripeEventId === stripeEventId);
  }

  async createWebhookEvent(insertWebhookEvent: InsertWebhookEvent): Promise<WebhookEvent> {
    const id = randomUUID();
    const webhookEvent: WebhookEvent = {
      ...insertWebhookEvent,
      id,
      processedAt: new Date(),
    };
    this.webhookEvents.set(id, webhookEvent);
    return webhookEvent;
  }

  // Pool Hall methods
  async getPoolHall(id: string): Promise<PoolHall | undefined> {
    return this.poolHalls.get(id);
  }

  async getPoolHalls(): Promise<PoolHall[]> {
    return Array.from(this.poolHalls.values());
  }

  async getAllPoolHalls(): Promise<PoolHall[]> {
    return this.getPoolHalls();
  }

  async createPoolHall(insertPoolHall: InsertPoolHall): Promise<PoolHall> {
    const id = randomUUID();
    const poolHall: PoolHall = {
      points: 0,
      active: true,
      description: null,
      wins: 0,
      losses: 0,
      address: null,
      phone: null,
      battlesUnlocked: false,
      unlockedBy: null,
      unlockedAt: null,
      ...insertPoolHall,
      id,
      createdAt: new Date(),
    };
    this.poolHalls.set(id, poolHall);
    return poolHall;
  }

  async updatePoolHall(id: string, updates: Partial<PoolHall>): Promise<PoolHall | undefined> {
    const poolHall = this.poolHalls.get(id);
    if (!poolHall) return undefined;

    const updated = { ...poolHall, ...updates };
    this.poolHalls.set(id, updated);
    return updated;
  }

  async unlockHallBattles(hallId: string, unlockedBy: string): Promise<PoolHall | undefined> {
    const hall = this.poolHalls.get(hallId);
    if (!hall) return undefined;

    const updated = {
      ...hall,
      battlesUnlocked: true,
      unlockedBy,
      unlockedAt: new Date(),
    };
    this.poolHalls.set(hallId, updated);
    return updated;
  }

  async lockHallBattles(hallId: string): Promise<PoolHall | undefined> {
    const hall = this.poolHalls.get(hallId);
    if (!hall) return undefined;

    const updated = {
      ...hall,
      battlesUnlocked: false,
      unlockedBy: null,
      unlockedAt: null,
    };
    this.poolHalls.set(hallId, updated);
    return updated;
  }

  // Hall Match methods
  async getHallMatch(id: string): Promise<HallMatch | undefined> {
    return this.hallMatches.get(id);
  }

  async getAllHallMatches(): Promise<HallMatch[]> {
    return Array.from(this.hallMatches.values());
  }

  async getHallMatchesByHall(hallId: string): Promise<HallMatch[]> {
    return Array.from(this.hallMatches.values()).filter(
      match => match.homeHallId === hallId || match.awayHallId === hallId
    );
  }

  async createHallMatch(insertHallMatch: InsertHallMatch): Promise<HallMatch> {
    const id = randomUUID();
    const hallMatch: HallMatch = {
      status: "scheduled",
      stake: null,
      notes: null,
      totalRacks: 7,
      homeScore: null,
      awayScore: null,
      winnerHallId: null,
      scheduledDate: null,
      completedAt: null,
      ...insertHallMatch,
      id,
      createdAt: new Date(),
    };
    this.hallMatches.set(id, hallMatch);
    return hallMatch;
  }

  async updateHallMatch(id: string, updates: Partial<HallMatch>): Promise<HallMatch | undefined> {
    const hallMatch = this.hallMatches.get(id);
    if (!hallMatch) return undefined;

    const updated = { ...hallMatch, ...updates };

    // If completing a match, update hall standings
    if (updates.status === "completed" && updates.winnerHallId && !hallMatch.winnerHallId) {
      const homeHall = await this.getPoolHall(hallMatch.homeHallId);
      const awayHall = await this.getPoolHall(hallMatch.awayHallId);

      if (homeHall && awayHall) {
        if (updates.winnerHallId === hallMatch.homeHallId) {
          await this.updatePoolHall(homeHall.id, { wins: homeHall.wins + 1, points: homeHall.points + 100 });
          await this.updatePoolHall(awayHall.id, { losses: awayHall.losses + 1, points: Math.max(0, awayHall.points - 50) });
        } else {
          await this.updatePoolHall(awayHall.id, { wins: awayHall.wins + 1, points: awayHall.points + 100 });
          await this.updatePoolHall(homeHall.id, { losses: homeHall.losses + 1, points: Math.max(0, homeHall.points - 50) });
        }
      }
    }

    this.hallMatches.set(id, updated);
    return updated;
  }

  // Hall Roster methods
  async getHallRoster(id: string): Promise<HallRoster | undefined> {
    return this.hallRosters.get(id);
  }

  async getAllHallRosters(): Promise<HallRoster[]> {
    return Array.from(this.hallRosters.values());
  }

  async getRosterByHall(hallId: string): Promise<HallRoster[]> {
    return Array.from(this.hallRosters.values()).filter(
      roster => roster.hallId === hallId && roster.isActive
    );
  }

  async getRosterByPlayer(playerId: string): Promise<HallRoster[]> {
    return Array.from(this.hallRosters.values()).filter(
      roster => roster.playerId === playerId && roster.isActive
    );
  }

  async createHallRoster(insertHallRoster: InsertHallRoster): Promise<HallRoster> {
    const id = randomUUID();
    const hallRoster: HallRoster = {
      position: null,
      isActive: true,
      ...insertHallRoster,
      id,
      joinedAt: new Date(),
    };
    this.hallRosters.set(id, hallRoster);
    return hallRoster;
  }

  async updateHallRoster(id: string, updates: Partial<HallRoster>): Promise<HallRoster | undefined> {
    const hallRoster = this.hallRosters.get(id);
    if (!hallRoster) return undefined;

    const updated = { ...hallRoster, ...updates };
    this.hallRosters.set(id, updated);
    return updated;
  }

  // Rookie System Implementation
  async getRookieMatch(id: string): Promise<RookieMatch | undefined> {
    return this.rookieMatches.get(id);
  }

  async getAllRookieMatches(): Promise<RookieMatch[]> {
    return Array.from(this.rookieMatches.values()).sort((a, b) =>
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getRookieMatchesByPlayer(playerId: string): Promise<RookieMatch[]> {
    return Array.from(this.rookieMatches.values())
      .filter(match => match.challenger === playerId || match.opponent === playerId)
      .sort((a, b) =>
        (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
      );
  }

  async createRookieMatch(match: InsertRookieMatch): Promise<RookieMatch> {
    const newMatch = {
      status: "scheduled",
      notes: null,
      winner: null,
      commission: 200, // $2 default
      fee: 800, // $8 default
      pointsAwarded: null,
      ...match,
      id: randomUUID(),
      reportedAt: null,
      createdAt: new Date(),
    };
    this.rookieMatches.set(newMatch.id, newMatch);
    return newMatch;
  }

  async updateRookieMatch(id: string, updates: Partial<RookieMatch>): Promise<RookieMatch | undefined> {
    const match = this.rookieMatches.get(id);
    if (!match) return undefined;
    const updatedMatch = { ...match, ...updates };
    this.rookieMatches.set(id, updatedMatch);
    return updatedMatch;
  }

  async getRookieEvent(id: string): Promise<RookieEvent | undefined> {
    return this.rookieEvents.get(id);
  }

  async getAllRookieEvents(): Promise<RookieEvent[]> {
    return Array.from(this.rookieEvents.values()).sort((a, b) =>
      (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async createRookieEvent(event: InsertRookieEvent): Promise<RookieEvent> {
    const newEvent = {
      id: randomUUID(),
      status: event.status || "open",
      prizePool: event.prizePool || 0,
      maxPlayers: event.maxPlayers || 8,
      currentPlayers: event.currentPlayers || 0,
      buyIn: event.buyIn || 500,
      prizeType: event.prizeType || "credit",
      description: event.description || null,
      ...event,
      createdAt: new Date(),
    };
    this.rookieEvents.set(newEvent.id, newEvent);
    return newEvent;
  }

  async updateRookieEvent(id: string, updates: Partial<RookieEvent>): Promise<RookieEvent | undefined> {
    const event = this.rookieEvents.get(id);
    if (!event) return undefined;
    const updatedEvent = { ...event, ...updates };
    this.rookieEvents.set(id, updatedEvent);
    return updatedEvent;
  }

  async getRookieAchievement(id: string): Promise<RookieAchievement | undefined> {
    return this.rookieAchievements.get(id);
  }

  async getRookieAchievementsByPlayer(playerId: string): Promise<RookieAchievement[]> {
    return Array.from(this.rookieAchievements.values())
      .filter(achievement => achievement.playerId === playerId)
      .sort((a, b) =>
        (b.earnedAt?.getTime() || 0) - (a.earnedAt?.getTime() || 0)
      );
  }

  async createRookieAchievement(achievement: InsertRookieAchievement): Promise<RookieAchievement> {
    const newAchievement = {
      id: randomUUID(),
      description: achievement.description || null,
      badge: achievement.badge || null,
      ...achievement,
      earnedAt: new Date(),
    };
    this.rookieAchievements.set(newAchievement.id, newAchievement);
    return newAchievement;
  }

  async getRookieSubscription(playerId: string): Promise<RookieSubscription | undefined> {
    return Array.from(this.rookieSubscriptions.values()).find(sub => sub.playerId === playerId);
  }

  async getAllRookieSubscriptions(): Promise<RookieSubscription[]> {
    return Array.from(this.rookieSubscriptions.values()).sort((a, b) =>
      (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0)
    );
  }

  async createRookieSubscription(subscription: InsertRookieSubscription): Promise<RookieSubscription> {
    const newSubscription = {
      status: "active",
      stripeSubscriptionId: null,
      monthlyFee: 500,
      expiresAt: null,
      cancelledAt: null,
      ...subscription,
      id: randomUUID(),
      startedAt: new Date(),
    };
    this.rookieSubscriptions.set(newSubscription.id, newSubscription);
    return newSubscription;
  }

  async updateRookieSubscription(playerId: string, updates: Partial<RookieSubscription>): Promise<RookieSubscription | undefined> {
    const subscription = await this.getRookieSubscription(playerId);
    if (!subscription) return undefined;
    const updatedSubscription = { ...subscription, ...updates };
    this.rookieSubscriptions.set(subscription.id, updatedSubscription);
    return updatedSubscription;
  }

  async getRookieLeaderboard(): Promise<Player[]> {
    return Array.from(this.players.values())
      .filter(player => player.isRookie)
      .sort((a, b) => {
        // Sort by rookie points descending, then by wins
        const aPoints = a.rookiePoints || 0;
        const bPoints = b.rookiePoints || 0;
        const aWins = a.rookieWins || 0;
        const bWins = b.rookieWins || 0;

        if (bPoints !== aPoints) {
          return bPoints - aPoints;
        }
        return bWins - aWins;
      });
  }

  async promoteRookieToMainLadder(playerId: string): Promise<Player | undefined> {
    const player = this.players.get(playerId);
    if (!player || !player.isRookie) return undefined;

    const updatedPlayer = {
      ...player,
      isRookie: false,
      graduatedAt: new Date(),
    };
    this.players.set(playerId, updatedPlayer);

    // Award graduation achievement
    await this.createRookieAchievement({
      playerId,
      type: "graduated",
      title: "Graduated to Main Ladder",
      description: "Reached 100 rookie points and joined the main ladder",
      badge: "🎓",
    });

    return updatedPlayer;
  }

  // Side Betting - Wallet Operations
  async getWallet(userId: string): Promise<Wallet | undefined> {
    return this.wallets.get(userId);
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const newWallet: Wallet = {
      userId: wallet.userId,
      balanceCredits: wallet.balanceCredits || 0,
      balanceLockedCredits: wallet.balanceLockedCredits || 0,
      createdAt: new Date(),
    };
    this.wallets.set(wallet.userId, newWallet);
    return newWallet;
  }

  async updateWallet(userId: string, updates: Partial<Wallet>): Promise<Wallet | undefined> {
    return updateMapRecord(this.wallets, userId, updates, NULLABLE_FIELDS.Wallet);
  }

  async creditWallet(userId: string, amount: number): Promise<Wallet | undefined> {
    const wallet = this.wallets.get(userId);
    if (!wallet) return undefined;

    const currentBalance = wallet.balanceCredits ?? 0;
    const updatedWallet = {
      ...wallet,
      balanceCredits: currentBalance + amount,
    };
    this.wallets.set(userId, updatedWallet);
    return updatedWallet;
  }

  async lockCredits(userId: string, amount: number): Promise<boolean> {
    const wallet = this.wallets.get(userId);
    const currentBalance = wallet?.balanceCredits ?? 0;
    const currentLocked = wallet?.balanceLockedCredits ?? 0;

    if (!wallet || currentBalance < amount) return false;

    const updatedWallet = {
      ...wallet,
      balanceCredits: currentBalance - amount,
      balanceLockedCredits: currentLocked + amount,
    };
    this.wallets.set(userId, updatedWallet);
    return true;
  }

  async unlockCredits(userId: string, amount: number): Promise<boolean> {
    const wallet = this.wallets.get(userId);
    const currentBalance = wallet?.balanceCredits ?? 0;
    const currentLocked = wallet?.balanceLockedCredits ?? 0;

    if (!wallet || currentLocked < amount) return false;

    const updatedWallet = {
      ...wallet,
      balanceCredits: currentBalance + amount,
      balanceLockedCredits: currentLocked - amount,
    };
    this.wallets.set(userId, updatedWallet);
    return true;
  }

  // Side Betting - Side Pots
  async getSidePot(id: string): Promise<SidePot | undefined> {
    return this.sidePots.get(id);
  }

  async getSidePots(): Promise<SidePot[]> {
    return Array.from(this.sidePots.values());
  }

  async getAllSidePots(): Promise<SidePot[]> {
    return this.getSidePots();
  }

  async getSidePotsByMatch(matchId: string): Promise<SidePot[]> {
    return Array.from(this.sidePots.values()).filter(pot => pot.matchId === matchId);
  }

  async getSidePotsByStatus(status: string): Promise<SidePot[]> {
    return Array.from(this.sidePots.values()).filter(pot => pot.status === status);
  }

  async createSidePot(insertPot: InsertSidePot): Promise<SidePot> {
    const id = randomUUID();
    const pot: SidePot = {
      id,
      matchId: nullifyUndefined(insertPot.matchId),
      creatorId: nullifyUndefined(insertPot.creatorId),
      sideALabel: nullifyUndefined(insertPot.sideALabel),
      sideBLabel: nullifyUndefined(insertPot.sideBLabel),
      stakePerSide: insertPot.stakePerSide,
      feeBps: insertPot.feeBps || 800,
      status: insertPot.status || "open",
      lockCutoffAt: nullifyUndefined(insertPot.lockCutoffAt),
      description: nullifyUndefined(insertPot.description),
      challengeType: insertPot.challengeType || "yes_no",
      evidenceJson: nullifyUndefined(insertPot.evidenceJson),
      verificationSource: nullifyUndefined(insertPot.verificationSource),
      customCreatedBy: nullifyUndefined(insertPot.customCreatedBy),
      winningSide: nullifyUndefined(insertPot.winningSide),
      resolvedAt: nullifyUndefined(insertPot.resolvedAt),
      disputeDeadline: nullifyUndefined(insertPot.disputeDeadline),
      disputeStatus: insertPot.disputeStatus || "none",
      autoResolvedAt: nullifyUndefined(insertPot.autoResolvedAt),
      createdAt: new Date(),
    };
    this.sidePots.set(id, pot);
    return pot;
  }

  async updateSidePot(id: string, updates: Partial<SidePot>): Promise<SidePot | undefined> {
    const pot = this.sidePots.get(id);
    if (!pot) return undefined;

    const updatedPot = { ...pot, ...updates };
    this.sidePots.set(id, updatedPot);
    return updatedPot;
  }

  async getExpiredDisputePots(now: Date): Promise<SidePot[]> {
    return Array.from(this.sidePots.values()).filter(pot =>
      pot.status === "resolved" &&
      pot.disputeDeadline &&
      now > pot.disputeDeadline &&
      pot.disputeStatus === "none" &&
      !pot.autoResolvedAt
    );
  }

  async processDelayedPayouts(potId: string, winningSide: string): Promise<any> {
    const pot = await this.getSidePot(potId);
    if (!pot) throw new Error("Side pot not found");

    // Get all bets for this pot
    const bets = await this.getSideBetsByPot(potId);
    const winners = bets.filter(bet => bet.side === winningSide);
    const losers = bets.filter(bet => bet.side !== winningSide);

    // Calculate total pot and service fee
    const totalPot = bets.reduce((sum, bet) => sum + (bet.amount || 0), 0);
    const serviceFee = Math.floor(totalPot * (pot.feeBps || 850) / 10000);
    const netPot = totalPot - serviceFee;

    // Calculate winnings for each winner
    const totalWinnerStake = winners.reduce((sum, bet) => sum + (bet.amount || 0), 0);
    const payouts = [];

    for (const winner of winners) {
      const winnerShare = totalWinnerStake > 0 ? (winner.amount || 0) / totalWinnerStake : 0;
      const winnings = Math.floor(winnerShare * netPot);

      // Credit winner's wallet
      await this.creditWallet(winner.userId!, winnings);

      // Update bet status
      await this.updateSideBet(winner.id, { status: "paid" });

      // Create ledger entry
      await this.createLedgerEntry({
        userId: winner.userId!,
        type: "pot_release_win",
        amount: winnings,
        refId: winner.id,
        metaJson: JSON.stringify({ sidePotId: potId, winnings, originalStake: winner.amount }),
      });

      payouts.push({
        userId: winner.userId,
        amount: winnings,
        originalStake: winner.amount
      });
    }

    // Mark losers as lost (no payout)
    for (const loser of losers) {
      await this.updateSideBet(loser.id, { status: "lost" });
    }

    return {
      totalPot,
      serviceFee,
      netPot,
      winnersCount: winners.length,
      losersCount: losers.length,
      payouts
    };
  }

  // Side Betting - Side Bets
  async getSideBet(id: string): Promise<SideBet | undefined> {
    return this.sideBets.get(id);
  }

  async getSideBetsByPot(challengePoolId: string): Promise<SideBet[]> {
    return Array.from(this.sideBets.values()).filter(bet => bet.challengePoolId === challengePoolId);
  }

  async getSideBetsByUser(userId: string): Promise<SideBet[]> {
    return Array.from(this.sideBets.values()).filter(bet => bet.userId === userId);
  }

  async createSideBet(insertBet: InsertSideBet): Promise<SideBet> {
    const id = randomUUID();
    const bet: SideBet = {
      id,
      challengePoolId: nullifyUndefined(insertBet.challengePoolId),
      userId: nullifyUndefined(insertBet.userId),
      side: nullifyUndefined(insertBet.side),
      amount: insertBet.amount,
      status: insertBet.status ?? "pending",
      fundedAt: nullifyUndefined(insertBet.fundedAt),
      createdAt: new Date(),
    };
    this.sideBets.set(id, bet);
    return bet;
  }

  async updateSideBet(id: string, updates: Partial<SideBet>): Promise<SideBet | undefined> {
    const bet = this.sideBets.get(id);
    if (!bet) return undefined;

    const updatedBet = assignNoUndefined(bet, {
      ...updates,
      challengePoolId: updates.challengePoolId !== undefined ? nullifyUndefined(updates.challengePoolId) : bet.challengePoolId,
      userId: updates.userId !== undefined ? nullifyUndefined(updates.userId) : bet.userId,
      side: updates.side !== undefined ? nullifyUndefined(updates.side) : bet.side,
      fundedAt: updates.fundedAt !== undefined ? nullifyUndefined(updates.fundedAt) : bet.fundedAt,
    });
    this.sideBets.set(id, updatedBet);
    return updatedBet;
  }

  // Side Betting - Ledger
  async getLedgerEntry(id: string): Promise<LedgerEntry | undefined> {
    return this.ledgerEntries.get(id);
  }

  async getLedgerByUser(userId: string): Promise<LedgerEntry[]> {
    return Array.from(this.ledgerEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createLedgerEntry(insertEntry: InsertLedgerEntry): Promise<LedgerEntry> {
    const id = randomUUID();
    const entry: LedgerEntry = {
      id,
      userId: nullifyUndefined(insertEntry.userId),
      type: nullifyUndefined(insertEntry.type),
      amount: nullifyUndefined(insertEntry.amount),
      refId: nullifyUndefined(insertEntry.refId),
      metaJson: nullifyUndefined(insertEntry.metaJson),
      createdAt: new Date(),
    };
    this.ledgerEntries.set(id, entry);
    return entry;
  }

  // Side Betting - Resolutions
  async getResolution(id: string): Promise<Resolution | undefined> {
    return this.resolutions.get(id);
  }

  async getResolutionByPot(challengePoolId: string): Promise<Resolution | undefined> {
    return Array.from(this.resolutions.values()).find(res => res.challengePoolId === challengePoolId);
  }

  async createResolution(insertResolution: InsertResolution): Promise<Resolution> {
    const id = randomUUID();
    const resolution: Resolution = {
      id,
      challengePoolId: nullifyUndefined(insertResolution.challengePoolId),
      winnerSide: nullifyUndefined(insertResolution.winnerSide),
      decidedBy: nullifyUndefined(insertResolution.decidedBy),
      decidedAt: new Date(), // decidedAt has defaultNow() in schema but we need it for the type
      notes: nullifyUndefined(insertResolution.notes),
    };
    this.resolutions.set(id, resolution);
    return resolution;
  }

  // Challenge Pool aliases (for backwards compatibility)
  async getChallengePool(id: string): Promise<ChallengePool | undefined> {
    return this.getSidePot(id);
  }

  async getAllChallengePools(): Promise<ChallengePool[]> {
    return this.getAllSidePots();
  }

  async createChallengePool(pool: InsertChallengePool): Promise<ChallengePool> {
    return this.createSidePot(pool);
  }

  async updateChallengePool(id: string, updates: Partial<ChallengePool>): Promise<ChallengePool | undefined> {
    return this.updateSidePot(id, updates);
  }

  // Challenge Entry aliases (for backwards compatibility)
  async getChallengeEntry(id: string): Promise<ChallengeEntry | undefined> {
    return this.getSideBet(id);
  }

  async getChallengeEntriesByPool(poolId: string): Promise<ChallengeEntry[]> {
    return this.getSideBetsByPot(poolId);
  }

  async createChallengeEntry(entry: InsertChallengeEntry): Promise<ChallengeEntry> {
    return this.createSideBet(entry);
  }

  async updateChallengeEntry(id: string, updates: Partial<ChallengeEntry>): Promise<ChallengeEntry | undefined> {
    return this.updateSideBet(id, updates);
  }

  // Wallet aliases (for backwards compatibility)
  async addCredits(userId: string, amount: number): Promise<Wallet | undefined> {
    return this.creditWallet(userId, amount);
  }

  // Operator Subscription Methods
  async getOperatorSubscription(operatorId: string): Promise<OperatorSubscription | undefined> {
    return this.operatorSubscriptions.get(operatorId);
  }

  async getAllOperatorSubscriptions(): Promise<OperatorSubscription[]> {
    return Array.from(this.operatorSubscriptions.values());
  }

  async createOperatorSubscription(insertSubscription: InsertOperatorSubscription): Promise<OperatorSubscription> {
    const id = randomUUID();

    // Calculate pricing based on tier and player count
    const { basePriceMonthly, tier } = this.calculateSubscriptionPricing(
      insertSubscription.playerCount || 0,
      insertSubscription.extraLadders || 0,
      insertSubscription.rookieModuleActive || false,
      insertSubscription.rookiePassesActive || 0
    );

    const subscription: OperatorSubscription = {
      id,
      operatorId: insertSubscription.operatorId,
      hallName: insertSubscription.hallName,
      playerCount: insertSubscription.playerCount || 0,
      tier,
      basePriceMonthly,
      extraPlayersCharge: insertSubscription.extraPlayersCharge || 0,
      extraLadders: insertSubscription.extraLadders || 0,
      extraLadderCharge: (insertSubscription.extraLadders || 0) * 10000, // $100 per extra ladder
      rookieModuleActive: insertSubscription.rookieModuleActive || false,
      rookieModuleCharge: insertSubscription.rookieModuleActive ? 5000 : 0, // $50/mo
      rookiePassesActive: insertSubscription.rookiePassesActive || 0,
      rookiePassCharge: (insertSubscription.rookiePassesActive || 0) * 1500, // $15 per pass
      stripeSubscriptionId: nullifyUndefined(insertSubscription.stripeSubscriptionId),
      stripeCustomerId: nullifyUndefined(insertSubscription.stripeCustomerId),
      status: insertSubscription.status || "active",
      billingCycleStart: new Date(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      totalMonthlyCharge: this.calculateTotalMonthlyCharge(basePriceMonthly, insertSubscription),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.operatorSubscriptions.set(insertSubscription.operatorId, subscription);
    return subscription;
  }

  async updateOperatorSubscription(operatorId: string, updates: Partial<OperatorSubscription>): Promise<OperatorSubscription | undefined> {
    const subscription = this.operatorSubscriptions.get(operatorId);
    if (!subscription) return undefined;

    const updatedSubscription = { ...subscription, ...updates, updatedAt: new Date() };
    this.operatorSubscriptions.set(operatorId, updatedSubscription);
    return updatedSubscription;
  }

  // Operator Subscription Split Methods
  async createOperatorSubscriptionSplit(split: InsertOperatorSubscriptionSplit): Promise<OperatorSubscriptionSplit> {
    const id = randomUUID();
    const subscriptionSplit: OperatorSubscriptionSplit = {
      id,
      subscriptionId: split.subscriptionId,
      operatorId: split.operatorId,
      trusteeId: nullifyUndefined(split.trusteeId),
      potAmount: split.potAmount,
      trusteeAmount: split.trusteeAmount,
      founderAmount: split.founderAmount,
      payrollAmount: split.payrollAmount,
      totalAmount: split.totalAmount,
      stripePaymentIntentId: nullifyUndefined(split.stripePaymentIntentId),
      billingPeriodStart: nullifyUndefined(split.billingPeriodStart),
      billingPeriodEnd: nullifyUndefined(split.billingPeriodEnd),
      createdAt: new Date(),
    };

    this.operatorSubscriptionSplits.set(id, subscriptionSplit);
    return subscriptionSplit;
  }

  async getOperatorSubscriptionSplits(operatorId: string): Promise<OperatorSubscriptionSplit[]> {
    return Array.from(this.operatorSubscriptionSplits.values())
      .filter(split => split.operatorId === operatorId);
  }

  async getOperatorSubscriptionSplitsBySubscription(subscriptionId: string): Promise<OperatorSubscriptionSplit[]> {
    return Array.from(this.operatorSubscriptionSplits.values())
      .filter(split => split.subscriptionId === subscriptionId);
  }

  async getTrusteeEarnings(trusteeId: string): Promise<{ totalEarnings: number; splitCount: number; splits: OperatorSubscriptionSplit[] }> {
    const splits = Array.from(this.operatorSubscriptionSplits.values())
      .filter(split => split.trusteeId === trusteeId);

    const totalEarnings = splits.reduce((sum, split) => sum + split.trusteeAmount, 0);

    return {
      totalEarnings,
      splitCount: splits.length,
      splits
    };
  }

  async getOperatorSubscriptionSplit(id: string): Promise<OperatorSubscriptionSplit | undefined> {
    return this.operatorSubscriptionSplits.get(id);
  }

  // Helper method to calculate subscription pricing
  private calculateSubscriptionPricing(playerCount: number, extraLadders: number, rookieModule: boolean, rookiePasses: number) {
    let tier: string;
    let basePriceMonthly: number;

    if (playerCount <= 15) {
      tier = "small";
      basePriceMonthly = 19900; // $199
    } else if (playerCount <= 25) {
      tier = "medium";
      basePriceMonthly = 29900; // $299
    } else if (playerCount <= 40) {
      tier = "large";
      basePriceMonthly = 39900; // $399
    } else {
      tier = "mega";
      basePriceMonthly = 49900; // $499
    }

    return { basePriceMonthly, tier };
  }

  private calculateTotalMonthlyCharge(basePriceMonthly: number, subscription: InsertOperatorSubscription): number {
    let total = basePriceMonthly;

    // Add extra ladder charges
    total += (subscription.extraLadders || 0) * 10000; // $100 per extra ladder

    // Add rookie module charge
    if (subscription.rookieModuleActive) {
      total += 5000; // $50/mo
    }

    // Add rookie pass charges
    total += (subscription.rookiePassesActive || 0) * 1500; // $15 per pass

    // Add extra player charges for players beyond tier limit
    const tierLimits = { small: 15, medium: 25, large: 40, mega: 999 };
    const playerCount = subscription.playerCount || 0;

    if (playerCount > 15 && subscription.tier === "small") {
      total += Math.max(0, playerCount - 15) * 800; // $8 per extra player
    } else if (playerCount > 25 && subscription.tier === "medium") {
      total += Math.max(0, playerCount - 25) * 800;
    } else if (playerCount > 40 && subscription.tier === "large") {
      total += Math.max(0, playerCount - 40) * 800;
    }

    return total;
  }

  // Membership Subscription Methods
  async getMembershipSubscriptionByPlayerId(playerId: string): Promise<MembershipSubscription | undefined> {
    return Array.from(this.membershipSubscriptions.values()).find(sub => sub.playerId === playerId);
  }

  async createMembershipSubscription(data: InsertMembershipSubscription): Promise<MembershipSubscription> {
    const subscription: MembershipSubscription = {
      id: randomUUID(),
      playerId: data.playerId,
      tier: data.tier,
      stripeSubscriptionId: nullifyUndefined(data.stripeSubscriptionId),
      stripeCustomerId: nullifyUndefined(data.stripeCustomerId),
      status: data.status || "active",
      monthlyPrice: data.monthlyPrice,
      perks: data.perks || [],
      commissionRate: data.commissionRate || 1000,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
      currentPeriodStart: nullifyUndefined(data.currentPeriodStart),
      currentPeriodEnd: nullifyUndefined(data.currentPeriodEnd),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.membershipSubscriptions.set(subscription.id, subscription);
    return subscription;
  }

  async updateMembershipSubscription(id: string, updates: Partial<MembershipSubscription>): Promise<MembershipSubscription | undefined> {
    const subscription = this.membershipSubscriptions.get(id);
    if (!subscription) return undefined;

    const updatedSubscription = { ...subscription, ...updates, updatedAt: new Date() };
    this.membershipSubscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }

  // Team Division System Methods
  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeamsByOperator(operatorId: string): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(team => team.operatorId === operatorId);
  }

  async getTeamsByHall(hallId: string): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(team => team.hallId === hallId);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const team: Team = {
      id,
      name: insertTeam.name,
      operatorId: insertTeam.operatorId,
      hallId: nullifyUndefined(insertTeam.hallId),
      captainId: insertTeam.captainId,
      teamType: insertTeam.teamType,
      maxPlayers: insertTeam.teamType === "3man" ? 3 : 5,
      maxSubs: insertTeam.teamType === "3man" ? 2 : 3,
      currentPlayers: 1, // Start with captain
      currentSubs: 0,
      rosterLocked: false,
      status: insertTeam.status || "active",
      seasonWins: 0,
      seasonLosses: 0,
      ladderPoints: 800,
      consecutiveLosses: 0,
      captainForcedNext: false,
      createdAt: new Date(),
    };
    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;

    const updatedTeam = { ...team, ...updates };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  async deleteTeam(id: string): Promise<boolean> {
    return this.teams.delete(id);
  }

  // Team Player Methods
  async getTeamPlayer(id: string): Promise<TeamPlayer | undefined> {
    return this.teamPlayers.get(id);
  }

  async getTeamPlayersByTeam(teamId: string): Promise<TeamPlayer[]> {
    return Array.from(this.teamPlayers.values()).filter(player => player.teamId === teamId);
  }

  async getTeamPlayersByPlayer(playerId: string): Promise<TeamPlayer[]> {
    return Array.from(this.teamPlayers.values()).filter(player => player.playerId === playerId);
  }

  async createTeamPlayer(insertTeamPlayer: InsertTeamPlayer): Promise<TeamPlayer> {
    const id = randomUUID();
    const teamPlayer: TeamPlayer = {
      id,
      teamId: insertTeamPlayer.teamId,
      playerId: insertTeamPlayer.playerId,
      role: insertTeamPlayer.role,
      position: nullifyUndefined(insertTeamPlayer.position),
      isActive: insertTeamPlayer.isActive ?? true,
      seasonWins: 0,
      seasonLosses: 0,
      joinedAt: new Date(),
    };
    this.teamPlayers.set(id, teamPlayer);
    return teamPlayer;
  }

  async updateTeamPlayer(id: string, updates: Partial<TeamPlayer>): Promise<TeamPlayer | undefined> {
    const teamPlayer = this.teamPlayers.get(id);
    if (!teamPlayer) return undefined;

    const updatedTeamPlayer = { ...teamPlayer, ...updates };
    this.teamPlayers.set(id, updatedTeamPlayer);
    return updatedTeamPlayer;
  }

  async removeTeamPlayer(id: string): Promise<boolean> {
    return this.teamPlayers.delete(id);
  }

  // Team Match Methods
  async getTeamMatch(id: string): Promise<TeamMatch | undefined> {
    return this.teamMatches.get(id);
  }

  async getTeamMatchesByTeam(teamId: string): Promise<TeamMatch[]> {
    return Array.from(this.teamMatches.values()).filter(match =>
      match.homeTeamId === teamId || match.awayTeamId === teamId
    );
  }

  async getTeamMatchesByOperator(operatorId: string): Promise<TeamMatch[]> {
    return Array.from(this.teamMatches.values()).filter(match => match.operatorId === operatorId);
  }

  async createTeamMatch(insertTeamMatch: InsertTeamMatch): Promise<TeamMatch> {
    const id = randomUUID();
    const teamMatch: TeamMatch = {
      id,
      homeTeamId: insertTeamMatch.homeTeamId,
      awayTeamId: insertTeamMatch.awayTeamId,
      operatorId: insertTeamMatch.operatorId,
      homeScore: 0,
      awayScore: 0,
      maxSets: insertTeamMatch.maxSets,
      currentSet: 1,
      status: insertTeamMatch.status || "scheduled",
      winnerTeamId: nullifyUndefined(insertTeamMatch.winnerTeamId),
      isHillHill: false,
      putUpRound: nullifyUndefined(insertTeamMatch.putUpRound),
      homeLineupOrder: insertTeamMatch.homeLineupOrder || [],
      awayLineupOrder: insertTeamMatch.awayLineupOrder || [],
      homeLineupRevealed: false,
      awayLineupRevealed: false,
      moneyBallActive: insertTeamMatch.moneyBallActive || false,
      moneyBallAmount: insertTeamMatch.moneyBallAmount || 2000,
      scheduledAt: nullifyUndefined(insertTeamMatch.scheduledAt),
      completedAt: null,
      createdAt: new Date(),
    };
    this.teamMatches.set(id, teamMatch);
    return teamMatch;
  }

  async updateTeamMatch(id: string, updates: Partial<TeamMatch>): Promise<TeamMatch | undefined> {
    const teamMatch = this.teamMatches.get(id);
    if (!teamMatch) return undefined;

    const updatedTeamMatch = { ...teamMatch, ...updates };
    this.teamMatches.set(id, updatedTeamMatch);
    return updatedTeamMatch;
  }

  // Team Set Methods
  async getTeamSet(id: string): Promise<TeamSet | undefined> {
    return this.teamSets.get(id);
  }

  async getTeamSetsByMatch(teamMatchId: string): Promise<TeamSet[]> {
    return Array.from(this.teamSets.values()).filter(set => set.teamMatchId === teamMatchId);
  }

  async createTeamSet(insertTeamSet: InsertTeamSet): Promise<TeamSet> {
    const id = randomUUID();
    const teamSet: TeamSet = {
      id,
      teamMatchId: insertTeamSet.teamMatchId,
      setNumber: insertTeamSet.setNumber,
      homePlayerId: insertTeamSet.homePlayerId,
      awayPlayerId: insertTeamSet.awayPlayerId,
      winnerId: nullifyUndefined(insertTeamSet.winnerId),
      loserId: nullifyUndefined(insertTeamSet.loserId),
      isPutUpSet: insertTeamSet.isPutUpSet || false,
      putUpType: nullifyUndefined(insertTeamSet.putUpType),
      isMoneyBallSet: insertTeamSet.isMoneyBallSet || false,
      status: insertTeamSet.status || "scheduled",
      completedAt: null,
      clipUrl: nullifyUndefined(insertTeamSet.clipUrl),
      createdAt: new Date(),
    };
    this.teamSets.set(id, teamSet);
    return teamSet;
  }

  async updateTeamSet(id: string, updates: Partial<TeamSet>): Promise<TeamSet | undefined> {
    const teamSet = this.teamSets.get(id);
    if (!teamSet) return undefined;

    const updatedTeamSet = { ...teamSet, ...updates };
    this.teamSets.set(id, updatedTeamSet);
    return updatedTeamSet;
  }

  // Team Challenge System Methods
  async getTeamChallenge(id: string): Promise<TeamChallenge | undefined> {
    return this.teamChallenges.get(id);
  }

  async getAllTeamChallenges(): Promise<TeamChallenge[]> {
    return Array.from(this.teamChallenges.values());
  }

  async getTeamChallengesByOperator(operatorId: string): Promise<TeamChallenge[]> {
    return Array.from(this.teamChallenges.values()).filter(challenge =>
      challenge.operatorId === operatorId
    );
  }

  async getTeamChallengesByType(challengeType: string): Promise<TeamChallenge[]> {
    return Array.from(this.teamChallenges.values()).filter(challenge =>
      challenge.challengeType === challengeType
    );
  }

  async getTeamChallengesByStatus(status: string): Promise<TeamChallenge[]> {
    return Array.from(this.teamChallenges.values()).filter(challenge =>
      challenge.status === status
    );
  }

  async createTeamChallenge(data: InsertTeamChallenge): Promise<TeamChallenge> {
    const challenge: TeamChallenge = {
      id: randomUUID(),
      challengingTeamId: data.challengingTeamId,
      challengeType: data.challengeType,
      individualFee: data.individualFee,
      totalStake: data.totalStake,
      title: data.title,
      description: data.description || null,
      status: data.status || "open",
      acceptingTeamId: data.acceptingTeamId || null,
      challengePoolId: data.challengePoolId || null,
      winnerId: data.winnerId || null,
      completedAt: null,
      expiresAt: data.expiresAt || null,
      requiresProMembership: data.requiresProMembership ?? true,
      operatorId: data.operatorId,
      createdAt: new Date(),
    };
    this.teamChallenges.set(challenge.id, challenge);
    return challenge;
  }

  async updateTeamChallenge(id: string, updates: Partial<TeamChallenge>): Promise<TeamChallenge | undefined> {
    const challenge = this.teamChallenges.get(id);
    if (!challenge) return undefined;

    const updatedChallenge = { ...challenge, ...updates };
    this.teamChallenges.set(id, updatedChallenge);
    return updatedChallenge;
  }

  async acceptTeamChallenge(challengeId: string, acceptingTeamId: string): Promise<TeamChallenge | undefined> {
    const challenge = this.teamChallenges.get(challengeId);
    if (!challenge || challenge.status !== "open") return undefined;

    const updatedChallenge = {
      ...challenge,
      acceptingTeamId,
      status: "accepted" as const
    };
    this.teamChallenges.set(challengeId, updatedChallenge);
    return updatedChallenge;
  }

  async getTeamChallengeParticipant(id: string): Promise<TeamChallengeParticipant | undefined> {
    return this.teamChallengeParticipants.get(id);
  }

  async getTeamChallengeParticipantsByChallenge(challengeId: string): Promise<TeamChallengeParticipant[]> {
    return Array.from(this.teamChallengeParticipants.values()).filter(participant =>
      participant.teamChallengeId === challengeId
    );
  }

  async createTeamChallengeParticipant(data: InsertTeamChallengeParticipant): Promise<TeamChallengeParticipant> {
    const participant: TeamChallengeParticipant = {
      id: randomUUID(),
      teamChallengeId: data.teamChallengeId,
      teamId: data.teamId,
      playerId: data.playerId,
      feeContribution: data.feeContribution,
      hasPaid: data.hasPaid || false,
      membershipTier: data.membershipTier,
      createdAt: new Date(),
    };
    this.teamChallengeParticipants.set(participant.id, participant);
    return participant;
  }

  async updateTeamChallengeParticipant(id: string, updates: Partial<TeamChallengeParticipant>): Promise<TeamChallengeParticipant | undefined> {
    const participant = this.teamChallengeParticipants.get(id);
    if (!participant) return undefined;

    const updatedParticipant = { ...participant, ...updates };
    this.teamChallengeParticipants.set(id, updatedParticipant);
    return updatedParticipant;
  }

  // Team Challenge Business Logic Methods
  calculateTeamChallengeStake(challengeType: string, individualFee: number): number {
    const teamSize = this.getTeamSizeFromChallengeType(challengeType);
    return individualFee * teamSize;
  }

  private getTeamSizeFromChallengeType(challengeType: string): number {
    switch (challengeType) {
      case "2man_army": return 2;
      case "3man_crew": return 3;
      default: throw new Error(`Unknown challenge type: ${challengeType}`);
    }
  }

  async validateProMembership(playerId: string): Promise<boolean> {
    const player = this.players.get(playerId);
    return player?.membershipTier === "pro";
  }

  async createTeamChallengeWithParticipants(
    challengeData: InsertTeamChallenge,
    teamPlayers: string[]
  ): Promise<{ challenge: TeamChallenge; participants: TeamChallengeParticipant[] }> {
    // Validate Pro membership for all players
    for (const playerId of teamPlayers) {
      const isProMember = await this.validateProMembership(playerId);
      if (!isProMember) {
        throw new Error(`Player ${playerId} does not have Pro membership required for team challenges`);
      }
    }

    // Calculate total stake
    const totalStake = this.calculateTeamChallengeStake(challengeData.challengeType, challengeData.individualFee);

    // Create the challenge
    const challenge = await this.createTeamChallenge({
      ...challengeData,
      totalStake,
    });

    // Create participants
    const participants: TeamChallengeParticipant[] = [];
    for (const playerId of teamPlayers) {
      const player = this.players.get(playerId);
      if (!player) throw new Error(`Player ${playerId} not found`);

      const participant = await this.createTeamChallengeParticipant({
        teamChallengeId: challenge.id,
        teamId: challengeData.challengingTeamId,
        playerId,
        feeContribution: challengeData.individualFee,
        membershipTier: player.membershipTier || "none",
      });
      participants.push(participant);
    }

    return { challenge, participants };
  }

  // === SPORTSMANSHIP VOTE-OUT SYSTEM IMPLEMENTATION ===

  // Check-in management
  async checkinUser(data: InsertCheckin): Promise<Checkin> {
    const checkin: Checkin = {
      id: randomUUID(),
      userId: data.userId,
      venueId: data.venueId,
      sessionId: data.sessionId,
      role: data.role,
      verified: data.verified || false,
      createdAt: new Date(),
    };
    this.checkins.set(checkin.id, checkin);
    return checkin;
  }

  async getCheckinsBySession(sessionId: string): Promise<Checkin[]> {
    return Array.from(this.checkins.values()).filter(checkin =>
      checkin.sessionId === sessionId
    );
  }

  async getCheckinsByVenue(venueId: string): Promise<Checkin[]> {
    return Array.from(this.checkins.values()).filter(checkin =>
      checkin.venueId === venueId
    );
  }

  async getActiveCheckins(sessionId: string, venueId: string): Promise<Checkin[]> {
    return Array.from(this.checkins.values()).filter(checkin =>
      checkin.sessionId === sessionId && checkin.venueId === venueId
    );
  }

  // Vote management
  async createAttitudeVote(data: InsertAttitudeVote): Promise<AttitudeVote> {
    const vote: AttitudeVote = {
      id: randomUUID(),
      targetUserId: data.targetUserId,
      sessionId: data.sessionId,
      venueId: data.venueId,
      status: data.status || "open",
      startedAt: new Date(),
      endsAt: data.endsAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24 hours
      quorumRequired: data.quorumRequired || 3, // Default quorum
      thresholdRequired: data.thresholdRequired || 2, // Default threshold
      result: nullifyUndefined(data.result),
      createdBy: data.createdBy,
    };
    this.attitudeVotes.set(vote.id, vote);
    return vote;
  }

  async getAttitudeVote(id: string): Promise<AttitudeVote | undefined> {
    return this.attitudeVotes.get(id);
  }

  async getActiveVotes(sessionId: string, venueId: string): Promise<AttitudeVote[]> {
    return Array.from(this.attitudeVotes.values()).filter(vote =>
      vote.sessionId === sessionId &&
      vote.venueId === venueId &&
      vote.status === "open"
    );
  }

  async updateAttitudeVote(id: string, updates: Partial<AttitudeVote>): Promise<AttitudeVote | undefined> {
    const vote = this.attitudeVotes.get(id);
    if (!vote) return undefined;

    const updatedVote = { ...vote, ...updates };
    this.attitudeVotes.set(id, updatedVote);
    return updatedVote;
  }

  async closeAttitudeVote(id: string, result: string): Promise<AttitudeVote | undefined> {
    return this.updateAttitudeVote(id, { status: "closed", result });
  }

  // Ballot management
  async createAttitudeBallot(data: InsertAttitudeBallot): Promise<AttitudeBallot> {
    const ballot: AttitudeBallot = {
      id: randomUUID(),
      voteId: data.voteId,
      voterUserId: data.voterUserId,
      weight: data.weight || 1,
      choice: data.choice,
      tags: nullifyUndefined(data.tags),
      note: nullifyUndefined(data.note),
      createdAt: new Date(),
    };
    this.attitudeBallots.set(ballot.id, ballot);
    return ballot;
  }

  async getBallotsByVote(voteId: string): Promise<AttitudeBallot[]> {
    return Array.from(this.attitudeBallots.values()).filter(ballot =>
      ballot.voteId === voteId
    );
  }

  async hasUserVoted(voteId: string, userId: string): Promise<boolean> {
    return Array.from(this.attitudeBallots.values()).some(ballot =>
      ballot.voteId === voteId && ballot.voterUserId === userId
    );
  }

  // Vote calculation utilities
  async calculateVoteWeights(voteId: string): Promise<{ totalWeight: number; outWeight: number; keepWeight: number }> {
    const ballots = await this.getBallotsByVote(voteId);

    let outWeight = 0;
    let keepWeight = 0;

    for (const ballot of ballots) {
      if (ballot.choice === "out") {
        outWeight += ballot.weight;
      } else if (ballot.choice === "keep") {
        keepWeight += ballot.weight;
      }
    }

    return {
      totalWeight: outWeight + keepWeight,
      outWeight,
      keepWeight
    };
  }

  async checkVoteQuorum(voteId: string): Promise<boolean> {
    const vote = await this.getAttitudeVote(voteId);
    if (!vote) return false;

    const { totalWeight } = await this.calculateVoteWeights(voteId);
    return totalWeight >= vote.quorumRequired;
  }

  // Incident management
  async createIncident(data: InsertIncident): Promise<Incident> {
    const incident: Incident = {
      id: randomUUID(),
      userId: data.userId,
      sessionId: data.sessionId ?? "",
      venueId: data.venueId ?? "",
      type: data.type ?? "",
      details: data.details ?? "",
      consequence: data.consequence ?? "",
      pointsPenalty: data.pointsPenalty || 0,
      creditsFine: data.creditsFine || 0,
      createdBy: data.createdBy ?? "",
      voteId: data.voteId ?? null,
      createdAt: new Date(),
    };
    this.incidents.set(incident.id, incident);
    return incident;
  }

  async getIncidentsByUser(userId: string): Promise<Incident[]> {
    return Array.from(this.incidents.values()).filter(incident =>
      incident.userId === userId
    );
  }

  async getRecentIncidents(venueId: string, hours: number): Promise<Incident[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.incidents.values()).filter(incident =>
      incident.venueId === venueId &&
      incident.createdAt && incident.createdAt >= cutoffTime
    );
  }

  // User eligibility and cooldowns
  async canUserBeVotedOn(userId: string, sessionId: string): Promise<boolean> {
    // Check for recent votes (15-minute cooldown)
    const recentVotes = Array.from(this.attitudeVotes.values()).filter(vote =>
      vote.targetUserId === userId &&
      vote.sessionId === sessionId &&
      vote.startedAt && vote.startedAt > new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
    );

    // Can't be voted on if there was a recent vote
    if (recentVotes.length > 0) return false;

    // Check if user was already ejected tonight
    const todayIncidents = Array.from(this.incidents.values()).filter(incident =>
      incident.userId === userId &&
      incident.type === "ejection" &&
      incident.createdAt && incident.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    );

    return todayIncidents.length === 0;
  }

  async getLastVoteForUser(userId: string, sessionId: string): Promise<AttitudeVote | undefined> {
    const userVotes = Array.from(this.attitudeVotes.values())
      .filter(vote => vote.targetUserId === userId && vote.sessionId === sessionId)
      .sort((a, b) => (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0));

    return userVotes[0];
  }

  async isUserImmune(userId: string, sessionId: string): Promise<boolean> {
    // Check if user is currently shooting in an active match
    // For now, implement basic logic - can be enhanced with actual match state
    const activeMatches = Array.from(this.matches.values()).filter(match =>
      (match.challenger === userId || match.opponent === userId) &&
      match.status === "in_progress"
    );

    // If user is in an active match, they have immunity (during their turn)
    // This is a simplified implementation - real implementation would check whose turn it is
    return activeMatches.length > 0;
  }

  // === MATCH DIVISION SYSTEM IMPLEMENTATION ===

  // Match Division management
  async createMatchDivision(data: InsertMatchDivision): Promise<MatchDivision> {
    const division: MatchDivision = {
      id: randomUUID(),
      name: data.name,
      displayName: data.displayName,
      minTeamSize: data.minTeamSize,
      maxTeamSize: data.maxTeamSize,
      entryFeeMin: data.entryFeeMin,
      entryFeeMax: data.entryFeeMax,
      requiresStreaming: data.requiresStreaming || false,
      requiresCaptain: data.requiresCaptain || false,
      allowsSideBets: data.allowsSideBets || false,
      description: nullifyUndefined(data.description),
      active: data.active ?? true,
      createdAt: new Date(),
    };
    this.matchDivisions.set(division.id, division);
    return division;
  }

  async getMatchDivisions(): Promise<MatchDivision[]> {
    return Array.from(this.matchDivisions.values()).filter(d => d.active);
  }

  async getMatchDivision(id: string): Promise<MatchDivision | undefined> {
    return this.matchDivisions.get(id);
  }

  async getMatchDivisionByName(name: string): Promise<MatchDivision | undefined> {
    return Array.from(this.matchDivisions.values()).find(d => d.name === name && d.active);
  }

  // Operator Tier management
  async createOperatorTier(data: InsertOperatorTier): Promise<OperatorTier> {
    const tier: OperatorTier = {
      id: randomUUID(),
      name: data.name,
      displayName: data.displayName,
      monthlyFee: data.monthlyFee,
      revenueSplitPercent: data.revenueSplitPercent,
      maxTeams: data.maxTeams ?? null,
      hasPromoTools: data.hasPromoTools || false,
      hasLiveStreamBonus: data.hasLiveStreamBonus || false,
      hasResellRights: data.hasResellRights || false,
      description: data.description ?? null,
      features: data.features || [],
      active: data.active ?? true,
      createdAt: new Date(),
    };
    this.operatorTiers.set(tier.id, tier);
    return tier;
  }

  async getOperatorTiers(): Promise<OperatorTier[]> {
    return Array.from(this.operatorTiers.values()).filter(t => t.active);
  }

  async getOperatorTier(id: string): Promise<OperatorTier | undefined> {
    return this.operatorTiers.get(id);
  }

  async getOperatorTierByName(name: string): Promise<OperatorTier | undefined> {
    return Array.from(this.operatorTiers.values()).find(t => t.name === name && t.active);
  }

  // Team Stripe Connect Account management
  async createTeamStripeAccount(data: InsertTeamStripeAccount): Promise<TeamStripeAccount> {
    const account: TeamStripeAccount = {
      id: randomUUID(),
      teamId: data.teamId,
      stripeAccountId: data.stripeAccountId,
      accountStatus: data.accountStatus || "pending",
      onboardingCompleted: data.onboardingCompleted || false,
      detailsSubmitted: data.detailsSubmitted || false,
      payoutsEnabled: data.payoutsEnabled || false,
      chargesEnabled: data.chargesEnabled || false,
      businessType: data.businessType ?? null,
      country: data.country || "US",
      email: data.email ?? null,
      lastOnboardingRefresh: data.lastOnboardingRefresh ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.teamStripeAccounts.set(account.id, account);
    return account;
  }

  async getTeamStripeAccount(teamId: string): Promise<TeamStripeAccount | undefined> {
    return Array.from(this.teamStripeAccounts.values()).find(a => a.teamId === teamId);
  }

  async updateTeamStripeAccount(teamId: string, updates: Partial<TeamStripeAccount>): Promise<TeamStripeAccount | undefined> {
    const account = await this.getTeamStripeAccount(teamId);
    if (!account) return undefined;

    const updatedAccount = { ...account, ...updates, updatedAt: new Date() };
    this.teamStripeAccounts.set(account.id, updatedAccount);
    return updatedAccount;
  }

  // Match Entry management
  async createMatchEntry(data: InsertMatchEntry): Promise<MatchEntry> {
    const entry: MatchEntry = {
      id: randomUUID(),
      matchId: data.matchId,
      divisionId: data.divisionId,
      homeTeamId: data.homeTeamId,
      awayTeamId: data.awayTeamId ?? null,
      entryFeePerPlayer: data.entryFeePerPlayer,
      totalStake: data.totalStake,
      stripeCheckoutSessionId: data.stripeCheckoutSessionId ?? null,
      stripePaymentIntentId: data.stripePaymentIntentId ?? null,
      paymentStatus: data.paymentStatus || "pending",
      matchStatus: data.matchStatus || "open",
      winnerId: data.winnerId ?? null,
      homeScore: data.homeScore || 0,
      awayScore: data.awayScore || 0,
      scheduledAt: data.scheduledAt ?? null,
      completedAt: data.completedAt ?? null,
      venueId: data.venueId ?? null,
      streamUrl: data.streamUrl ?? null,
      captainHomeId: data.captainHomeId ?? null,
      captainAwayId: data.captainAwayId ?? null,
      operatorId: data.operatorId,
      metadata: data.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.matchEntries.set(entry.id, entry);
    return entry;
  }

  async getMatchEntry(id: string): Promise<MatchEntry | undefined> {
    return this.matchEntries.get(id);
  }

  async getMatchEntryByMatchId(matchId: string): Promise<MatchEntry | undefined> {
    return Array.from(this.matchEntries.values()).find(e => e.matchId === matchId);
  }

  async getMatchEntriesByDivision(divisionId: string): Promise<MatchEntry[]> {
    return Array.from(this.matchEntries.values()).filter(e => e.divisionId === divisionId);
  }

  async updateMatchEntry(id: string, updates: Partial<MatchEntry>): Promise<MatchEntry | undefined> {
    const entry = this.matchEntries.get(id);
    if (!entry) return undefined;

    const updatedEntry = { ...entry, ...updates, updatedAt: new Date() };
    this.matchEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  // Payout Distribution management
  async createPayoutDistribution(data: InsertPayoutDistribution): Promise<PayoutDistribution> {
    const payout: PayoutDistribution = {
      id: randomUUID(),
      matchEntryId: data.matchEntryId,
      winningTeamId: data.winningTeamId,
      totalPayout: data.totalPayout,
      platformFee: data.platformFee,
      operatorFee: data.operatorFee,
      teamPayout: data.teamPayout,
      stripeTransferId: data.stripeTransferId ?? null,
      transferStatus: data.transferStatus || "pending",
      transferredAt: data.transferredAt ?? null,
      operatorTierAtPayout: data.operatorTierAtPayout ?? null,
      revenueSplitAtPayout: data.revenueSplitAtPayout ?? null,
      payoutMethod: data.payoutMethod || "stripe_transfer",
      notes: data.notes ?? null,
      createdAt: new Date(),
    };
    this.payoutDistributions.set(payout.id, payout);
    return payout;
  }

  async getPayoutDistribution(id: string): Promise<PayoutDistribution | undefined> {
    return this.payoutDistributions.get(id);
  }

  async getPayoutByMatchEntry(matchEntryId: string): Promise<PayoutDistribution | undefined> {
    return Array.from(this.payoutDistributions.values()).find(p => p.matchEntryId === matchEntryId);
  }

  async updatePayoutDistribution(id: string, updates: Partial<PayoutDistribution>): Promise<PayoutDistribution | undefined> {
    const payout = this.payoutDistributions.get(id);
    if (!payout) return undefined;

    const updatedPayout = { ...payout, ...updates };
    this.payoutDistributions.set(id, updatedPayout);
    return updatedPayout;
  }

  // Team Registration management
  async createTeamRegistration(data: InsertTeamRegistration): Promise<TeamRegistration> {
    const registration: TeamRegistration = {
      id: randomUUID(),
      teamId: data.teamId,
      divisionId: data.divisionId,
      captainId: data.captainId,
      teamName: data.teamName,
      logoUrl: data.logoUrl ?? null,
      playerRoster: data.playerRoster || [],
      entryFeePaid: data.entryFeePaid || false,
      stripePaymentIntentId: data.stripePaymentIntentId ?? null,
      registrationStatus: data.registrationStatus || "pending",
      confirmedAt: data.confirmedAt ?? null,
      bracketPosition: data.bracketPosition ?? null,
      seedRank: data.seedRank ?? null,
      operatorId: data.operatorId,
      venueId: data.venueId ?? null,
      seasonId: data.seasonId ?? null,
      metadata: data.metadata,
      createdAt: new Date(),
    };
    this.teamRegistrations.set(registration.id, registration);
    return registration;
  }

  async getTeamRegistration(id: string): Promise<TeamRegistration | undefined> {
    return this.teamRegistrations.get(id);
  }

  async getTeamRegistrationsByDivision(divisionId: string): Promise<TeamRegistration[]> {
    return Array.from(this.teamRegistrations.values()).filter(r => r.divisionId === divisionId);
  }

  async updateTeamRegistration(id: string, updates: Partial<TeamRegistration>): Promise<TeamRegistration | undefined> {
    const registration = this.teamRegistrations.get(id);
    if (!registration) return undefined;

    const updatedRegistration = { ...registration, ...updates };
    this.teamRegistrations.set(id, updatedRegistration);
    return updatedRegistration;
  }

  // === FILE UPLOAD TRACKING METHODS ===

  async getUploadedFile(id: string): Promise<UploadedFile | undefined> {
    return this.uploadedFiles.get(id);
  }

  async getUploadedFileByPath(objectPath: string): Promise<UploadedFile | undefined> {
    return Array.from(this.uploadedFiles.values()).find(file => file.objectPath === objectPath);
  }

  async getUserUploadedFiles(userId: string, category?: string): Promise<UploadedFile[]> {
    const userFiles = Array.from(this.uploadedFiles.values()).filter(file =>
      file.userId === userId && file.isActive
    );

    if (category) {
      return userFiles.filter(file => file.category === category);
    }

    return userFiles;
  }

  async getAllUploadedFiles(): Promise<UploadedFile[]> {
    return Array.from(this.uploadedFiles.values()).filter(file => file.isActive);
  }

  async createUploadedFile(data: InsertUploadedFile): Promise<UploadedFile> {
    const file: UploadedFile = {
      id: randomUUID(),
      userId: data.userId,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      objectPath: data.objectPath,
      category: data.category || "general_upload",
      visibility: data.visibility || "private",
      description: nullifyUndefined(data.description),
      tags: nullifyUndefined(data.tags),
      lastAccessedAt: nullifyUndefined(data.lastAccessedAt),
      uploadedAt: new Date(),
      downloadCount: 0,
      isActive: true,
    };
    this.uploadedFiles.set(file.id, file);
    return file;
  }

  async updateUploadedFile(id: string, updates: Partial<UploadedFile>): Promise<UploadedFile | undefined> {
    const file = this.uploadedFiles.get(id);
    if (!file) return undefined;

    const updatedFile = { ...file, ...updates };
    this.uploadedFiles.set(id, updatedFile);
    return updatedFile;
  }

  async deleteUploadedFile(id: string): Promise<boolean> {
    const file = this.uploadedFiles.get(id);
    if (!file) return false;

    // Soft delete by setting isActive to false
    const updatedFile = { ...file, isActive: false };
    this.uploadedFiles.set(id, updatedFile);
    return true;
  }

  async incrementFileDownloadCount(id: string): Promise<void> {
    const file = this.uploadedFiles.get(id);
    if (!file) return;

    const updatedFile = { ...file, downloadCount: (file.downloadCount || 0) + 1 };
    this.uploadedFiles.set(id, updatedFile);
  }

  // === FILE SHARING METHODS ===

  async getFileShare(id: string): Promise<FileShare | undefined> {
    return this.fileShares.get(id);
  }

  async getFileShares(fileId: string): Promise<FileShare[]> {
    return Array.from(this.fileShares.values()).filter(share =>
      share.fileId === fileId && share.isActive
    );
  }

  async getUserSharedFiles(userId: string): Promise<FileShare[]> {
    return Array.from(this.fileShares.values()).filter(share =>
      share.sharedWithUserId === userId && share.isActive
    );
  }

  async createFileShare(data: InsertFileShare): Promise<FileShare> {
    const share: FileShare = {
      id: randomUUID(),
      fileId: data.fileId,
      sharedWithUserId: nullifyUndefined(data.sharedWithUserId),
      sharedWithRole: nullifyUndefined(data.sharedWithRole),
      sharedWithHallId: nullifyUndefined(data.sharedWithHallId),
      permission: data.permission || "read",
      expiresAt: nullifyUndefined(data.expiresAt),
      sharedBy: data.sharedBy,
      createdAt: new Date(),
      isActive: true,
    };
    this.fileShares.set(share.id, share);
    return share;
  }

  async updateFileShare(id: string, updates: Partial<FileShare>): Promise<FileShare | undefined> {
    const share = this.fileShares.get(id);
    if (!share) return undefined;

    const updatedShare = { ...share, ...updates };
    this.fileShares.set(id, updatedShare);
    return updatedShare;
  }

  async deleteFileShare(id: string): Promise<boolean> {
    const share = this.fileShares.get(id);
    if (!share) return false;

    // Soft delete by setting isActive to false
    const updatedShare = { ...share, isActive: false };
    this.fileShares.set(id, updatedShare);
    return true;
  }

  // === WEIGHT RULES METHODS ===

  async getWeightRule(id: string): Promise<WeightRule | undefined> {
    return this.weightRules.get(id);
  }

  async getWeightRulesByPlayer(playerId: string): Promise<WeightRule[]> {
    return Array.from(this.weightRules.values()).filter(rule => rule.playerId === playerId);
  }

  async createWeightRule(data: InsertWeightRule): Promise<WeightRule> {
    const rule: WeightRule = {
      id: randomUUID(),
      playerId: data.playerId,
      opponentId: data.opponentId,
      consecutiveLosses: data.consecutiveLosses || 0,
      totalLosses: data.totalLosses || 0,
      weightOwed: data.weightOwed || false,
      lastLossAt: data.lastLossAt || null,
      createdAt: new Date(),
    };
    this.weightRules.set(rule.id, rule);
    return rule;
  }

  async updateWeightRule(id: string, updates: Partial<WeightRule>): Promise<WeightRule | undefined> {
    const rule = this.weightRules.get(id);
    if (!rule) return undefined;

    const updatedRule = { ...rule, ...updates };
    this.weightRules.set(id, updatedRule);
    return updatedRule;
  }

  // === TUTORING SYSTEM METHODS ===

  async getTutoringSession(id: string): Promise<TutoringSession | undefined> {
    return this.tutoringSessions.get(id);
  }

  async getTutoringSessionsByTutor(tutorId: string): Promise<TutoringSession[]> {
    return Array.from(this.tutoringSessions.values()).filter(session => session.tutorId === tutorId);
  }

  async getTutoringSessionsByRookie(rookieId: string): Promise<TutoringSession[]> {
    return Array.from(this.tutoringSessions.values()).filter(session => session.rookieId === rookieId);
  }

  async createTutoringSession(data: InsertTutoringSession): Promise<TutoringSession> {
    const session: TutoringSession = {
      id: randomUUID(),
      tutorId: data.tutorId,
      rookieId: data.rookieId,
      scheduledAt: data.scheduledAt,
      duration: data.duration || 30,
      status: data.status || "scheduled",
      rookieConfirmed: data.rookieConfirmed || false,
      creditAmount: data.creditAmount || 1000,
      creditApplied: data.creditApplied || false,
      notes: data.notes || null,
      completedAt: null,
      createdAt: new Date(),
    };
    this.tutoringSessions.set(session.id, session);
    return session;
  }

  async updateTutoringSession(id: string, updates: Partial<TutoringSession>): Promise<TutoringSession | undefined> {
    const session = this.tutoringSessions.get(id);
    if (!session) return undefined;

    const updatedSession = { ...session, ...updates };
    this.tutoringSessions.set(id, updatedSession);
    return updatedSession;
  }

  async getTutoringCredits(id: string): Promise<TutoringCredits | undefined> {
    return this.tutoringCredits.get(id);
  }

  async getTutoringCreditsByTutor(tutorId: string): Promise<TutoringCredits[]> {
    return Array.from(this.tutoringCredits.values()).filter(credits => credits.tutorId === tutorId);
  }

  async createTutoringCredits(data: InsertTutoringCredits): Promise<TutoringCredits> {
    const credits: TutoringCredits = {
      id: randomUUID(),
      tutorId: data.tutorId,
      sessionId: data.sessionId ?? null,
      amount: data.amount,
      applied: data.applied || false,
      createdAt: new Date(),
    };
    this.tutoringCredits.set(credits.id, credits);
    return credits;
  }

  // === COMMISSION AND EARNINGS METHODS ===

  async getCommissionRate(id: string): Promise<CommissionRate | undefined> {
    return this.commissionRates.get(id);
  }

  async getCommissionRatesByOperator(operatorId: string): Promise<CommissionRate[]> {
    return Array.from(this.commissionRates.values()).filter(rate => rate.operatorId === operatorId);
  }

  async createCommissionRate(data: InsertCommissionRate): Promise<CommissionRate> {
    const rate: CommissionRate = {
      id: randomUUID(),
      operatorId: data.operatorId,
      membershipTier: data.membershipTier,
      platformCommissionBps: data.platformCommissionBps,
      operatorCommissionBps: data.operatorCommissionBps,
      escrowCommissionBps: data.escrowCommissionBps || 250,
      effectiveDate: data.effectiveDate || new Date(),
      createdAt: new Date(),
    };
    this.commissionRates.set(rate.id, rate);
    return rate;
  }

  async getPlatformEarnings(id: string): Promise<PlatformEarnings | undefined> {
    return this.platformEarnings.get(id);
  }

  async getPlatformEarningsByOperator(operatorId: string): Promise<PlatformEarnings[]> {
    return Array.from(this.platformEarnings.values()).filter(earnings => earnings.operatorId === operatorId);
  }

  async createPlatformEarnings(data: InsertPlatformEarnings): Promise<PlatformEarnings> {
    const earnings: PlatformEarnings = {
      id: randomUUID(),
      operatorId: data.operatorId,
      sourceType: data.sourceType,
      sourceId: data.sourceId || null,
      grossAmount: data.grossAmount,
      platformAmount: data.platformAmount,
      operatorAmount: data.operatorAmount,
      platformCommissionBps: data.platformCommissionBps,
      operatorCommissionBps: data.operatorCommissionBps,
      settlementStatus: data.settlementStatus || "pending",
      settledAt: data.settledAt || null,
      stripeTransferId: data.stripeTransferId || null,
      createdAt: new Date(),
    };
    this.platformEarnings.set(earnings.id, earnings);
    return earnings;
  }

  async getMembershipEarnings(id: string): Promise<MembershipEarnings | undefined> {
    return this.membershipEarnings.get(id);
  }

  async getMembershipEarningsByOperator(operatorId: string): Promise<MembershipEarnings[]> {
    return Array.from(this.membershipEarnings.values()).filter(earnings => earnings.operatorId === operatorId);
  }

  async createMembershipEarnings(data: InsertMembershipEarnings): Promise<MembershipEarnings> {
    const earnings: MembershipEarnings = {
      id: randomUUID(),
      subscriptionId: data.subscriptionId,
      operatorId: data.operatorId,
      playerId: data.playerId,
      membershipTier: data.membershipTier,
      grossAmount: data.grossAmount,
      platformAmount: data.platformAmount,
      operatorAmount: data.operatorAmount,
      billingPeriodStart: data.billingPeriodStart,
      billingPeriodEnd: data.billingPeriodEnd,
      processedAt: new Date(),
    };
    this.membershipEarnings.set(earnings.id, earnings);
    return earnings;
  }

  async getOperatorPayout(id: string): Promise<OperatorPayout | undefined> {
    return this.operatorPayouts.get(id);
  }

  async getOperatorPayoutsByOperator(operatorId: string): Promise<OperatorPayout[]> {
    return Array.from(this.operatorPayouts.values()).filter(payout => payout.operatorId === operatorId);
  }

  async createOperatorPayout(data: InsertOperatorPayout): Promise<OperatorPayout> {
    const payout: OperatorPayout = {
      id: randomUUID(),
      operatorId: data.operatorId,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      totalEarnings: data.totalEarnings,
      matchCommissions: data.matchCommissions || 0,
      membershipCommissions: data.membershipCommissions || 0,
      escrowCommissions: data.escrowCommissions || 0,
      otherEarnings: data.otherEarnings || 0,
      stripeTransferId: data.stripeTransferId || null,
      payoutStatus: data.payoutStatus || "pending",
      payoutMethod: data.payoutMethod || "stripe_transfer",
      processedAt: null,
      createdAt: new Date(),
    };
    this.operatorPayouts.set(payout.id, payout);
    return payout;
  }

  // === CHALLENGE CALENDAR METHODS ===
  async getChallenge(id: string): Promise<Challenge | undefined> {
    return this.challenges.get(id);
  }

  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    const id = randomUUID();
    const challenge: Challenge = {
      id,
      aPlayerId: insertChallenge.aPlayerId,
      bPlayerId: insertChallenge.bPlayerId,
      aPlayerName: insertChallenge.aPlayerName,
      bPlayerName: insertChallenge.bPlayerName,
      gameType: insertChallenge.gameType,
      tableType: insertChallenge.tableType,
      stakes: insertChallenge.stakes,
      scheduledAt: new Date(insertChallenge.scheduledAt),
      durationMinutes: insertChallenge.durationMinutes ?? 90,
      hallId: insertChallenge.hallId,
      hallName: insertChallenge.hallName,
      status: insertChallenge.status ?? "scheduled",
      checkedInAt: nullifyUndefined(insertChallenge.checkedInAt),
      completedAt: nullifyUndefined(insertChallenge.completedAt),
      winnerId: nullifyUndefined(insertChallenge.winnerId),
      posterImageUrl: nullifyUndefined(insertChallenge.posterImageUrl),
      description: nullifyUndefined(insertChallenge.description),
      lateFeesApplied: insertChallenge.lateFeesApplied ?? false,
      noShowFeesApplied: insertChallenge.noShowFeesApplied ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.challenges.set(id, challenge);
    return challenge;
  }

  async updateChallenge(id: string, updates: Partial<Challenge>): Promise<Challenge | undefined> {
    return updateMapRecord(this.challenges, id, updates, NULLABLE_FIELDS.Challenge);
  }

  async getChallengesByPlayer(playerId: string): Promise<Challenge[]> {
    return Array.from(this.challenges.values()).filter(
      challenge => challenge.aPlayerId === playerId || challenge.bPlayerId === playerId
    );
  }

  async getChallengesByHall(hallId: string): Promise<Challenge[]> {
    return Array.from(this.challenges.values()).filter(
      challenge => challenge.hallId === hallId
    );
  }

  async getChallengesByDateRange(startDate: Date, endDate: Date): Promise<Challenge[]> {
    return Array.from(this.challenges.values()).filter(challenge => {
      const scheduledAt = new Date(challenge.scheduledAt);
      return scheduledAt >= startDate && scheduledAt <= endDate;
    });
  }

  async getUpcomingChallenges(limit: number = 50): Promise<Challenge[]> {
    const now = new Date();
    return Array.from(this.challenges.values())
      .filter(challenge => new Date(challenge.scheduledAt) > now)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, limit);
  }

  // Challenge Fees
  async getChallengeFee(id: string): Promise<ChallengeFee | undefined> {
    return this.challengeFees.get(id);
  }

  async createChallengeFee(insertFee: InsertChallengeFee): Promise<ChallengeFee> {
    const id = randomUUID();
    const fee: ChallengeFee = {
      id,
      challengeId: insertFee.challengeId,
      playerId: insertFee.playerId,
      feeType: insertFee.feeType,
      amount: insertFee.amount,
      scheduledAt: new Date(insertFee.scheduledAt),
      actualAt: nullifyUndefined(insertFee.actualAt),
      minutesLate: insertFee.minutesLate ?? 0,
      status: insertFee.status ?? "pending",
      stripeChargeId: nullifyUndefined(insertFee.stripeChargeId),
      stripeCustomerId: nullifyUndefined(insertFee.stripeCustomerId),
      chargedAt: nullifyUndefined(insertFee.chargedAt),
      waivedAt: nullifyUndefined(insertFee.waivedAt),
      waivedBy: nullifyUndefined(insertFee.waivedBy),
      waiverReason: nullifyUndefined(insertFee.waiverReason),
      createdAt: new Date(),
    };
    this.challengeFees.set(id, fee);
    return fee;
  }

  async updateChallengeFee(id: string, updates: Partial<ChallengeFee>): Promise<ChallengeFee | undefined> {
    return updateMapRecord(this.challengeFees, id, updates, NULLABLE_FIELDS.ChallengeFee);
  }

  async getChallengeFeesByChallenge(challengeId: string): Promise<ChallengeFee[]> {
    return Array.from(this.challengeFees.values()).filter(
      fee => fee.challengeId === challengeId
    );
  }

  async getChallengeFeesByStatus(statuses: string[]): Promise<ChallengeFee[]> {
    return Array.from(this.challengeFees.values()).filter(fee => statuses.includes(fee.status));
  }

  // Challenge Check-ins
  async createChallengeCheckIn(insertCheckIn: InsertChallengeCheckIn): Promise<ChallengeCheckIn> {
    const id = randomUUID();
    const checkIn: ChallengeCheckIn = {
      id,
      challengeId: insertCheckIn.challengeId,
      playerId: insertCheckIn.playerId,
      checkedInAt: new Date(insertCheckIn.checkedInAt),
      checkedInBy: nullifyUndefined(insertCheckIn.checkedInBy),
      location: nullifyUndefined(insertCheckIn.location),
      createdAt: new Date(),
    };
    this.challengeCheckIns.set(id, checkIn);
    return checkIn;
  }

  async getChallengeCheckInsByChallenge(challengeId: string): Promise<ChallengeCheckIn[]> {
    return Array.from(this.challengeCheckIns.values()).filter(
      checkIn => checkIn.challengeId === challengeId
    );
  }

  // Challenge Policies
  async getChallengesPolicyByHall(hallId: string): Promise<ChallengePolicy | undefined> {
    return Array.from(this.challengePolicies.values()).find(
      policy => policy.hallId === hallId
    );
  }

  async createChallengePolicy(insertPolicy: InsertChallengePolicy): Promise<ChallengePolicy> {
    const id = randomUUID();
    const policy: ChallengePolicy = {
      id,
      hallId: insertPolicy.hallId,
      lateFeeEnabled: insertPolicy.lateFeeEnabled ?? true,
      lateFeeAmount: insertPolicy.lateFeeAmount ?? 500,
      lateFeeThresholdMinutes: insertPolicy.lateFeeThresholdMinutes ?? 15,
      noShowFeeEnabled: insertPolicy.noShowFeeEnabled ?? true,
      noShowFeeAmount: insertPolicy.noShowFeeAmount ?? 1500,
      noShowThresholdMinutes: insertPolicy.noShowThresholdMinutes ?? 45,
      cancellationFeeEnabled: insertPolicy.cancellationFeeEnabled ?? true,
      cancellationFeeAmount: insertPolicy.cancellationFeeAmount ?? 1000,
      cancellationThresholdHours: insertPolicy.cancellationThresholdHours ?? 24,
      gracePeriodMinutes: insertPolicy.gracePeriodMinutes ?? 5,
      autoChargeEnabled: insertPolicy.autoChargeEnabled ?? true,
      requireConfirmation: insertPolicy.requireConfirmation ?? false,
      updatedBy: insertPolicy.updatedBy,
      updatedAt: new Date(),
    };
    this.challengePolicies.set(id, policy);
    return policy;
  }

  async updateChallengePolicy(id: string, updates: Partial<ChallengePolicy>): Promise<ChallengePolicy | undefined> {
    return updateMapRecord(this.challengePolicies, id, updates, NULLABLE_FIELDS.ChallengePolicy);
  }

  // QR Code Nonce Management (Replay Protection)
  async createQrCodeNonce(insertNonce: InsertQrCodeNonce): Promise<QrCodeNonce> {
    const nonce: QrCodeNonce = {
      nonce: insertNonce.nonce,
      challengeId: insertNonce.challengeId,
      createdAt: new Date(),
      expiresAt: new Date(insertNonce.expiresAt),
      usedAt: insertNonce.usedAt ? new Date(insertNonce.usedAt) : null,
      ipAddress: nullifyUndefined(insertNonce.ipAddress),
      userAgent: nullifyUndefined(insertNonce.userAgent),
    };
    this.qrCodeNonces.set(insertNonce.nonce, nonce);
    return nonce;
  }

  async markNonceAsUsed(nonce: string, ipAddress?: string, userAgent?: string): Promise<QrCodeNonce | undefined> {
    const existingNonce = this.qrCodeNonces.get(nonce);
    if (!existingNonce) {
      return undefined;
    }

    const updatedNonce: QrCodeNonce = {
      ...existingNonce,
      usedAt: new Date(),
      ipAddress: ipAddress || existingNonce.ipAddress,
      userAgent: userAgent || existingNonce.userAgent,
    };

    this.qrCodeNonces.set(nonce, updatedNonce);
    return updatedNonce;
  }

  async isNonceUsed(nonce: string): Promise<boolean> {
    const existingNonce = this.qrCodeNonces.get(nonce);
    return existingNonce?.usedAt !== null;
  }

  async isNonceValid(nonce: string): Promise<boolean> {
    const existingNonce = this.qrCodeNonces.get(nonce);
    if (!existingNonce) {
      return false;
    }

    // Check if already used
    if (existingNonce.usedAt) {
      return false;
    }

    // Check if expired
    const now = new Date();
    if (existingNonce.expiresAt < now) {
      return false;
    }

    return true;
  }

  async cleanupExpiredNonces(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    for (const [nonceKey, nonceValue] of Array.from(this.qrCodeNonces.entries())) {
      if (nonceValue.expiresAt < now) {
        this.qrCodeNonces.delete(nonceKey);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  // === ICAL FEED TOKENS - SECURE PERSONAL CALENDAR AUTHENTICATION ===
  async getIcalFeedToken(id: string): Promise<IcalFeedToken | undefined> {
    return this.icalFeedTokens.get(id);
  }

  async getIcalFeedTokenByToken(token: string): Promise<IcalFeedToken | undefined> {
    return Array.from(this.icalFeedTokens.values()).find(
      feedToken => feedToken.token === token && feedToken.isActive && !feedToken.revokedAt
    );
  }

  async getIcalFeedTokensByPlayer(playerId: string): Promise<IcalFeedToken[]> {
    return Array.from(this.icalFeedTokens.values()).filter(
      feedToken => feedToken.playerId === playerId
    );
  }

  async createIcalFeedToken(insertToken: InsertIcalFeedToken): Promise<IcalFeedToken> {
    const id = randomUUID();
    const feedToken: IcalFeedToken = {
      id,
      playerId: insertToken.playerId,
      token: insertToken.token,
      name: nullifyUndefined(insertToken.name),
      isActive: insertToken.isActive ?? true,
      lastUsedAt: null,
      useCount: 0,
      hallId: nullifyUndefined(insertToken.hallId),
      includeCompleted: insertToken.includeCompleted ?? false,
      createdAt: new Date(),
      expiresAt: insertToken.expiresAt ? new Date(insertToken.expiresAt) : null,
      revokedAt: null,
      revokedBy: nullifyUndefined(insertToken.revokedBy),
      revokeReason: nullifyUndefined(insertToken.revokeReason),
    };
    this.icalFeedTokens.set(id, feedToken);
    return feedToken;
  }

  async updateIcalFeedToken(id: string, updates: Partial<IcalFeedToken>): Promise<IcalFeedToken | undefined> {
    return updateMapRecord(this.icalFeedTokens, id, updates, NULLABLE_FIELDS.IcalFeedToken);
  }

  async revokeIcalFeedToken(id: string, revokedBy: string, reason?: string): Promise<IcalFeedToken | undefined> {
    const updates: Partial<IcalFeedToken> = {
      isActive: false,
      revokedAt: new Date(),
      revokedBy,
      revokeReason: reason || null,
    };
    return this.updateIcalFeedToken(id, updates);
  }

  async markTokenUsed(token: string): Promise<boolean> {
    const feedToken = await this.getIcalFeedTokenByToken(token);
    if (!feedToken) {
      return false;
    }

    const updates: Partial<IcalFeedToken> = {
      lastUsedAt: new Date(),
      useCount: (feedToken.useCount || 0) + 1,
    };

    const updated = await this.updateIcalFeedToken(feedToken.id, updates);
    return !!updated;
  }

  async cleanupExpiredTokens(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    for (const [tokenId, tokenValue] of Array.from(this.icalFeedTokens.entries())) {
      if (tokenValue.expiresAt && tokenValue.expiresAt < now) {
        this.icalFeedTokens.delete(tokenId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  // === PAYMENT METHODS ===
  async getPaymentMethod(id: string): Promise<PaymentMethod | undefined> {
    return this.paymentMethods.get(id);
  }

  async getPaymentMethodsByUser(userId: string): Promise<PaymentMethod[]> {
    return Array.from(this.paymentMethods.values()).filter(pm => pm.userId === userId);
  }

  async getDefaultPaymentMethod(userId: string): Promise<PaymentMethod | undefined> {
    return Array.from(this.paymentMethods.values()).find(pm => pm.userId === userId && pm.isDefault);
  }

  async createPaymentMethod(insertPaymentMethod: InsertPaymentMethod): Promise<PaymentMethod> {
    const id = randomUUID();
    const paymentMethod: PaymentMethod = {
      id,
      userId: insertPaymentMethod.userId,
      stripePaymentMethodId: insertPaymentMethod.stripePaymentMethodId,
      stripeSetupIntentId: nullifyUndefined(insertPaymentMethod.stripeSetupIntentId),
      type: insertPaymentMethod.type,
      brand: nullifyUndefined(insertPaymentMethod.brand),
      last4: nullifyUndefined(insertPaymentMethod.last4),
      expiryMonth: nullifyUndefined(insertPaymentMethod.expiryMonth),
      expiryYear: nullifyUndefined(insertPaymentMethod.expiryYear),
      isDefault: insertPaymentMethod.isDefault ?? false,
      isActive: insertPaymentMethod.isActive ?? true,
      metadata: nullifyUndefined(insertPaymentMethod.metadata),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.paymentMethods.set(id, paymentMethod);
    return paymentMethod;
  }

  async updatePaymentMethod(id: string, updates: Partial<PaymentMethod>): Promise<PaymentMethod | undefined> {
    return updateMapRecord(this.paymentMethods, id, { ...updates, updatedAt: new Date() }, NULLABLE_FIELDS.PaymentMethod);
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<PaymentMethod | undefined> {
    // First, remove default from all user's payment methods
    const userPaymentMethods = Array.from(this.paymentMethods.entries());
    for (const [id, pm] of userPaymentMethods) {
      if (pm.userId === userId) {
        this.paymentMethods.set(id, { ...pm, isDefault: false, updatedAt: new Date() });
      }
    }

    // Set the specified payment method as default
    const paymentMethod = this.paymentMethods.get(paymentMethodId);
    if (paymentMethod && paymentMethod.userId === userId) {
      const updatedPaymentMethod = { ...paymentMethod, isDefault: true, updatedAt: new Date() };
      this.paymentMethods.set(paymentMethodId, updatedPaymentMethod);
      return updatedPaymentMethod;
    }
    return undefined;
  }

  async deactivatePaymentMethod(id: string): Promise<PaymentMethod | undefined> {
    return this.updatePaymentMethod(id, { isActive: false });
  }

  // === STAKES HOLDS ===
  async getStakesHold(id: string): Promise<StakesHold | undefined> {
    return this.stakesHolds.get(id);
  }

  async getStakesHoldsByChallenge(challengeId: string): Promise<StakesHold[]> {
    return Array.from(this.stakesHolds.values()).filter(hold => hold.challengeId === challengeId);
  }

  async getStakesHoldsByPlayer(playerId: string): Promise<StakesHold[]> {
    return Array.from(this.stakesHolds.values()).filter(hold => hold.playerId === playerId);
  }

  async createStakesHold(insertStakesHold: InsertStakesHold): Promise<StakesHold> {
    const id = randomUUID();
    const stakesHold: StakesHold = {
      id,
      challengeId: insertStakesHold.challengeId,
      playerId: insertStakesHold.playerId,
      amount: insertStakesHold.amount,
      status: insertStakesHold.status ?? "held",
      stripePaymentIntentId: insertStakesHold.stripePaymentIntentId,
      capturedAt: nullifyUndefined(insertStakesHold.capturedAt),
      holdExpiresAt: new Date(insertStakesHold.holdExpiresAt || Date.now() + 24 * 60 * 60 * 1000),
      releasedAt: nullifyUndefined(insertStakesHold.releasedAt),
      captureReason: nullifyUndefined(insertStakesHold.captureReason),
      releaseReason: nullifyUndefined(insertStakesHold.releaseReason),
      metadata: nullifyUndefined(insertStakesHold.metadata),
      createdAt: new Date(),
    };
    this.stakesHolds.set(id, stakesHold);
    return stakesHold;
  }

  async updateStakesHold(id: string, updates: Partial<StakesHold>): Promise<StakesHold | undefined> {
    return updateMapRecord(this.stakesHolds, id, updates, NULLABLE_FIELDS.StakesHold);
  }

  async releaseStakesHold(id: string, reason?: string): Promise<StakesHold | undefined> {
    return this.updateStakesHold(id, {
      status: "released",
      releasedAt: new Date(),
      releaseReason: reason || null
    });
  }

  async captureStakesHold(id: string, reason?: string): Promise<StakesHold | undefined> {
    return this.updateStakesHold(id, {
      status: "captured",
      capturedAt: new Date(),
      captureReason: reason || null
    });
  }

  async getStakesHoldsByStatus(status: string): Promise<StakesHold[]> {
    return Array.from(this.stakesHolds.values()).filter(hold => hold.status === status);
  }

  async getExpiringStakesHolds(hours: number = 24): Promise<StakesHold[]> {
    const expiryThreshold = new Date(Date.now() + hours * 60 * 60 * 1000);
    return Array.from(this.stakesHolds.values()).filter(hold => {
      // Check if hold will expire within the specified hours
      const createdTime = new Date(hold.createdAt);
      const expiryTime = new Date(createdTime.getTime() + (24 * 60 * 60 * 1000)); // 24 hour default expiry
      return expiryTime <= expiryThreshold && hold.status === 'held';
    });
  }

  // === NOTIFICATION SYSTEM ===
  async getNotificationSettings(userId: string): Promise<NotificationSettings | undefined> {
    return this.notificationSettings.get(userId);
  }

  async createNotificationSettings(insertSettings: InsertNotificationSettings): Promise<NotificationSettings> {
    const id = randomUUID();
    const settings: NotificationSettings = {
      id,
      userId: insertSettings.userId,
      emailEnabled: insertSettings.emailEnabled ?? true,
      smsEnabled: insertSettings.smsEnabled ?? false,
      pushEnabled: insertSettings.pushEnabled ?? true,
      emailAddress: nullifyUndefined(insertSettings.emailAddress),
      phoneNumber: nullifyUndefined(insertSettings.phoneNumber),
      emailVerified: insertSettings.emailVerified ?? false,
      phoneVerified: insertSettings.phoneVerified ?? false,
      reminderT24h: insertSettings.reminderT24h ?? true,
      reminderT1h: insertSettings.reminderT1h ?? true,
      newChallenges: insertSettings.newChallenges ?? true,
      resultUpdates: insertSettings.resultUpdates ?? true,
      promotional: insertSettings.promotional ?? false,
      weeklyReports: insertSettings.weeklyReports ?? true,
      quietHours: insertSettings.quietHours ?? false,
      quietHoursStart: nullifyUndefined(insertSettings.quietHoursStart),
      quietHoursEnd: nullifyUndefined(insertSettings.quietHoursEnd),
      timezone: nullifyUndefined(insertSettings.timezone),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.notificationSettings.set(settings.userId, settings);
    return settings;
  }

  async updateNotificationSettings(userId: string, updates: Partial<NotificationSettings>): Promise<NotificationSettings | undefined> {
    return updateMapRecord(this.notificationSettings, userId, { ...updates, updatedAt: new Date() }, NULLABLE_FIELDS.NotificationSettings);
  }

  async getNotificationDelivery(id: string): Promise<NotificationDelivery | undefined> {
    return this.notificationDeliveries.get(id);
  }

  async createNotificationDelivery(insertDelivery: InsertNotificationDelivery): Promise<NotificationDelivery> {
    const id = randomUUID();
    const delivery: NotificationDelivery = {
      id,
      userId: insertDelivery.userId,
      challengeId: nullifyUndefined(insertDelivery.challengeId),
      type: insertDelivery.type,
      channel: insertDelivery.channel,
      recipient: insertDelivery.recipient,
      subject: insertDelivery.subject,
      content: insertDelivery.content,
      status: insertDelivery.status ?? "pending",
      providerId: nullifyUndefined(insertDelivery.providerId),
      errorMessage: nullifyUndefined(insertDelivery.errorMessage),
      sentAt: nullifyUndefined(insertDelivery.sentAt),
      deliveredAt: nullifyUndefined(insertDelivery.deliveredAt),
      metadata: nullifyUndefined(insertDelivery.metadata),
      createdAt: new Date(),
    };
    this.notificationDeliveries.set(id, delivery);
    return delivery;
  }

  async updateNotificationDelivery(id: string, updates: Partial<NotificationDelivery>): Promise<NotificationDelivery | undefined> {
    return updateMapRecord(this.notificationDeliveries, id, updates, NULLABLE_FIELDS.NotificationDelivery);
  }

  async getNotificationDeliveriesByUser(userId: string): Promise<NotificationDelivery[]> {
    return Array.from(this.notificationDeliveries.values()).filter(delivery => delivery.userId === userId);
  }

  async getNotificationDeliveriesByChallenge(challengeId: string): Promise<NotificationDelivery[]> {
    return Array.from(this.notificationDeliveries.values()).filter(delivery => delivery.challengeId === challengeId);
  }

  async getNotificationDeliveriesByStatus(status: string): Promise<NotificationDelivery[]> {
    return Array.from(this.notificationDeliveries.values()).filter(delivery => delivery.status === status);
  }

  async markNotificationDelivered(id: string, providerId?: string): Promise<NotificationDelivery | undefined> {
    return this.updateNotificationDelivery(id, {
      status: "delivered",
      deliveredAt: new Date(),
      providerId: providerId || null
    });
  }

  async markNotificationFailed(id: string, errorMessage: string): Promise<NotificationDelivery | undefined> {
    return this.updateNotificationDelivery(id, {
      status: "failed",
      errorMessage
    });
  }

  // === DISPUTE MANAGEMENT ===
  async getDisputeResolution(id: string): Promise<DisputeResolution | undefined> {
    return this.disputeResolutions.get(id);
  }

  async createDisputeResolution(insertDispute: InsertDisputeResolution): Promise<DisputeResolution> {
    const id = randomUUID();
    const dispute: DisputeResolution = {
      id,
      challengeId: insertDispute.challengeId,
      challengeFeeId: nullifyUndefined(insertDispute.challengeFeeId),
      filedBy: insertDispute.filedBy,
      filedAgainst: nullifyUndefined(insertDispute.filedAgainst),
      disputeType: insertDispute.disputeType,
      evidenceNotes: nullifyUndefined(insertDispute.evidenceNotes),
      status: insertDispute.status ?? "open",
      resolution: nullifyUndefined(insertDispute.resolution),
      resolvedBy: nullifyUndefined(insertDispute.resolvedBy),
      resolutionAction: nullifyUndefined(insertDispute.resolutionAction),
      operatorNotes: nullifyUndefined(insertDispute.operatorNotes),
      resolvedAt: nullifyUndefined(insertDispute.resolvedAt),
      auditLog: nullifyUndefined(insertDispute.auditLog),
      createdAt: new Date(),
    };
    this.disputeResolutions.set(id, dispute);
    return dispute;
  }

  async updateDisputeResolution(id: string, updates: Partial<DisputeResolution>): Promise<DisputeResolution | undefined> {
    return updateMapRecord(this.disputeResolutions, id, updates, NULLABLE_FIELDS.DisputeResolution);
  }

  async resolveDispute(id: string, resolution: string, resolvedBy: string, action?: string): Promise<DisputeResolution | undefined> {
    return this.updateDisputeResolution(id, {
      status: "resolved",
      resolution,
      resolvedBy,
      resolutionAction: action || null,
      resolvedAt: new Date()
    });
  }

  async getDisputesByChallenge(challengeId: string): Promise<DisputeResolution[]> {
    return Array.from(this.disputeResolutions.values()).filter(dispute => dispute.challengeId === challengeId);
  }

  async getDisputesByPlayer(playerId: string): Promise<DisputeResolution[]> {
    return Array.from(this.disputeResolutions.values()).filter(dispute =>
      dispute.filedBy === playerId || dispute.filedAgainst === playerId
    );
  }

  async getDisputeResolutionsByChallenge(challengeId: string): Promise<DisputeResolution[]> {
    return Array.from(this.disputeResolutions.values()).filter(dispute => dispute.challengeId === challengeId);
  }

  async getDisputeResolutionsByPlayer(playerId: string): Promise<DisputeResolution[]> {
    return Array.from(this.disputeResolutions.values()).filter(dispute =>
      dispute.filedBy === playerId || dispute.filedAgainst === playerId
    );
  }

  async getDisputeResolutionsByStatus(status: string): Promise<DisputeResolution[]> {
    return Array.from(this.disputeResolutions.values()).filter(dispute => dispute.status === status);
  }

  async addDisputeEvidence(id: string, evidenceUrls: string[], evidenceTypes: string[], notes?: string): Promise<DisputeResolution | undefined> {
    const dispute = this.disputeResolutions.get(id);
    if (!dispute) return undefined;

    const evidenceEntry = {
      urls: evidenceUrls,
      types: evidenceTypes,
      notes: notes || '',
      addedAt: new Date().toISOString()
    };

    const currentAuditLog = dispute.auditLog ? JSON.parse(dispute.auditLog) : [];
    currentAuditLog.push({
      action: 'evidence_added',
      timestamp: new Date().toISOString(),
      evidence: evidenceEntry
    });

    return this.updateDisputeResolution(id, {
      auditLog: JSON.stringify(currentAuditLog)
    });
  }

  // === ANTI-ABUSE SYSTEM ===
  async getPlayerCooldown(id: string): Promise<PlayerCooldown | undefined> {
    return this.playerCooldowns.get(id);
  }

  async createPlayerCooldown(insertCooldown: InsertPlayerCooldown): Promise<PlayerCooldown> {
    const id = randomUUID();
    const cooldown: PlayerCooldown = {
      id,
      playerId: insertCooldown.playerId,
      cooldownType: insertCooldown.cooldownType,
      reason: insertCooldown.reason,
      durationMinutes: insertCooldown.durationMinutes,
      appliedBy: insertCooldown.appliedBy,
      endsAt: new Date(insertCooldown.endsAt),
      liftedAt: nullifyUndefined(insertCooldown.liftedAt),
      liftedBy: nullifyUndefined(insertCooldown.liftedBy),
      liftReason: nullifyUndefined(insertCooldown.liftReason),
      isActive: insertCooldown.isActive ?? true,
      metadata: nullifyUndefined(insertCooldown.metadata),
      createdAt: new Date(),
    };
    this.playerCooldowns.set(id, cooldown);
    return cooldown;
  }

  async updatePlayerCooldown(id: string, updates: Partial<PlayerCooldown>): Promise<PlayerCooldown | undefined> {
    return updateMapRecord(this.playerCooldowns, id, updates, NULLABLE_FIELDS.PlayerCooldown);
  }

  async checkPlayerEligibility(playerId: string): Promise<{ eligible: boolean; reason?: string; cooldownId?: string }> {
    const now = new Date();
    const activeCooldowns = Array.from(this.playerCooldowns.values()).filter(cooldown =>
      cooldown.playerId === playerId &&
      cooldown.isActive &&
      cooldown.endsAt > now &&
      !cooldown.liftedAt
    );

    if (activeCooldowns.length > 0) {
      const cooldown = activeCooldowns[0];
      return {
        eligible: false,
        reason: cooldown.reason,
        cooldownId: cooldown.id
      };
    }

    return { eligible: true };
  }

  async getPlayerCooldownsByPlayer(playerId: string): Promise<PlayerCooldown[]> {
    return Array.from(this.playerCooldowns.values()).filter(cooldown => cooldown.playerId === playerId);
  }

  async getActiveCooldowns(): Promise<PlayerCooldown[]> {
    const now = new Date();
    return Array.from(this.playerCooldowns.values()).filter(cooldown =>
      cooldown.isActive &&
      cooldown.endsAt > now &&
      !cooldown.liftedAt
    );
  }

  async getExpiringCooldowns(hours: number = 24): Promise<PlayerCooldown[]> {
    const now = new Date();
    const expiryThreshold = new Date(now.getTime() + hours * 60 * 60 * 1000);
    return Array.from(this.playerCooldowns.values()).filter(cooldown =>
      cooldown.isActive &&
      cooldown.endsAt <= expiryThreshold &&
      cooldown.endsAt > now &&
      !cooldown.liftedAt
    );
  }

  async liftPlayerCooldown(id: string, liftedBy: string, reason: string): Promise<PlayerCooldown | undefined> {
    return this.updatePlayerCooldown(id, {
      isActive: false,
      liftedAt: new Date(),
      liftedBy,
      liftReason: reason
    });
  }

  async getDeviceAttestation(id: string): Promise<DeviceAttestation | undefined> {
    return this.deviceAttestations.get(id);
  }

  async createDeviceAttestation(insertAttestation: InsertDeviceAttestation): Promise<DeviceAttestation> {
    const id = randomUUID();
    const attestation: DeviceAttestation = {
      id,
      challengeId: insertAttestation.challengeId,
      playerId: insertAttestation.playerId,
      deviceFingerprint: insertAttestation.deviceFingerprint,
      attestationType: insertAttestation.attestationType,
      geolocation: nullifyUndefined(insertAttestation.geolocation),
      distanceFromHall: nullifyUndefined(insertAttestation.distanceFromHall),
      ipAddress: nullifyUndefined(insertAttestation.ipAddress),
      userAgent: nullifyUndefined(insertAttestation.userAgent),
      scannerStaffId: nullifyUndefined(insertAttestation.scannerStaffId),
      verificationStatus: insertAttestation.verificationStatus ?? "pending",
      createdAt: new Date(),
    };
    this.deviceAttestations.set(id, attestation);
    return attestation;
  }

  async getDeviceAttestationsByPlayer(playerId: string): Promise<DeviceAttestation[]> {
    return Array.from(this.deviceAttestations.values()).filter(
      attestation => attestation.playerId === playerId
    );
  }

  async getDeviceAttestationsByChallenge(challengeId: string): Promise<DeviceAttestation[]> {
    return Array.from(this.deviceAttestations.values()).filter(
      attestation => attestation.challengeId === challengeId
    );
  }

  async getHighRiskAttestations(threshold: number = 0.8): Promise<DeviceAttestation[]> {
    return Array.from(this.deviceAttestations.values()).filter(
      attestation => (attestation.riskScore || 0) >= threshold
    );
  }

  // === JOB QUEUE & SYSTEM METRICS ===
  async getJob(id: string): Promise<JobQueue | undefined> {
    return this.jobQueue.get(id);
  }

  async createJob(insertJob: InsertJobQueue): Promise<JobQueue> {
    const id = randomUUID();
    const job: JobQueue = {
      id,
      jobType: insertJob.jobType,
      status: insertJob.status ?? "pending",
      priority: insertJob.priority ?? 5,
      payload: insertJob.payload,
      maxAttempts: insertJob.maxAttempts ?? 3,
      attempts: insertJob.attempts ?? 0,
      processedBy: nullifyUndefined(insertJob.processedBy),
      scheduledFor: new Date(insertJob.scheduledFor),
      startedAt: nullifyUndefined(insertJob.startedAt),
      completedAt: nullifyUndefined(insertJob.completedAt),
      errorMessage: nullifyUndefined(insertJob.errorMessage),
      result: nullifyUndefined(insertJob.result),
      metadata: nullifyUndefined(insertJob.metadata),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobQueue.set(id, job);
    return job;
  }

  async updateJob(id: string, updates: Partial<JobQueue>): Promise<JobQueue | undefined> {
    return updateMapRecord(this.jobQueue, id, updates, NULLABLE_FIELDS.JobQueue);
  }

  async markJobCompleted(id: string, result?: any): Promise<JobQueue | undefined> {
    return this.updateJob(id, {
      status: "completed",
      completedAt: new Date(),
      result: result || null
    });
  }

  async getJobsByType(jobType: string): Promise<JobQueue[]> {
    return Array.from(this.jobQueue.values()).filter(job => job.jobType === jobType);
  }

  async getJobsByStatus(status: string): Promise<JobQueue[]> {
    return Array.from(this.jobQueue.values()).filter(job => job.status === status);
  }

  async getPendingJobs(limit: number = 50): Promise<JobQueue[]> {
    return Array.from(this.jobQueue.values())
      .filter(job => job.status === "pending")
      .sort((a, b) => {
        // Sort by priority (lower number = higher priority), then by scheduled time
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
      })
      .slice(0, limit);
  }

  async getFailedJobs(limit: number = 50): Promise<JobQueue[]> {
    return Array.from(this.jobQueue.values())
      .filter(job => job.status === "failed")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async markJobStarted(id: string, processedBy: string): Promise<JobQueue | undefined> {
    const job = this.jobQueue.get(id);
    if (!job) return undefined;

    return this.updateJob(id, {
      status: "running",
      startedAt: new Date(),
      processedBy,
      attempts: (job.attempts || 0) + 1
    });
  }

  async markJobFailed(id: string, errorMessage: string): Promise<JobQueue | undefined> {
    const job = this.jobQueue.get(id);
    if (!job) return undefined;

    const currentAttempts = (job.attempts || 0);
    const shouldRetry = currentAttempts < (job.maxAttempts || 3);

    return this.updateJob(id, {
      status: shouldRetry ? "pending" : "failed",
      errorMessage,
      completedAt: shouldRetry ? null : new Date()
    });
  }

  async requeueJob(id: string): Promise<JobQueue | undefined> {
    return this.updateJob(id, {
      status: "pending",
      startedAt: null,
      completedAt: null,
      errorMessage: null,
      result: null,
      processedBy: null
    });
  }

  async cleanupCompletedJobs(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    for (const [jobId, job] of Array.from(this.jobQueue.entries())) {
      if ((job.status === "completed" || job.status === "failed") &&
        job.completedAt &&
        new Date(job.completedAt) < cutoffDate) {
        this.jobQueue.delete(jobId);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  async getSystemMetric(id: string): Promise<SystemMetric | undefined> {
    return this.systemMetrics.get(id);
  }

  async createSystemMetric(insertMetric: InsertSystemMetric): Promise<SystemMetric> {
    const id = randomUUID();
    const metric: SystemMetric = {
      id,
      value: insertMetric.value,
      metricType: insertMetric.metricType,
      timeWindow: insertMetric.timeWindow,
      windowStart: new Date(insertMetric.windowStart),
      windowEnd: new Date(insertMetric.windowEnd),
      hallId: nullifyUndefined(insertMetric.hallId),
      metadata: nullifyUndefined(insertMetric.metadata),
      count: insertMetric.count ?? null,
      createdAt: new Date(),
    };
    this.systemMetrics.set(id, metric);
    return metric;
  }

  async getSystemMetricsByType(metricType: string, hallId?: string): Promise<SystemMetric[]> {
    return Array.from(this.systemMetrics.values()).filter(metric => {
      if (metric.metricType !== metricType) return false;
      if (hallId && metric.hallId !== hallId) return false;
      return true;
    });
  }

  async getSystemMetricsByTimeWindow(windowStart: Date, windowEnd: Date, metricType?: string): Promise<SystemMetric[]> {
    return Array.from(this.systemMetrics.values()).filter(metric => {
      const metricWindowStart = new Date(metric.windowStart);
      if (metricWindowStart < windowStart || metricWindowStart > windowEnd) return false;
      if (metricType && metric.metricType !== metricType) return false;
      return true;
    });
  }

  async aggregateMetrics(metricType: string, timeWindow: string, startDate: Date, endDate: Date): Promise<SystemMetric[]> {
    const metrics = await this.getSystemMetricsByTimeWindow(startDate, endDate, metricType);
    // For now, just return the filtered metrics. In a real implementation,
    // this would aggregate values by time windows (hourly, daily, etc.)
    return metrics;
  }

  async getSystemAlert(id: string): Promise<SystemAlert | undefined> {
    return this.systemAlerts.get(id);
  }

  async createSystemAlert(insertAlert: InsertSystemAlert): Promise<SystemAlert> {
    const id = randomUUID();
    const alert: SystemAlert = {
      id,
      message: insertAlert.message,
      alertType: insertAlert.alertType,
      condition: insertAlert.condition,
      threshold: insertAlert.threshold,
      severity: nullifyUndefined(insertAlert.severity),
      currentValue: nullifyUndefined(insertAlert.currentValue),
      isActive: insertAlert.isActive ?? true,
      isFiring: insertAlert.isFiring ?? false,
      lastTriggered: insertAlert.lastTriggered ? new Date(insertAlert.lastTriggered) : null,
      metadata: nullifyUndefined(insertAlert.metadata),
      createdAt: new Date(),
    };
    this.systemAlerts.set(id, alert);
    return alert;
  }

  async updateSystemAlert(id: string, updates: Partial<SystemAlert>): Promise<SystemAlert | undefined> {
    return updateMapRecord(this.systemAlerts, id, updates, NULLABLE_FIELDS.SystemAlert);
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<SystemAlert | undefined> {
    return this.updateSystemAlert(id, {
      isAcknowledged: true,
      acknowledgedBy,
      acknowledgedAt: new Date()
    });
  }

  async getSystemAlertsByType(alertType: string): Promise<SystemAlert[]> {
    return Array.from(this.systemAlerts.values()).filter(alert => alert.alertName === alertType);
  }

  async getActiveAlerts(): Promise<SystemAlert[]> {
    return Array.from(this.systemAlerts.values()).filter(alert => alert.isAcknowledged === false);
  }

  async getFiringAlerts(): Promise<SystemAlert[]> {
    return Array.from(this.systemAlerts.values()).filter(alert => alert.severity === "critical");
  }

  async triggerAlert(alertId: string): Promise<SystemAlert | undefined> {
    return this.updateSystemAlert(alertId, {
      lastTriggered: new Date()
    });
  }

  async resolveAlert(alertId: string, resolvedBy: string): Promise<SystemAlert | undefined> {
    return this.updateSystemAlert(alertId, {
      isAcknowledged: true,
      acknowledgedBy: resolvedBy,
      acknowledgedAt: new Date()
    });
  }

  // === AI COACH TRAINING ANALYTICS ===
  // These methods are not implemented in MemStorage - use DatabaseStorage instead

  async createTrainingSession(session: InsertSessionAnalytics): Promise<SelectSessionAnalytics> {
    throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
  }

  async getTrainingSession(sessionId: string): Promise<SelectSessionAnalytics | null> {
    throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
  }

  async getPlayerSessions(playerId: string, limit?: number): Promise<SelectSessionAnalytics[]> {
    throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
  }

  async recordShots(sessionId: string, shots: InsertShot[]): Promise<SelectShot[]> {
    throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
  }

  async getSessionShots(sessionId: string): Promise<SelectShot[]> {
    throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
  }

  async calculateMonthlyScores(period: string): Promise<void> {
    throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
  }

  async getHallLeaderboard(hallId: string, period: string): Promise<SelectLadderTrainingScore[]> {
    throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
  }

  async getPlayerTrainingScore(playerId: string, period: string): Promise<SelectLadderTrainingScore | null> {
    throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
  }

  async createReward(reward: InsertSubscriptionReward): Promise<SelectSubscriptionReward> {
    throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
  }

  async getRewardsForPeriod(period: string): Promise<SelectSubscriptionReward[]> {
    throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
  }

  async markRewardApplied(rewardId: string, stripeCouponId: string): Promise<void> {
    throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
  }

}

// Database storage implementation using Drizzle ORM
export class DatabaseStorage implements IStorage {
  // Core player operations using real database
  async getPlayers(): Promise<Player[]> {
    return await db.select().from(playersTable);
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    const results = await db.select().from(playersTable).where(eq(playersTable.id, id));
    return results[0];
  }

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const results = await db.insert(playersTable).values(player).returning();
    return results[0];
  }

  async updatePlayer(id: string, updates: Partial<InsertPlayer>): Promise<Player | undefined> {
    const results = await db.update(playersTable).set(updates).where(eq(playersTable.id, id)).returning();
    return results[0];
  }

  async deletePlayer(id: string): Promise<boolean> {
    const result = await db.delete(playersTable).where(eq(playersTable.id, id));
    return result.rowCount > 0;
  }

  async getPlayerByUserId(userId: string): Promise<Player | undefined> {
    const results = await db.select().from(playersTable).where(eq(playersTable.userId, userId));
    return results[0];
  }

  async getAllPlayers(): Promise<Player[]> {
    return await this.getPlayers();
  }

  // User management operations using real database  
  async getUser(id: string): Promise<any | undefined> {
    const results = await db.select().from(usersTable).where(eq(usersTable.id, id));
    return results[0];
  }

  async getUserByEmail(email: string): Promise<any | undefined> {
    const results = await db.select().from(usersTable).where(eq(usersTable.email, email));
    return results[0];
  }

  async createUser(user: any): Promise<any> {
    const safeUser = this.sanitizeUserFields(user);
    const results = await db.insert(usersTable).values(safeUser).returning();
    return results[0];
  }

  async updateUser(id: string, updates: any): Promise<any | undefined> {
    const safeUpdates = this.sanitizeUserFields(updates);
    const results = await db.update(usersTable).set(safeUpdates).where(eq(usersTable.id, id)).returning();
    return results[0];
  }

  async upsertUser(userData: any): Promise<any> {
    if (!userData.email) {
      throw new Error("Email is required to create or update a user");
    }
    const existingUser = await this.getUserByEmail(userData.email);
    if (existingUser) {
      return await this.updateUser(existingUser.id, userData) || existingUser;
    } else {
      return await this.createUser({
        email: userData.email,
        name: userData.name,
        globalRole: userData.globalRole || "PLAYER",
        ...userData
      });
    }
  }

  private sanitizeUserFields(data: any): any {
    const validColumns = [
      "id", "email", "name", "passwordHash", "twoFactorEnabled", "twoFactorSecret",
      "phoneNumber", "lastLoginAt", "loginAttempts", "lockedUntil", "globalRole",
      "role", "profileComplete", "onboardingComplete", "accountStatus",
      "stripeCustomerId", "stripeConnectId", "payoutShareBps", "hallName",
      "city", "state", "subscriptionTier", "trusteeId", "createdAt", "updatedAt"
    ];
    const sanitized: any = {};
    for (const key of validColumns) {
      if (key in data && data[key] !== undefined) {
        sanitized[key] = data[key];
      }
    }
    return sanitized;
  }

  async getUserByStripeConnectId(stripeConnectId: string): Promise<any | undefined> {
    const results = await db.select().from(usersTable).where(eq(usersTable.stripeConnectId, stripeConnectId));
    return results[0];
  }

  async getAllUsers(): Promise<any[]> {
    return await db.select().from(usersTable);
  }

  async getStaffUsers(): Promise<any[]> {
    return await db.select().from(usersTable).where(eq(usersTable.globalRole, "STAFF"));
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(usersTable).where(eq(usersTable.id, id));
    return result.rowCount > 0;
  }

  // Challenge date range query for conflict checking
  async getChallengesByDateRange(startDate: Date, endDate: Date): Promise<Challenge[]> {
    // For now, return empty array since we haven't implemented challenges in database yet
    return [];
  }

  // Challenge fee status query
  async getChallengeFeesByStatus(status: string): Promise<ChallengeFee[]> {
    // For now, return empty array since we haven't implemented challenge fees in database yet
    return [];
  }

  // For other methods, use MemStorage temporarily to maintain functionality
  private memStorage = new MemStorage();

  // Forward all other methods to MemStorage for now
  async getMatches(): Promise<Match[]> { return this.memStorage.getMatches(); }
  async getMatch(id: string): Promise<Match | undefined> { return this.memStorage.getMatch(id); }
  async createMatch(match: InsertMatch): Promise<Match> { return this.memStorage.createMatch(match); }
  async updateMatch(id: string, updates: Partial<InsertMatch>): Promise<Match | undefined> { return this.memStorage.updateMatch(id, updates); }
  async deleteMatch(id: string): Promise<boolean> { return this.memStorage.deleteMatch(id); }

  async getTournaments(): Promise<Tournament[]> { return this.memStorage.getTournaments(); }
  async getTournament(id: string): Promise<Tournament | undefined> { return this.memStorage.getTournament(id); }
  async createTournament(tournament: InsertTournament): Promise<Tournament> { return this.memStorage.createTournament(tournament); }
  async updateTournament(id: string, updates: Partial<InsertTournament>): Promise<Tournament | undefined> { return this.memStorage.updateTournament(id, updates); }
  async deleteTournament(id: string): Promise<boolean> { return this.memStorage.deleteTournament(id); }

  // Tournament Calcuttas delegation methods  
  async getTournamentCalcutta(id: string): Promise<TournamentCalcutta | undefined> { return this.memStorage.getTournamentCalcutta(id); }
  async getTournamentCalcuttas(): Promise<TournamentCalcutta[]> { return this.memStorage.getTournamentCalcuttas(); }
  async getTournamentCalcuttasByTournament(tournamentId: string): Promise<TournamentCalcutta[]> { return this.memStorage.getTournamentCalcuttasByTournament(tournamentId); }
  async createTournamentCalcutta(calcutta: InsertTournamentCalcutta): Promise<TournamentCalcutta> { return this.memStorage.createTournamentCalcutta(calcutta); }
  async updateTournamentCalcutta(id: string, updates: Partial<TournamentCalcutta>): Promise<TournamentCalcutta | undefined> { return this.memStorage.updateTournamentCalcutta(id, updates); }

  // Calcutta Bids delegation methods
  async getCalcuttaBid(id: string): Promise<CalcuttaBid | undefined> { return this.memStorage.getCalcuttaBid(id); }
  async getCalcuttaBids(): Promise<CalcuttaBid[]> { return this.memStorage.getCalcuttaBids(); }
  async getCalcuttaBidsByCalcutta(calcuttaId: string): Promise<CalcuttaBid[]> { return this.memStorage.getCalcuttaBidsByCalcutta(calcuttaId); }
  async getCalcuttaBidsByBidder(bidderId: string): Promise<CalcuttaBid[]> { return this.memStorage.getCalcuttaBidsByBidder(bidderId); }
  async createCalcuttaBid(bid: InsertCalcuttaBid): Promise<CalcuttaBid> { return this.memStorage.createCalcuttaBid(bid); }
  async updateCalcuttaBid(id: string, updates: Partial<CalcuttaBid>): Promise<CalcuttaBid | undefined> { return this.memStorage.updateCalcuttaBid(id, updates); }

  // Season Predictions delegation methods
  async getSeasonPrediction(id: string): Promise<SeasonPrediction | undefined> { return this.memStorage.getSeasonPrediction(id); }
  async getSeasonPredictions(): Promise<SeasonPrediction[]> { return this.memStorage.getSeasonPredictions(); }
  async getSeasonPredictionsByStatus(status: string): Promise<SeasonPrediction[]> { return this.memStorage.getSeasonPredictionsByStatus(status); }
  async createSeasonPrediction(prediction: InsertSeasonPrediction): Promise<SeasonPrediction> { return this.memStorage.createSeasonPrediction(prediction); }
  async updateSeasonPrediction(id: string, updates: Partial<SeasonPrediction>): Promise<SeasonPrediction | undefined> { return this.memStorage.updateSeasonPrediction(id, updates); }

  // Prediction Entries delegation methods
  async getPredictionEntry(id: string): Promise<PredictionEntry | undefined> { return this.memStorage.getPredictionEntry(id); }
  async getPredictionEntries(): Promise<PredictionEntry[]> { return this.memStorage.getPredictionEntries(); }
  async getPredictionEntriesByPrediction(predictionId: string): Promise<PredictionEntry[]> { return this.memStorage.getPredictionEntriesByPrediction(predictionId); }
  async getPredictionEntriesByPredictor(predictorId: string): Promise<PredictionEntry[]> { return this.memStorage.getPredictionEntriesByPredictor(predictorId); }
  async createPredictionEntry(entry: InsertPredictionEntry): Promise<PredictionEntry> { return this.memStorage.createPredictionEntry(entry); }
  async updatePredictionEntry(id: string, updates: Partial<PredictionEntry>): Promise<PredictionEntry | undefined> { return this.memStorage.updatePredictionEntry(id, updates); }

  // Added Money Fund delegation methods
  async getAddedMoneyFund(id: string): Promise<AddedMoneyFund | undefined> { return this.memStorage.getAddedMoneyFund(id); }
  async getAddedMoneyFunds(): Promise<AddedMoneyFund[]> { return this.memStorage.getAddedMoneyFunds(); }
  async getAddedMoneyFundsBySource(sourceType: string): Promise<AddedMoneyFund[]> { return this.memStorage.getAddedMoneyFundsBySource(sourceType); }
  async getAddedMoneyFundsByTournament(tournamentId: string): Promise<AddedMoneyFund[]> { return this.memStorage.getAddedMoneyFundsByTournament(tournamentId); }
  async createAddedMoneyFund(fund: InsertAddedMoneyFund): Promise<AddedMoneyFund> { return this.memStorage.createAddedMoneyFund(fund); }
  async updateAddedMoneyFund(id: string, updates: Partial<AddedMoneyFund>): Promise<AddedMoneyFund | undefined> { return this.memStorage.updateAddedMoneyFund(id, updates); }

  // Challenge pools - these are critical for the billing system
  async getChallengePools(): Promise<ChallengePool[]> { return this.memStorage.getChallengePools(); }
  async getChallengePool(id: string): Promise<ChallengePool | undefined> { return this.memStorage.getChallengePool(id); }
  async createChallengePool(pool: InsertChallengePool): Promise<ChallengePool> { return this.memStorage.createChallengePool(pool); }
  async updateChallengePool(id: string, updates: Partial<InsertChallengePool>): Promise<ChallengePool | undefined> { return this.memStorage.updateChallengePool(id, updates); }
  async deleteChallengePool(id: string): Promise<boolean> { return this.memStorage.deleteChallengePool(id); }

  // Wallets - critical for financial operations
  async getWallets(): Promise<Wallet[]> { return this.memStorage.getWallets(); }
  async getWallet(id: string): Promise<Wallet | undefined> { return this.memStorage.getWallet(id); }
  async getWalletByPlayerId(playerId: string): Promise<Wallet | undefined> { return this.memStorage.getWalletByPlayerId(playerId); }
  async createWallet(wallet: InsertWallet): Promise<Wallet> { return this.memStorage.createWallet(wallet); }
  async updateWallet(id: string, updates: Partial<InsertWallet>): Promise<Wallet | undefined> { return this.memStorage.deleteWallet(id); }
  async deleteWallet(id: string): Promise<boolean> { return this.memStorage.deleteWallet(id); }

  // Side Pots - critical for side betting system
  async getSidePot(id: string): Promise<SidePot | undefined> { return this.memStorage.getSidePot(id); }
  async getSidePots(): Promise<SidePot[]> { return this.memStorage.getSidePots(); }
  async getAllSidePots(): Promise<SidePot[]> { return this.memStorage.getAllSidePots(); }
  async getSidePotsByMatch(matchId: string): Promise<SidePot[]> { return this.memStorage.getSidePotsByMatch(matchId); }
  async getSidePotsByStatus(status: string): Promise<SidePot[]> { return this.memStorage.getSidePotsByStatus(status); }
  async createSidePot(pot: InsertSidePot): Promise<SidePot> { return this.memStorage.createSidePot(pot); }
  async updateSidePot(id: string, updates: Partial<SidePot>): Promise<SidePot | undefined> { return this.memStorage.updateSidePot(id, updates); }
  async getExpiredDisputePots(now: Date): Promise<SidePot[]> { return this.memStorage.getExpiredDisputePots(now); }

  // Forward all remaining methods to preserve functionality
  async getKellyPools(): Promise<KellyPool[]> { return this.memStorage.getKellyPools(); }
  async getKellyPool(id: string): Promise<KellyPool | undefined> { return this.memStorage.getKellyPool(id); }
  async createKellyPool(kellyPool: InsertKellyPool): Promise<KellyPool> { return this.memStorage.createKellyPool(kellyPool); }
  async updateKellyPool(id: string, updates: Partial<InsertKellyPool>): Promise<KellyPool | undefined> { return this.memStorage.updateKellyPool(id, updates); }
  async deleteKellyPool(id: string): Promise<boolean> { return this.memStorage.deleteKellyPool(id); }

  async getMoneyGames(): Promise<MoneyGame[]> { return this.memStorage.getMoneyGames(); }
  async getMoneyGame(id: string): Promise<MoneyGame | undefined> { return this.memStorage.getMoneyGame(id); }
  async getMoneyGamesByStatus(status: string): Promise<MoneyGame[]> { return this.memStorage.getMoneyGamesByStatus(status); }
  async createMoneyGame(game: InsertMoneyGame): Promise<MoneyGame> { return this.memStorage.createMoneyGame(game); }
  async updateMoneyGame(id: string, updates: Partial<MoneyGame>): Promise<MoneyGame | undefined> { return this.memStorage.updateMoneyGame(id, updates); }
  async deleteMoneyGame(id: string): Promise<boolean> { return this.memStorage.deleteMoneyGame(id); }

  async getBounties(): Promise<Bounty[]> { return this.memStorage.getBounties(); }
  async getBounty(id: string): Promise<Bounty | undefined> { return this.memStorage.getBounty(id); }
  async createBounty(bounty: InsertBounty): Promise<Bounty> { return this.memStorage.createBounty(bounty); }
  async updateBounty(id: string, updates: Partial<InsertBounty>): Promise<Bounty | undefined> { return this.memStorage.updateBounty(id, updates); }
  async deleteBounty(id: string): Promise<boolean> { return this.memStorage.deleteBounty(id); }

  async getCharityEvents(): Promise<CharityEvent[]> { return this.memStorage.getCharityEvents(); }
  async getCharityEvent(id: string): Promise<CharityEvent | undefined> { return this.memStorage.getCharityEvent(id); }
  async createCharityEvent(event: InsertCharityEvent): Promise<CharityEvent> { return this.memStorage.createCharityEvent(event); }
  async updateCharityEvent(id: string, updates: Partial<InsertCharityEvent>): Promise<CharityEvent | undefined> { return this.memStorage.updateCharityEvent(id, updates); }
  async deleteCharityEvent(id: string): Promise<boolean> { return this.memStorage.deleteCharityEvent(id); }

  async getSupportRequests(): Promise<SupportRequest[]> { return this.memStorage.getSupportRequests(); }
  async getSupportRequest(id: string): Promise<SupportRequest | undefined> { return this.memStorage.getSupportRequest(id); }
  async createSupportRequest(request: InsertSupportRequest): Promise<SupportRequest> { return this.memStorage.createSupportRequest(request); }
  async updateSupportRequest(id: string, updates: Partial<InsertSupportRequest>): Promise<SupportRequest | undefined> { return this.memStorage.updateSupportRequest(id, updates); }
  async deleteSupportRequest(id: string): Promise<boolean> { return this.memStorage.deleteSupportRequest(id); }

  async getLiveStreams(): Promise<LiveStream[]> { return this.memStorage.getLiveStreams(); }
  async getLiveStream(id: string): Promise<LiveStream | undefined> { return this.memStorage.getLiveStream(id); }
  async createLiveStream(stream: InsertLiveStream): Promise<LiveStream> { return this.memStorage.createLiveStream(stream); }
  async updateLiveStream(id: string, updates: Partial<InsertLiveStream>): Promise<LiveStream | undefined> { return this.memStorage.updateLiveStream(id, updates); }
  async deleteLiveStream(id: string): Promise<boolean> { return this.memStorage.deleteLiveStream(id); }

  async getWebhookEvents(): Promise<WebhookEvent[]> {
    return await db.select().from(webhookEvents);
  }

  async getWebhookEvent(stripeEventId: string): Promise<WebhookEvent | undefined> {
    const results = await db.select().from(webhookEvents).where(eq(webhookEvents.stripeEventId, stripeEventId));
    return results[0];
  }

  async createWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent> {
    const results = await db.insert(webhookEvents).values(event).returning();
    return results[0];
  }

  async updateWebhookEvent(id: string, updates: Partial<InsertWebhookEvent>): Promise<WebhookEvent | undefined> {
    const results = await db.update(webhookEvents).set(updates).where(eq(webhookEvents.id, id)).returning();
    return results[0];
  }

  async deleteWebhookEvent(id: string): Promise<boolean> {
    const result = await db.delete(webhookEvents).where(eq(webhookEvents.id, id));
    return result.rowCount > 0;
  }

  async getPoolHalls(): Promise<PoolHall[]> { return this.memStorage.getPoolHalls(); }
  async getAllPoolHalls(): Promise<PoolHall[]> { return this.memStorage.getAllPoolHalls(); }
  async getPoolHall(id: string): Promise<PoolHall | undefined> { return this.memStorage.getPoolHall(id); }
  async createPoolHall(hall: InsertPoolHall): Promise<PoolHall> { return this.memStorage.createPoolHall(hall); }
  async updatePoolHall(id: string, updates: Partial<InsertPoolHall>): Promise<PoolHall | undefined> { return this.memStorage.updatePoolHall(id, updates); }
  async deletePoolHall(id: string): Promise<boolean> { return this.memStorage.deletePoolHall(id); }

  async getHallMatches(): Promise<HallMatch[]> { return this.memStorage.getHallMatches(); }
  async getHallMatch(id: string): Promise<HallMatch | undefined> { return this.memStorage.getHallMatch(id); }
  async createHallMatch(match: InsertHallMatch): Promise<HallMatch> { return this.memStorage.createHallMatch(match); }
  async updateHallMatch(id: string, updates: Partial<InsertHallMatch>): Promise<HallMatch | undefined> { return this.memStorage.updateHallMatch(id, updates); }
  async deleteHallMatch(id: string): Promise<boolean> { return this.memStorage.deleteHallMatch(id); }

  async getHallRosters(): Promise<HallRoster[]> { return this.memStorage.getHallRosters(); }
  async getHallRoster(id: string): Promise<HallRoster | undefined> { return this.memStorage.getHallRoster(id); }
  async createHallRoster(roster: InsertHallRoster): Promise<HallRoster> { return this.memStorage.createHallRoster(roster); }
  async updateHallRoster(id: string, updates: Partial<InsertHallRoster>): Promise<HallRoster | undefined> { return this.memStorage.updateHallRoster(id, updates); }
  async deleteHallRoster(id: string): Promise<boolean> { return this.memStorage.deleteHallRoster(id); }

  async getOperatorSettings(operatorUserId: string): Promise<OperatorSettings | undefined> { return this.memStorage.getOperatorSettings(operatorUserId); }
  async getAllOperatorSettings(): Promise<OperatorSettings[]> { return this.memStorage.getAllOperatorSettings(); }
  async getOperatorSetting(id: string): Promise<OperatorSettings | undefined> { return this.memStorage.getOperatorSetting(id); }
  async createOperatorSettings(settings: InsertOperatorSettings): Promise<OperatorSettings> { return this.memStorage.createOperatorSettings(settings); }
  async updateOperatorSettings(id: string, updates: Partial<InsertOperatorSettings>): Promise<OperatorSettings | undefined> { return this.memStorage.updateOperatorSettings(id, updates); }
  async deleteOperatorSettings(id: string): Promise<boolean> { return this.memStorage.deleteOperatorSettings(id); }

  async getRookieMatches(): Promise<RookieMatch[]> { return this.memStorage.getRookieMatches(); }
  async getRookieMatch(id: string): Promise<RookieMatch | undefined> { return this.memStorage.getRookieMatch(id); }
  async createRookieMatch(match: InsertRookieMatch): Promise<RookieMatch> { return this.memStorage.createRookieMatch(match); }
  async updateRookieMatch(id: string, updates: Partial<InsertRookieMatch>): Promise<RookieMatch | undefined> { return this.memStorage.updateRookieMatch(id, updates); }
  async deleteRookieMatch(id: string): Promise<boolean> { return this.memStorage.deleteRookieMatch(id); }

  async getRookieEvents(): Promise<RookieEvent[]> { return this.memStorage.getRookieEvents(); }
  async getRookieEvent(id: string): Promise<RookieEvent | undefined> { return this.memStorage.getRookieEvent(id); }
  async createRookieEvent(event: InsertRookieEvent): Promise<RookieEvent> { return this.memStorage.createRookieEvent(event); }
  async updateRookieEvent(id: string, updates: Partial<InsertRookieEvent>): Promise<RookieEvent | undefined> { return this.memStorage.updateRookieEvent(id, updates); }
  async deleteRookieEvent(id: string): Promise<boolean> { return this.memStorage.deleteRookieEvent(id); }

  async getRookieAchievements(): Promise<RookieAchievement[]> { return this.memStorage.getRookieAchievements(); }
  async getRookieAchievement(id: string): Promise<RookieAchievement | undefined> { return this.memStorage.getRookieAchievement(id); }
  async createRookieAchievement(achievement: InsertRookieAchievement): Promise<RookieAchievement> { return this.memStorage.createRookieAchievement(achievement); }
  async updateRookieAchievement(id: string, updates: Partial<InsertRookieAchievement>): Promise<RookieAchievement | undefined> { return this.memStorage.updateRookieAchievement(id, updates); }
  async deleteRookieAchievement(id: string): Promise<boolean> { return this.memStorage.deleteRookieAchievement(id); }

  async getRookieSubscriptions(): Promise<RookieSubscription[]> { return this.memStorage.getRookieSubscriptions(); }
  async getRookieSubscription(id: string): Promise<RookieSubscription | undefined> { return this.memStorage.getRookieSubscription(id); }
  async createRookieSubscription(subscription: InsertRookieSubscription): Promise<RookieSubscription> { return this.memStorage.createRookieSubscription(subscription); }
  async updateRookieSubscription(id: string, updates: Partial<InsertRookieSubscription>): Promise<RookieSubscription | undefined> { return this.memStorage.updateRookieSubscription(id, updates); }
  async deleteRookieSubscription(id: string): Promise<boolean> { return this.memStorage.deleteRookieSubscription(id); }

  async getOperatorSubscriptions(): Promise<OperatorSubscription[]> { return this.memStorage.getOperatorSubscriptions(); }
  async getOperatorSubscription(id: string): Promise<OperatorSubscription | undefined> { return this.memStorage.getOperatorSubscription(id); }
  async createOperatorSubscription(subscription: InsertOperatorSubscription): Promise<OperatorSubscription> { return this.memStorage.createOperatorSubscription(subscription); }
  async updateOperatorSubscription(id: string, updates: Partial<InsertOperatorSubscription>): Promise<OperatorSubscription | undefined> { return this.memStorage.updateOperatorSubscription(id, updates); }
  async deleteOperatorSubscription(id: string): Promise<boolean> { return this.memStorage.deleteOperatorSubscription(id); }
  async getAllOperatorSubscriptions(): Promise<OperatorSubscription[]> { return this.memStorage.getAllOperatorSubscriptions(); }

  async createOperatorSubscriptionSplit(split: InsertOperatorSubscriptionSplit): Promise<OperatorSubscriptionSplit> { return this.memStorage.createOperatorSubscriptionSplit(split); }
  async getOperatorSubscriptionSplits(operatorId: string): Promise<OperatorSubscriptionSplit[]> { return this.memStorage.getOperatorSubscriptionSplits(operatorId); }
  async getOperatorSubscriptionSplitsBySubscription(subscriptionId: string): Promise<OperatorSubscriptionSplit[]> { return this.memStorage.getOperatorSubscriptionSplitsBySubscription(subscriptionId); }
  async getTrusteeEarnings(trusteeId: string): Promise<{ totalEarnings: number; splitCount: number; splits: OperatorSubscriptionSplit[] }> { return this.memStorage.getTrusteeEarnings(trusteeId); }
  async getOperatorSubscriptionSplit(id: string): Promise<OperatorSubscriptionSplit | undefined> { return this.memStorage.getOperatorSubscriptionSplit(id); }

  async getTeams(): Promise<Team[]> { return this.memStorage.getTeams(); }
  async getTeam(id: string): Promise<Team | undefined> { return this.memStorage.getTeam(id); }
  async createTeam(team: InsertTeam): Promise<Team> { return this.memStorage.createTeam(team); }
  async updateTeam(id: string, updates: Partial<InsertTeam>): Promise<Team | undefined> { return this.memStorage.updateTeam(id, updates); }
  async deleteTeam(id: string): Promise<boolean> { return this.memStorage.deleteTeam(id); }

  async getTeamPlayers(): Promise<TeamPlayer[]> { return this.memStorage.getTeamPlayers(); }
  async getTeamPlayer(id: string): Promise<TeamPlayer | undefined> { return this.memStorage.getTeamPlayer(id); }
  async createTeamPlayer(teamPlayer: InsertTeamPlayer): Promise<TeamPlayer> { return this.memStorage.createTeamPlayer(teamPlayer); }
  async updateTeamPlayer(id: string, updates: Partial<InsertTeamPlayer>): Promise<TeamPlayer | undefined> { return this.memStorage.updateTeamPlayer(id, updates); }
  async deleteTeamPlayer(id: string): Promise<boolean> { return this.memStorage.deleteTeamPlayer(id); }

  async getTeamMatches(): Promise<TeamMatch[]> { return this.memStorage.getTeamMatches(); }
  async getTeamMatch(id: string): Promise<TeamMatch | undefined> { return this.memStorage.getTeamMatch(id); }
  async createTeamMatch(match: InsertTeamMatch): Promise<TeamMatch> { return this.memStorage.createTeamMatch(match); }
  async updateTeamMatch(id: string, updates: Partial<InsertTeamMatch>): Promise<TeamMatch | undefined> { return this.memStorage.updateTeamMatch(id, updates); }
  async deleteTeamMatch(id: string): Promise<boolean> { return this.memStorage.deleteTeamMatch(id); }

  async getTeamSets(): Promise<TeamSet[]> { return this.memStorage.getTeamSets(); }
  async getTeamSet(id: string): Promise<TeamSet | undefined> { return this.memStorage.getTeamSet(id); }
  async createTeamSet(set: InsertTeamSet): Promise<TeamSet> { return this.memStorage.createTeamSet(set); }
  async updateTeamSet(id: string, updates: Partial<InsertTeamSet>): Promise<TeamSet | undefined> { return this.memStorage.updateTeamSet(id, updates); }
  async deleteTeamSet(id: string): Promise<boolean> { return this.memStorage.deleteTeamSet(id); }

  async getTeamChallenges(): Promise<TeamChallenge[]> { return this.memStorage.getTeamChallenges(); }
  async getTeamChallenge(id: string): Promise<TeamChallenge | undefined> { return this.memStorage.getTeamChallenge(id); }
  async createTeamChallenge(challenge: InsertTeamChallenge): Promise<TeamChallenge> { return this.memStorage.createTeamChallenge(challenge); }
  async updateTeamChallenge(id: string, updates: Partial<InsertTeamChallenge>): Promise<TeamChallenge | undefined> { return this.memStorage.updateTeamChallenge(id, updates); }
  async deleteTeamChallenge(id: string): Promise<boolean> { return this.memStorage.deleteTeamChallenge(id); }

  async getTeamChallengeParticipants(): Promise<TeamChallengeParticipant[]> { return this.memStorage.getTeamChallengeParticipants(); }
  async getTeamChallengeParticipant(id: string): Promise<TeamChallengeParticipant | undefined> { return this.memStorage.getTeamChallengeParticipant(id); }
  async createTeamChallengeParticipant(participant: InsertTeamChallengeParticipant): Promise<TeamChallengeParticipant> { return this.memStorage.createTeamChallengeParticipant(participant); }
  async updateTeamChallengeParticipant(id: string, updates: Partial<InsertTeamChallengeParticipant>): Promise<TeamChallengeParticipant | undefined> { return this.memStorage.updateTeamChallengeParticipant(id, updates); }
  async deleteTeamChallengeParticipant(id: string): Promise<boolean> { return this.memStorage.deleteTeamChallengeParticipant(id); }

  async getCheckins(): Promise<Checkin[]> { return this.memStorage.getCheckins(); }
  async getCheckin(id: string): Promise<Checkin | undefined> { return this.memStorage.getCheckin(id); }
  async createCheckin(checkin: InsertCheckin): Promise<Checkin> { return this.memStorage.createCheckin(checkin); }
  async updateCheckin(id: string, updates: Partial<InsertCheckin>): Promise<Checkin | undefined> { return this.memStorage.updateCheckin(id, updates); }
  async deleteCheckin(id: string): Promise<boolean> { return this.memStorage.deleteCheckin(id); }

  async getAttitudeVotes(): Promise<AttitudeVote[]> { return this.memStorage.getAttitudeVotes(); }
  async getAttitudeVote(id: string): Promise<AttitudeVote | undefined> { return this.memStorage.getAttitudeVote(id); }
  async createAttitudeVote(vote: InsertAttitudeVote): Promise<AttitudeVote> { return this.memStorage.createAttitudeVote(vote); }
  async updateAttitudeVote(id: string, updates: Partial<InsertAttitudeVote>): Promise<AttitudeVote | undefined> { return this.memStorage.updateAttitudeVote(id, updates); }
  async deleteAttitudeVote(id: string): Promise<boolean> { return this.memStorage.deleteAttitudeVote(id); }

  async getAttitudeBallots(): Promise<AttitudeBallot[]> { return this.memStorage.getAttitudeBallots(); }
  async getAttitudeBallot(id: string): Promise<AttitudeBallot | undefined> { return this.memStorage.getAttitudeBallot(id); }
  async createAttitudeBallot(ballot: InsertAttitudeBallot): Promise<AttitudeBallot> { return this.memStorage.createAttitudeBallot(ballot); }
  async updateAttitudeBallot(id: string, updates: Partial<InsertAttitudeBallot>): Promise<AttitudeBallot | undefined> { return this.memStorage.updateAttitudeBallot(id, updates); }
  async deleteAttitudeBallot(id: string): Promise<boolean> { return this.memStorage.deleteAttitudeBallot(id); }

  async getIncidents(): Promise<Incident[]> { return this.memStorage.getIncidents(); }
  async getIncident(id: string): Promise<Incident | undefined> { return this.memStorage.getIncident(id); }
  async createIncident(incident: InsertIncident): Promise<Incident> { return this.memStorage.createIncident(incident); }
  async updateIncident(id: string, updates: Partial<InsertIncident>): Promise<Incident | undefined> { return this.memStorage.updateIncident(id, updates); }
  async deleteIncident(id: string): Promise<boolean> { return this.memStorage.deleteIncident(id); }

  async getChallengeEntries(): Promise<ChallengeEntry[]> { return this.memStorage.getChallengeEntries(); }
  async getChallengeEntry(id: string): Promise<ChallengeEntry | undefined> { return this.memStorage.getChallengeEntry(id); }
  async createChallengeEntry(entry: InsertChallengeEntry): Promise<ChallengeEntry> { return this.memStorage.createChallengeEntry(entry); }
  async updateChallengeEntry(id: string, updates: Partial<InsertChallengeEntry>): Promise<ChallengeEntry | undefined> { return this.memStorage.updateChallengeEntry(id, updates); }
  async deleteChallengeEntry(id: string): Promise<boolean> { return this.memStorage.deleteChallengeEntry(id); }

  async getLedgerEntries(): Promise<LedgerEntry[]> { return this.memStorage.getLedgerEntries(); }
  async getLedgerEntry(id: string): Promise<LedgerEntry | undefined> { return this.memStorage.getLedgerEntry(id); }
  async createLedgerEntry(entry: InsertLedgerEntry): Promise<LedgerEntry> { return this.memStorage.createLedgerEntry(entry); }
  async updateLedgerEntry(id: string, updates: Partial<InsertLedgerEntry>): Promise<LedgerEntry | undefined> { return this.memStorage.updateLedgerEntry(id, updates); }
  async deleteLedgerEntry(id: string): Promise<boolean> { return this.memStorage.deleteLedgerEntry(id); }

  async getResolutions(): Promise<Resolution[]> { return this.memStorage.getResolutions(); }
  async getResolution(id: string): Promise<Resolution | undefined> { return this.memStorage.getResolution(id); }
  async createResolution(resolution: InsertResolution): Promise<Resolution> { return this.memStorage.createResolution(resolution); }
  async updateResolution(id: string, updates: Partial<InsertResolution>): Promise<Resolution | undefined> { return this.memStorage.updateResolution(id, updates); }
  async deleteResolution(id: string): Promise<boolean> { return this.memStorage.deleteResolution(id); }

  async getMatchDivisions(): Promise<MatchDivision[]> { return this.memStorage.getMatchDivisions(); }
  async getMatchDivision(id: string): Promise<MatchDivision | undefined> { return this.memStorage.getMatchDivision(id); }
  async createMatchDivision(division: InsertMatchDivision): Promise<MatchDivision> { return this.memStorage.createMatchDivision(division); }
  async updateMatchDivision(id: string, updates: Partial<InsertMatchDivision>): Promise<MatchDivision | undefined> { return this.memStorage.updateMatchDivision(id, updates); }
  async deleteMatchDivision(id: string): Promise<boolean> { return this.memStorage.deleteMatchDivision(id); }

  async getOperatorTiers(): Promise<OperatorTier[]> { return this.memStorage.getOperatorTiers(); }
  async getOperatorTier(id: string): Promise<OperatorTier | undefined> { return this.memStorage.getOperatorTier(id); }
  async createOperatorTier(tier: InsertOperatorTier): Promise<OperatorTier> { return this.memStorage.createOperatorTier(tier); }
  async updateOperatorTier(id: string, updates: Partial<InsertOperatorTier>): Promise<OperatorTier | undefined> { return this.memStorage.updateOperatorTier(id, updates); }
  async deleteOperatorTier(id: string): Promise<boolean> { return this.memStorage.deleteOperatorTier(id); }

  async getTeamStripeAccounts(): Promise<TeamStripeAccount[]> { return this.memStorage.getTeamStripeAccounts(); }
  async getTeamStripeAccount(id: string): Promise<TeamStripeAccount | undefined> { return this.memStorage.getTeamStripeAccount(id); }
  async createTeamStripeAccount(account: InsertTeamStripeAccount): Promise<TeamStripeAccount> { return this.memStorage.createTeamStripeAccount(account); }
  async updateTeamStripeAccount(id: string, updates: Partial<InsertTeamStripeAccount>): Promise<TeamStripeAccount | undefined> { return this.memStorage.updateTeamStripeAccount(id, updates); }
  async deleteTeamStripeAccount(id: string): Promise<boolean> { return this.memStorage.deleteTeamStripeAccount(id); }

  async getMatchEntries(): Promise<MatchEntry[]> { return this.memStorage.getMatchEntries(); }
  async getMatchEntry(id: string): Promise<MatchEntry | undefined> { return this.memStorage.getMatchEntry(id); }
  async createMatchEntry(entry: InsertMatchEntry): Promise<MatchEntry> { return this.memStorage.createMatchEntry(entry); }
  async updateMatchEntry(id: string, updates: Partial<InsertMatchEntry>): Promise<MatchEntry | undefined> { return this.memStorage.updateMatchEntry(id, updates); }
  async deleteMatchEntry(id: string): Promise<boolean> { return this.memStorage.deleteMatchEntry(id); }

  async getPayoutDistributions(): Promise<PayoutDistribution[]> { return this.memStorage.getPayoutDistributions(); }
  async getPayoutDistribution(id: string): Promise<PayoutDistribution | undefined> { return this.memStorage.getPayoutDistribution(id); }
  async createPayoutDistribution(distribution: InsertPayoutDistribution): Promise<PayoutDistribution> { return this.memStorage.createPayoutDistribution(distribution); }
  async updatePayoutDistribution(id: string, updates: Partial<InsertPayoutDistribution>): Promise<PayoutDistribution | undefined> { return this.memStorage.updatePayoutDistribution(id, updates); }
  async deletePayoutDistribution(id: string): Promise<boolean> { return this.memStorage.deletePayoutDistribution(id); }

  async getTeamRegistrations(): Promise<TeamRegistration[]> { return this.memStorage.getTeamRegistrations(); }
  async getTeamRegistration(id: string): Promise<TeamRegistration | undefined> { return this.memStorage.getTeamRegistration(id); }
  async createTeamRegistration(registration: InsertTeamRegistration): Promise<TeamRegistration> { return this.memStorage.createTeamRegistration(registration); }
  async updateTeamRegistration(id: string, updates: Partial<InsertTeamRegistration>): Promise<TeamRegistration | undefined> { return this.memStorage.updateTeamRegistration(id, updates); }
  async deleteTeamRegistration(id: string): Promise<boolean> { return this.memStorage.deleteTeamRegistration(id); }

  async getUploadedFiles(): Promise<UploadedFile[]> { return this.memStorage.getUploadedFiles(); }
  async getUploadedFile(id: string): Promise<UploadedFile | undefined> { return this.memStorage.getUploadedFile(id); }
  async createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile> { return this.memStorage.createUploadedFile(file); }
  async updateUploadedFile(id: string, updates: Partial<InsertUploadedFile>): Promise<UploadedFile | undefined> { return this.memStorage.updateUploadedFile(id, updates); }
  async deleteUploadedFile(id: string): Promise<boolean> { return this.memStorage.deleteUploadedFile(id); }

  async getFileShares(): Promise<FileShare[]> { return this.memStorage.getFileShares(); }
  async getFileShare(id: string): Promise<FileShare | undefined> { return this.memStorage.getFileShare(id); }
  async createFileShare(share: InsertFileShare): Promise<FileShare> { return this.memStorage.createFileShare(share); }
  async updateFileShare(id: string, updates: Partial<InsertFileShare>): Promise<FileShare | undefined> { return this.memStorage.updateFileShare(id, updates); }
  async deleteFileShare(id: string): Promise<boolean> { return this.memStorage.deleteFileShare(id); }

  async getWeightRules(): Promise<WeightRule[]> { return this.memStorage.getWeightRules(); }
  async getWeightRule(id: string): Promise<WeightRule | undefined> { return this.memStorage.getWeightRule(id); }
  async createWeightRule(rule: InsertWeightRule): Promise<WeightRule> { return this.memStorage.createWeightRule(rule); }
  async updateWeightRule(id: string, updates: Partial<InsertWeightRule>): Promise<WeightRule | undefined> { return this.memStorage.updateWeightRule(id, updates); }
  async deleteWeightRule(id: string): Promise<boolean> { return this.memStorage.deleteWeightRule(id); }

  async getTutoringSessions(): Promise<TutoringSession[]> { return this.memStorage.getTutoringSessions(); }
  async getTutoringSession(id: string): Promise<TutoringSession | undefined> { return this.memStorage.getTutoringSession(id); }
  async createTutoringSession(session: InsertTutoringSession): Promise<TutoringSession> { return this.memStorage.createTutoringSession(session); }
  async updateTutoringSession(id: string, updates: Partial<InsertTutoringSession>): Promise<TutoringSession | undefined> { return this.memStorage.updateTutoringSession(id, updates); }
  async deleteTutoringSession(id: string): Promise<boolean> { return this.memStorage.deleteTutoringSession(id); }

  async getTutoringCredits(): Promise<TutoringCredits[]> { return this.memStorage.getTutoringCredits(); }
  async getTutoringCredit(id: string): Promise<TutoringCredits | undefined> { return this.memStorage.getTutoringCredit(id); }
  async createTutoringCredits(credits: InsertTutoringCredits): Promise<TutoringCredits> { return this.memStorage.createTutoringCredits(credits); }
  async updateTutoringCredits(id: string, updates: Partial<InsertTutoringCredits>): Promise<TutoringCredits | undefined> { return this.memStorage.updateTutoringCredits(id, updates); }
  async deleteTutoringCredits(id: string): Promise<boolean> { return this.memStorage.deleteTutoringCredits(id); }

  async getCommissionRates(): Promise<CommissionRate[]> { return this.memStorage.getCommissionRates(); }
  async getCommissionRate(id: string): Promise<CommissionRate | undefined> { return this.memStorage.getCommissionRate(id); }
  async createCommissionRate(rate: InsertCommissionRate): Promise<CommissionRate> { return this.memStorage.createCommissionRate(rate); }
  async updateCommissionRate(id: string, updates: Partial<InsertCommissionRate>): Promise<CommissionRate | undefined> { return this.memStorage.updateCommissionRate(id, updates); }
  async deleteCommissionRate(id: string): Promise<boolean> { return this.memStorage.deleteCommissionRate(id); }

  async getPlatformEarnings(): Promise<PlatformEarnings[]> { return this.memStorage.getPlatformEarnings(); }
  async getPlatformEarning(id: string): Promise<PlatformEarnings | undefined> { return this.memStorage.getPlatformEarning(id); }
  async createPlatformEarnings(earnings: InsertPlatformEarnings): Promise<PlatformEarnings> { return this.memStorage.createPlatformEarnings(earnings); }
  async updatePlatformEarnings(id: string, updates: Partial<InsertPlatformEarnings>): Promise<PlatformEarnings | undefined> { return this.memStorage.updatePlatformEarnings(id, updates); }
  async deletePlatformEarnings(id: string): Promise<boolean> { return this.memStorage.deletePlatformEarnings(id); }

  async getMembershipEarnings(): Promise<MembershipEarnings[]> { return this.memStorage.getMembershipEarnings(); }
  async getMembershipEarning(id: string): Promise<MembershipEarnings | undefined> { return this.memStorage.getMembershipEarning(id); }
  async createMembershipEarnings(earnings: InsertMembershipEarnings): Promise<MembershipEarnings> { return this.memStorage.createMembershipEarnings(earnings); }
  async updateMembershipEarnings(id: string, updates: Partial<InsertMembershipEarnings>): Promise<MembershipEarnings | undefined> { return this.memStorage.updateMembershipEarnings(id, updates); }
  async deleteMembershipEarnings(id: string): Promise<boolean> { return this.memStorage.deleteMembershipEarnings(id); }

  async getOperatorPayouts(): Promise<OperatorPayout[]> { return this.memStorage.getOperatorPayouts(); }
  async getOperatorPayout(id: string): Promise<OperatorPayout | undefined> { return this.memStorage.getOperatorPayout(id); }
  async createOperatorPayout(payout: InsertOperatorPayout): Promise<OperatorPayout> { return this.memStorage.createOperatorPayout(payout); }
  async updateOperatorPayout(id: string, updates: Partial<InsertOperatorPayout>): Promise<OperatorPayout | undefined> { return this.memStorage.updateOperatorPayout(id, updates); }
  async deleteOperatorPayout(id: string): Promise<boolean> { return this.memStorage.deleteOperatorPayout(id); }

  async getMembershipSubscriptions(): Promise<MembershipSubscription[]> {
    return await db.select().from(membershipSubscriptionsTable).orderBy(desc(membershipSubscriptionsTable.createdAt));
  }
  async getMembershipSubscription(id: string): Promise<MembershipSubscription | undefined> {
    const results = await db.select().from(membershipSubscriptionsTable).where(eq(membershipSubscriptionsTable.id, id));
    return results[0];
  }
  async createMembershipSubscription(subscription: InsertMembershipSubscription): Promise<MembershipSubscription> {
    const results = await db.insert(membershipSubscriptionsTable).values(subscription).returning();
    return results[0];
  }
  async updateMembershipSubscription(id: string, updates: Partial<InsertMembershipSubscription>): Promise<MembershipSubscription | undefined> {
    const results = await db.update(membershipSubscriptionsTable).set({ ...updates, updatedAt: new Date() }).where(eq(membershipSubscriptionsTable.id, id)).returning();
    return results[0];
  }
  async deleteMembershipSubscription(id: string): Promise<boolean> {
    const result = await db.delete(membershipSubscriptionsTable).where(eq(membershipSubscriptionsTable.id, id));
    return result.rowCount > 0;
  }

  async getChallenges(): Promise<Challenge[]> { return this.memStorage.getChallenges(); }
  async getChallenge(id: string): Promise<Challenge | undefined> { return this.memStorage.getChallenge(id); }
  async createChallenge(challenge: InsertChallenge): Promise<Challenge> { return this.memStorage.createChallenge(challenge); }
  async updateChallenge(id: string, updates: Partial<InsertChallenge>): Promise<Challenge | undefined> { return this.memStorage.updateChallenge(id, updates); }
  async deleteChallenge(id: string): Promise<boolean> { return this.memStorage.deleteChallenge(id); }

  async getChallengeFees(): Promise<ChallengeFee[]> { return this.memStorage.getChallengeFees(); }
  async getChallengeFee(id: string): Promise<ChallengeFee | undefined> { return this.memStorage.getChallengeFee(id); }
  async createChallengeFee(fee: InsertChallengeFee): Promise<ChallengeFee> { return this.memStorage.createChallengeFee(fee); }
  async updateChallengeFee(id: string, updates: Partial<InsertChallengeFee>): Promise<ChallengeFee | undefined> { return this.memStorage.updateChallengeFee(id, updates); }
  async deleteChallengeFee(id: string): Promise<boolean> { return this.memStorage.deleteChallengeFee(id); }

  async getChallengeCheckIns(): Promise<ChallengeCheckIn[]> { return this.memStorage.getChallengeCheckIns(); }
  async getChallengeCheckIn(id: string): Promise<ChallengeCheckIn | undefined> { return this.memStorage.getChallengeCheckIn(id); }
  async createChallengeCheckIn(checkin: InsertChallengeCheckIn): Promise<ChallengeCheckIn> { return this.memStorage.createChallengeCheckIn(checkin); }
  async updateChallengeCheckIn(id: string, updates: Partial<InsertChallengeCheckIn>): Promise<ChallengeCheckIn | undefined> { return this.memStorage.updateChallengeCheckIn(id, updates); }
  async deleteChallengeCheckIn(id: string): Promise<boolean> { return this.memStorage.deleteChallengeCheckIn(id); }

  async getChallengePolicies(): Promise<ChallengePolicy[]> { return this.memStorage.getChallengePolicies(); }
  async getChallengePolicy(id: string): Promise<ChallengePolicy | undefined> { return this.memStorage.getChallengePolicy(id); }
  async createChallengePolicy(policy: InsertChallengePolicy): Promise<ChallengePolicy> { return this.memStorage.createChallengePolicy(policy); }
  async updateChallengePolicy(id: string, updates: Partial<InsertChallengePolicy>): Promise<ChallengePolicy | undefined> { return this.memStorage.updateChallengePolicy(id, updates); }
  async deleteChallengePolicy(id: string): Promise<boolean> { return this.memStorage.deleteChallengePolicy(id); }

  async getQrCodeNonces(): Promise<QrCodeNonce[]> { return this.memStorage.getQrCodeNonces(); }
  async getQrCodeNonce(id: string): Promise<QrCodeNonce | undefined> { return this.memStorage.getQrCodeNonce(id); }
  async createQrCodeNonce(nonce: InsertQrCodeNonce): Promise<QrCodeNonce> { return this.memStorage.createQrCodeNonce(nonce); }
  async updateQrCodeNonce(id: string, updates: Partial<InsertQrCodeNonce>): Promise<QrCodeNonce | undefined> { return this.memStorage.updateQrCodeNonce(id, updates); }
  async deleteQrCodeNonce(id: string): Promise<boolean> { return this.memStorage.deleteQrCodeNonce(id); }
  async markNonceAsUsed(nonce: string, ipAddress?: string, userAgent?: string): Promise<QrCodeNonce | undefined> { return this.memStorage.markNonceAsUsed(nonce, ipAddress, userAgent); }
  async isNonceUsed(nonce: string): Promise<boolean> { return this.memStorage.isNonceUsed(nonce); }
  async isNonceValid(nonce: string): Promise<boolean> { return this.memStorage.isNonceValid(nonce); }
  async cleanupExpiredNonces(): Promise<number> { return this.memStorage.cleanupExpiredNonces(); }

  async getIcalFeedTokens(): Promise<IcalFeedToken[]> { return this.memStorage.getIcalFeedTokens(); }
  async getIcalFeedToken(id: string): Promise<IcalFeedToken | undefined> { return this.memStorage.getIcalFeedToken(id); }
  async createIcalFeedToken(token: InsertIcalFeedToken): Promise<IcalFeedToken> { return this.memStorage.createIcalFeedToken(token); }
  async updateIcalFeedToken(id: string, updates: Partial<InsertIcalFeedToken>): Promise<IcalFeedToken | undefined> { return this.memStorage.updateIcalFeedToken(id, updates); }
  async deleteIcalFeedToken(id: string): Promise<boolean> { return this.memStorage.deleteIcalFeedToken(id); }

  async getPaymentMethods(): Promise<PaymentMethod[]> { return this.memStorage.getPaymentMethods(); }
  async getPaymentMethod(id: string): Promise<PaymentMethod | undefined> { return this.memStorage.getPaymentMethod(id); }
  async createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod> { return this.memStorage.createPaymentMethod(method); }
  async updatePaymentMethod(id: string, updates: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined> { return this.memStorage.updatePaymentMethod(id, updates); }
  async deletePaymentMethod(id: string): Promise<boolean> { return this.memStorage.deletePaymentMethod(id); }

  async getStakesHolds(): Promise<StakesHold[]> { return this.memStorage.getStakesHolds(); }
  async getStakesHold(id: string): Promise<StakesHold | undefined> { return this.memStorage.getStakesHold(id); }
  async createStakesHold(hold: InsertStakesHold): Promise<StakesHold> { return this.memStorage.createStakesHold(hold); }
  async updateStakesHold(id: string, updates: Partial<InsertStakesHold>): Promise<StakesHold | undefined> { return this.memStorage.updateStakesHold(id, updates); }
  async deleteStakesHold(id: string): Promise<boolean> { return this.memStorage.deleteStakesHold(id); }

  async getNotificationSettings(): Promise<NotificationSettings[]> { return this.memStorage.getNotificationSettings(); }
  async getNotificationSetting(id: string): Promise<NotificationSettings | undefined> { return this.memStorage.getNotificationSetting(id); }
  async createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings> { return this.memStorage.createNotificationSettings(settings); }
  async updateNotificationSettings(id: string, updates: Partial<InsertNotificationSettings>): Promise<NotificationSettings | undefined> { return this.memStorage.updateNotificationSettings(id, updates); }
  async deleteNotificationSettings(id: string): Promise<boolean> { return this.memStorage.deleteNotificationSettings(id); }

  async getNotificationDeliveries(): Promise<NotificationDelivery[]> { return this.memStorage.getNotificationDeliveries(); }
  async getNotificationDelivery(id: string): Promise<NotificationDelivery | undefined> { return this.memStorage.getNotificationDelivery(id); }
  async createNotificationDelivery(delivery: InsertNotificationDelivery): Promise<NotificationDelivery> { return this.memStorage.createNotificationDelivery(delivery); }
  async updateNotificationDelivery(id: string, updates: Partial<InsertNotificationDelivery>): Promise<NotificationDelivery | undefined> { return this.memStorage.updateNotificationDelivery(id, updates); }
  async deleteNotificationDelivery(id: string): Promise<boolean> { return this.memStorage.deleteNotificationDelivery(id); }

  async getDisputeResolutions(): Promise<DisputeResolution[]> { return this.memStorage.getDisputeResolutions(); }
  async getDisputeResolution(id: string): Promise<DisputeResolution | undefined> { return this.memStorage.getDisputeResolution(id); }
  async createDisputeResolution(resolution: InsertDisputeResolution): Promise<DisputeResolution> { return this.memStorage.createDisputeResolution(resolution); }
  async updateDisputeResolution(id: string, updates: Partial<InsertDisputeResolution>): Promise<DisputeResolution | undefined> { return this.memStorage.updateDisputeResolution(id, updates); }
  async deleteDisputeResolution(id: string): Promise<boolean> { return this.memStorage.deleteDisputeResolution(id); }

  async getPlayerCooldowns(): Promise<PlayerCooldown[]> { return this.memStorage.getPlayerCooldowns(); }
  async getPlayerCooldown(id: string): Promise<PlayerCooldown | undefined> { return this.memStorage.getPlayerCooldown(id); }
  async createPlayerCooldown(cooldown: InsertPlayerCooldown): Promise<PlayerCooldown> { return this.memStorage.createPlayerCooldown(cooldown); }
  async updatePlayerCooldown(id: string, updates: Partial<InsertPlayerCooldown>): Promise<PlayerCooldown | undefined> { return this.memStorage.updatePlayerCooldown(id, updates); }
  async deletePlayerCooldown(id: string): Promise<boolean> { return this.memStorage.deletePlayerCooldown(id); }

  async getDeviceAttestations(): Promise<DeviceAttestation[]> { return this.memStorage.getDeviceAttestations(); }
  async getDeviceAttestation(id: string): Promise<DeviceAttestation | undefined> { return this.memStorage.getDeviceAttestation(id); }
  async createDeviceAttestation(attestation: InsertDeviceAttestation): Promise<DeviceAttestation> { return this.memStorage.createDeviceAttestation(attestation); }
  async updateDeviceAttestation(id: string, updates: Partial<InsertDeviceAttestation>): Promise<DeviceAttestation | undefined> { return this.memStorage.updateDeviceAttestation(id, updates); }
  async deleteDeviceAttestation(id: string): Promise<boolean> { return this.memStorage.deleteDeviceAttestation(id); }

  async getJobQueues(): Promise<JobQueue[]> { return this.memStorage.getJobQueues(); }
  async getJobQueue(id: string): Promise<JobQueue | undefined> { return this.memStorage.getJobQueue(id); }
  async createJobQueue(job: InsertJobQueue): Promise<JobQueue> { return this.memStorage.createJobQueue(job); }
  async updateJobQueue(id: string, updates: Partial<InsertJobQueue>): Promise<JobQueue | undefined> { return this.memStorage.updateJobQueue(id, updates); }
  async deleteJobQueue(id: string): Promise<boolean> { return this.memStorage.deleteJobQueue(id); }

  async getSystemMetrics(): Promise<SystemMetric[]> { return this.memStorage.getSystemMetrics(); }
  async getSystemMetric(id: string): Promise<SystemMetric | undefined> { return this.memStorage.getSystemMetric(id); }
  async createSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric> { return this.memStorage.createSystemMetric(metric); }
  async updateSystemMetric(id: string, updates: Partial<InsertSystemMetric>): Promise<SystemMetric | undefined> { return this.memStorage.updateSystemMetric(id, updates); }
  async deleteSystemMetric(id: string): Promise<boolean> { return this.memStorage.deleteSystemMetric(id); }

  async getSystemAlerts(): Promise<SystemAlert[]> { return this.memStorage.getSystemAlerts(); }
  async getSystemAlert(id: string): Promise<SystemAlert | undefined> { return this.memStorage.getSystemAlert(id); }
  async createSystemAlert(alert: InsertSystemAlert): Promise<SystemAlert> { return this.memStorage.createSystemAlert(alert); }
  async updateSystemAlert(id: string, updates: Partial<InsertSystemAlert>): Promise<SystemAlert | undefined> { return this.memStorage.updateSystemAlert(id, updates); }
  async deleteSystemAlert(id: string): Promise<boolean> { return this.memStorage.deleteSystemAlert(id); }

  // Additional query methods
  async getPlayersByRating(minRating: number): Promise<Player[]> { return this.memStorage.getPlayersByRating(minRating); }
  async getPlayersByCity(city: string): Promise<Player[]> { return this.memStorage.getPlayersByCity(city); }
  async getMemberPlayers(): Promise<Player[]> { return this.memStorage.getMemberPlayers(); }
  async getTopPlayers(limit: number): Promise<Player[]> { return this.memStorage.getTopPlayers(limit); }
  async getPlayersByStreakLength(minStreak: number): Promise<Player[]> { return this.memStorage.getPlayersByStreakLength(minStreak); }
  async getActiveMatches(): Promise<Match[]> { return this.memStorage.getActiveMatches(); }
  async getMatchesByPlayer(playerId: string): Promise<Match[]> { return this.memStorage.getMatchesByPlayer(playerId); }
  async getUpcomingTournaments(): Promise<Tournament[]> { return this.memStorage.getUpcomingTournaments(); }
  async getActiveTournaments(): Promise<Tournament[]> { return this.memStorage.getActiveTournaments(); }
  async getTournamentsByStatus(status: string): Promise<Tournament[]> { return this.memStorage.getTournamentsByStatus(status); }
  async getKellyPoolsByStatus(status: string): Promise<KellyPool[]> { return this.memStorage.getKellyPoolsByStatus(status); }
  async getActiveKellyPools(): Promise<KellyPool[]> { return this.memStorage.getActiveKellyPools(); }
  async getActiveBounties(): Promise<Bounty[]> { return this.memStorage.getActiveBounties(); }
  async getBountiesByPlayer(playerId: string): Promise<Bounty[]> { return this.memStorage.getBountiesByPlayer(playerId); }
  async getUpcomingCharityEvents(): Promise<CharityEvent[]> { return this.memStorage.getUpcomingCharityEvents(); }
  async getPendingSupportRequests(): Promise<SupportRequest[]> { return this.memStorage.getPendingSupportRequests(); }
  async getSupportRequestsByPlayer(playerId: string): Promise<SupportRequest[]> { return this.memStorage.getSupportRequestsByPlayer(playerId); }
  async getActiveLiveStreams(): Promise<LiveStream[]> { return this.memStorage.getActiveLiveStreams(); }
  async getLiveStreamsByPlatform(platform: string): Promise<LiveStream[]> { return this.memStorage.getLiveStreamsByPlatform(platform); }
  async getLiveStreamsByCity(city: string): Promise<LiveStream[]> { return this.memStorage.getLiveStreamsByCity(city); }

  async getWebhookEventsByType(eventType: string): Promise<WebhookEvent[]> {
    return await db.select().from(webhookEvents).where(eq(webhookEvents.eventType, eventType));
  }

  async getRecentWebhookEvents(hours: number): Promise<WebhookEvent[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await db.select().from(webhookEvents).orderBy(desc(webhookEvents.processedAt)).limit(100);
  }

  async getPoolHallsByCity(city: string): Promise<PoolHall[]> { return (this.memStorage as any).getPoolHallsByCity(city); }
  async getActivePoolHalls(): Promise<PoolHall[]> { return (this.memStorage as any).getActivePoolHalls(); }
  async getHallMatchesByHall(hallId: string): Promise<HallMatch[]> { return this.memStorage.getHallMatchesByHall(hallId); }
  async getActiveHallMatches(): Promise<HallMatch[]> { return (this.memStorage as any).getActiveHallMatches(); }
  async getHallRostersByHall(hallId: string): Promise<HallRoster[]> { return (this.memStorage as any).getHallRostersByHall(hallId); }
  async getOperatorSettingsByOperator(operatorId: string): Promise<OperatorSettings | undefined> { return (this.memStorage as any).getOperatorSettingsByOperator(operatorId); }
  async getRookieMatchesByPlayer(playerId: string): Promise<RookieMatch[]> { return this.memStorage.getRookieMatchesByPlayer(playerId); }
  async getActiveRookieMatches(): Promise<RookieMatch[]> { return (this.memStorage as any).getActiveRookieMatches(); }
  async getUpcomingRookieEvents(): Promise<RookieEvent[]> { return (this.memStorage as any).getUpcomingRookieEvents(); }
  async getRookieAchievementsByPlayer(playerId: string): Promise<RookieAchievement[]> { return this.memStorage.getRookieAchievementsByPlayer(playerId); }
  async getActiveRookieSubscriptions(): Promise<RookieSubscription[]> { return (this.memStorage as any).getActiveRookieSubscriptions(); }
  async getRookieSubscriptionsByPlayer(playerId: string): Promise<RookieSubscription[]> { return (this.memStorage as any).getRookieSubscriptionsByPlayer(playerId); }
  async getActiveOperatorSubscriptions(): Promise<OperatorSubscription[]> { return (this.memStorage as any).getActiveOperatorSubscriptions(); }
  async getOperatorSubscriptionsByOperator(operatorId: string): Promise<OperatorSubscription[]> { return (this.memStorage as any).getOperatorSubscriptionsByOperator(operatorId); }
  async getTeamsByPlayer(playerId: string): Promise<Team[]> { return (this.memStorage as any).getTeamsByPlayer(playerId); }
  async getActiveTeams(): Promise<Team[]> { return (this.memStorage as any).getActiveTeams(); }
  async getTeamPlayersByTeam(teamId: string): Promise<TeamPlayer[]> { return this.memStorage.getTeamPlayersByTeam(teamId); }
  async getTeamPlayersByPlayer(playerId: string): Promise<TeamPlayer[]> { return this.memStorage.getTeamPlayersByPlayer(playerId); }
  async getTeamMatchesByTeam(teamId: string): Promise<TeamMatch[]> { return this.memStorage.getTeamMatchesByTeam(teamId); }
  async getActiveTeamMatches(): Promise<TeamMatch[]> { return (this.memStorage as any).getActiveTeamMatches(); }
  async getTeamSetsByMatch(matchId: string): Promise<TeamSet[]> { return this.memStorage.getTeamSetsByMatch(matchId); }
  async getActiveTeamChallenges(): Promise<TeamChallenge[]> { return (this.memStorage as any).getActiveTeamChallenges(); }
  async getTeamChallengesByTeam(teamId: string): Promise<TeamChallenge[]> { return (this.memStorage as any).getTeamChallengesByTeam(teamId); }
  async getTeamChallengeParticipantsByChallenge(challengeId: string): Promise<TeamChallengeParticipant[]> { return this.memStorage.getTeamChallengeParticipantsByChallenge(challengeId); }
  async getTeamChallengeParticipantsByTeam(teamId: string): Promise<TeamChallengeParticipant[]> { return (this.memStorage as any).getTeamChallengeParticipantsByTeam(teamId); }
  async getCheckinsByPlayer(playerId: string): Promise<Checkin[]> { return (this.memStorage as any).getCheckinsByPlayer(playerId); }
  async getRecentCheckins(hours: number): Promise<Checkin[]> { return (this.memStorage as any).getRecentCheckins(hours); }
  async getAttitudeVotesByPlayer(playerId: string): Promise<AttitudeVote[]> { return (this.memStorage as any).getAttitudeVotesByPlayer(playerId); }
  async getAttitudeVotesByBallot(ballotId: string): Promise<AttitudeVote[]> { return (this.memStorage as any).getAttitudeVotesByBallot(ballotId); }
  async getActiveAttitudeBallots(): Promise<AttitudeBallot[]> { return (this.memStorage as any).getActiveAttitudeBallots(); }
  async getIncidentsByPlayer(playerId: string): Promise<Incident[]> { return (this.memStorage as any).getIncidentsByPlayer(playerId); }
  async getIncidentsByType(incidentType: string): Promise<Incident[]> { return (this.memStorage as any).getIncidentsByType(incidentType); }
  async getOpenIncidents(): Promise<Incident[]> { return (this.memStorage as any).getOpenIncidents(); }
  async getChallengeEntriesByPool(poolId: string): Promise<ChallengeEntry[]> { return this.memStorage.getChallengeEntriesByPool(poolId); }
  async getChallengeEntriesByPlayer(playerId: string): Promise<ChallengeEntry[]> { return (this.memStorage as any).getChallengeEntriesByPlayer(playerId); }
  async getLedgerEntriesByWallet(walletId: string): Promise<LedgerEntry[]> { return (this.memStorage as any).getLedgerEntriesByWallet(walletId); }
  async getLedgerEntriesByType(entryType: string): Promise<LedgerEntry[]> { return (this.memStorage as any).getLedgerEntriesByType(entryType); }
  async getResolutionsByPool(poolId: string): Promise<Resolution[]> { return (this.memStorage as any).getResolutionsByPool(poolId); }
  async getPendingResolutions(): Promise<Resolution[]> { return (this.memStorage as any).getPendingResolutions(); }
  async getMatchDivisionsByType(divisionType: string): Promise<MatchDivision[]> { return (this.memStorage as any).getMatchDivisionsByType(divisionType); }
  async getActiveMatchDivisions(): Promise<MatchDivision[]> { return (this.memStorage as any).getActiveMatchDivisions(); }
  async getOperatorTiersByLevel(level: number): Promise<OperatorTier[]> { return (this.memStorage as any).getOperatorTiersByLevel(level); }
  async getTeamStripeAccountsByTeam(teamId: string): Promise<TeamStripeAccount[]> { return (this.memStorage as any).getTeamStripeAccountsByTeam(teamId); }
  async getMatchEntryByMatchId(matchId: string): Promise<MatchEntry | undefined> { return this.memStorage.getMatchEntryByMatchId(matchId); }
  async getMatchEntriesByMatch(matchId: string): Promise<MatchEntry[]> { return (this.memStorage as any).getMatchEntriesByMatch(matchId); }
  async getMatchEntriesByPlayer(playerId: string): Promise<MatchEntry[]> { return (this.memStorage as any).getMatchEntriesByPlayer(playerId); }
  async getPayoutDistributionsByPool(poolId: string): Promise<PayoutDistribution[]> { return (this.memStorage as any).getPayoutDistributionsByPool(poolId); }
  async getPayoutDistributionsByPlayer(playerId: string): Promise<PayoutDistribution[]> { return (this.memStorage as any).getPayoutDistributionsByPlayer(playerId); }
  async getTeamRegistrationsByTeam(teamId: string): Promise<TeamRegistration[]> { return (this.memStorage as any).getTeamRegistrationsByTeam(teamId); }
  async getActiveTeamRegistrations(): Promise<TeamRegistration[]> { return (this.memStorage as any).getActiveTeamRegistrations(); }
  async getUploadedFilesByUploader(uploaderId: string): Promise<UploadedFile[]> { return (this.memStorage as any).getUploadedFilesByUploader(uploaderId); }
  async getUploadedFilesByType(fileType: string): Promise<UploadedFile[]> { return (this.memStorage as any).getUploadedFilesByType(fileType); }
  async getFileSharesByFile(fileId: string): Promise<FileShare[]> { return (this.memStorage as any).getFileSharesByFile(fileId); }
  async getFileSharesBySharedWith(sharedWithId: string): Promise<FileShare[]> { return (this.memStorage as any).getFileSharesBySharedWith(sharedWithId); }
  async getActiveFileShares(): Promise<FileShare[]> { return (this.memStorage as any).getActiveFileShares(); }
  async getWeightRulesByDivision(divisionId: string): Promise<WeightRule[]> { return (this.memStorage as any).getWeightRulesByDivision(divisionId); }
  async getActiveWeightRules(): Promise<WeightRule[]> { return (this.memStorage as any).getActiveWeightRules(); }
  async getTutoringSessionsByStudent(studentId: string): Promise<TutoringSession[]> { return (this.memStorage as any).getTutoringSessionsByStudent(studentId); }
  async getTutoringSessionsByTutor(tutorId: string): Promise<TutoringSession[]> { return this.memStorage.getTutoringSessionsByTutor(tutorId); }
  async getUpcomingTutoringSessions(): Promise<TutoringSession[]> { return (this.memStorage as any).getUpcomingTutoringSessions(); }
  async getTutoringCreditsByPlayer(playerId: string): Promise<TutoringCredits[]> { return (this.memStorage as any).getTutoringCreditsByPlayer(playerId); }
  async getActiveTutoringCredits(): Promise<TutoringCredits[]> { return (this.memStorage as any).getActiveTutoringCredits(); }
  async getCommissionRatesByOperator(operatorId: string): Promise<CommissionRate[]> { return this.memStorage.getCommissionRatesByOperator(operatorId); }
  async getActiveCommissionRates(): Promise<CommissionRate[]> { return (this.memStorage as any).getActiveCommissionRates(); }
  async getPlatformEarningsByPeriod(startDate: Date, endDate: Date): Promise<PlatformEarnings[]> { return (this.memStorage as any).getPlatformEarningsByPeriod(startDate, endDate); }
  async getRecentPlatformEarnings(days: number): Promise<PlatformEarnings[]> { return (this.memStorage as any).getRecentPlatformEarnings(days); }
  async getMembershipEarningsByPeriod(startDate: Date, endDate: Date): Promise<MembershipEarnings[]> { return (this.memStorage as any).getMembershipEarningsByPeriod(startDate, endDate); }
  async getRecentMembershipEarnings(days: number): Promise<MembershipEarnings[]> { return (this.memStorage as any).getRecentMembershipEarnings(days); }
  async getOperatorPayoutsByOperator(operatorId: string): Promise<OperatorPayout[]> { return this.memStorage.getOperatorPayoutsByOperator(operatorId); }
  async getPendingOperatorPayouts(): Promise<OperatorPayout[]> { return (this.memStorage as any).getPendingOperatorPayouts(); }
  async getMembershipSubscriptionByPlayerId(playerId: string): Promise<MembershipSubscription | undefined> {
    const results = await db.select().from(membershipSubscriptionsTable).where(eq(membershipSubscriptionsTable.playerId, playerId));
    return results[0];
  }
  async getMembershipSubscriptionsByPlayer(playerId: string): Promise<MembershipSubscription[]> {
    return await db.select().from(membershipSubscriptionsTable).where(eq(membershipSubscriptionsTable.playerId, playerId)).orderBy(desc(membershipSubscriptionsTable.createdAt));
  }
  async getActiveMembershipSubscriptions(): Promise<MembershipSubscription[]> {
    return await db.select().from(membershipSubscriptionsTable).where(eq(membershipSubscriptionsTable.status, "active")).orderBy(desc(membershipSubscriptionsTable.createdAt));
  }
  async getChallengesByStatus(status: string): Promise<Challenge[]> { return (this.memStorage as any).getChallengesByStatus(status); }
  async getChallengesByPlayer(playerId: string): Promise<Challenge[]> { return this.memStorage.getChallengesByPlayer(playerId); }
  async getChallengesByHall(hallId: string): Promise<Challenge[]> { return this.memStorage.getChallengesByHall(hallId); }
  async getUpcomingChallenges(limit?: number): Promise<Challenge[]> { return this.memStorage.getUpcomingChallenges(limit); }
  async getActiveChallenges(): Promise<Challenge[]> { return (this.memStorage as any).getActiveChallenges(); }
  async getChallengeFeesByChallenge(challengeId: string): Promise<ChallengeFee[]> { return this.memStorage.getChallengeFeesByChallenge(challengeId); }
  async getUnpaidChallengeFees(): Promise<ChallengeFee[]> { return (this.memStorage as any).getUnpaidChallengeFees(); }
  async getChallengeCheckInsByChallenge(challengeId: string): Promise<ChallengeCheckIn[]> { return this.memStorage.getChallengeCheckInsByChallenge(challengeId); }
  async getChallengeCheckInsByPlayer(playerId: string): Promise<ChallengeCheckIn[]> { return (this.memStorage as any).getChallengeCheckInsByPlayer(playerId); }
  async getChallengesPolicyByHall(hallId: string): Promise<ChallengePolicy | undefined> { return this.memStorage.getChallengesPolicyByHall(hallId); }
  async getActiveChallengePolicies(): Promise<ChallengePolicy[]> { return (this.memStorage as any).getActiveChallengePolicies(); }
  async getChallengePoliciesByType(policyType: string): Promise<ChallengePolicy[]> { return (this.memStorage as any).getChallengePoliciesByType(policyType); }
  async getActiveQrCodeNonces(): Promise<QrCodeNonce[]> { return (this.memStorage as any).getActiveQrCodeNonces(); }
  async getQrCodeNoncesByType(nonceType: string): Promise<QrCodeNonce[]> { return (this.memStorage as any).getQrCodeNoncesByType(nonceType); }
  async getIcalFeedTokensByPlayer(playerId: string): Promise<IcalFeedToken[]> { return this.memStorage.getIcalFeedTokensByPlayer(playerId); }
  async getActiveIcalFeedTokens(): Promise<IcalFeedToken[]> { return (this.memStorage as any).getActiveIcalFeedTokens(); }
  async getPaymentMethodsByPlayer(playerId: string): Promise<PaymentMethod[]> { return (this.memStorage as any).getPaymentMethodsByPlayer(playerId); }
  async getActivePaymentMethods(): Promise<PaymentMethod[]> { return (this.memStorage as any).getActivePaymentMethods(); }
  async getStakesHoldsByPlayer(playerId: string): Promise<StakesHold[]> { return this.memStorage.getStakesHoldsByPlayer(playerId); }
  async getActiveStakesHolds(): Promise<StakesHold[]> { return (this.memStorage as any).getActiveStakesHolds(); }
  async getNotificationSettingsByPlayer(playerId: string): Promise<NotificationSettings[]> { return (this.memStorage as any).getNotificationSettingsByPlayer(playerId); }
  async getNotificationDeliveriesByPlayer(playerId: string): Promise<NotificationDelivery[]> { return (this.memStorage as any).getNotificationDeliveriesByPlayer(playerId); }
  async getPendingNotificationDeliveries(): Promise<NotificationDelivery[]> { return (this.memStorage as any).getPendingNotificationDeliveries(); }
  async getDisputeResolutionsByDispute(disputeId: string): Promise<DisputeResolution[]> { return (this.memStorage as any).getDisputeResolutionsByDispute(disputeId); }
  async getPendingDisputeResolutions(): Promise<DisputeResolution[]> { return (this.memStorage as any).getPendingDisputeResolutions(); }
  async getPlayerCooldownsByPlayer(playerId: string): Promise<PlayerCooldown[]> { return this.memStorage.getPlayerCooldownsByPlayer(playerId); }
  async getActivePlayerCooldowns(): Promise<PlayerCooldown[]> { return (this.memStorage as any).getActivePlayerCooldowns(); }
  async getDeviceAttestationsByDevice(deviceId: string): Promise<DeviceAttestation[]> { return (this.memStorage as any).getDeviceAttestationsByDevice(deviceId); }
  async getValidDeviceAttestations(): Promise<DeviceAttestation[]> { return (this.memStorage as any).getValidDeviceAttestations(); }
  async getPendingJobQueues(): Promise<JobQueue[]> { return (this.memStorage as any).getPendingJobQueues(); }
  async getJobQueuesByType(jobType: string): Promise<JobQueue[]> { return (this.memStorage as any).getJobQueuesByType(jobType); }
  async getFailedJobQueues(): Promise<JobQueue[]> { return (this.memStorage as any).getFailedJobQueues(); }
  async getSystemMetricsByType(metricType: string): Promise<SystemMetric[]> { return this.memStorage.getSystemMetricsByType(metricType); }
  async getRecentSystemMetrics(hours: number): Promise<SystemMetric[]> { return (this.memStorage as any).getRecentSystemMetrics(hours); }
  async getSystemAlertsByType(alertType: string): Promise<SystemAlert[]> { return this.memStorage.getSystemAlertsByType(alertType); }
  async getActiveAlerts(): Promise<SystemAlert[]> { return this.memStorage.getActiveAlerts(); }
  async getFiringAlerts(): Promise<SystemAlert[]> { return this.memStorage.getFiringAlerts(); }
  async triggerAlert(alertId: string): Promise<SystemAlert | undefined> { return this.memStorage.triggerAlert(alertId); }
  async resolveAlert(alertId: string, resolvedBy: string): Promise<SystemAlert | undefined> { return this.memStorage.resolveAlert(alertId, resolvedBy); }

  // === AI COACH TRAINING ANALYTICS ===

  // Session Management
  async createTrainingSession(session: InsertSessionAnalytics): Promise<SelectSessionAnalytics> {
    const [created] = await db.insert(sessionAnalytics).values(session).returning();
    return created;
  }

  async getTrainingSession(sessionId: string): Promise<SelectSessionAnalytics | null> {
    const results = await db.select().from(sessionAnalytics).where(eq(sessionAnalytics.id, sessionId));
    return results[0] || null;
  }

  async getPlayerSessions(playerId: string, limit?: number): Promise<SelectSessionAnalytics[]> {
    const query = db.select().from(sessionAnalytics).where(eq(sessionAnalytics.playerId, playerId));
    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  // Shot Recording
  async recordShots(sessionId: string, shotsData: InsertShot[]): Promise<SelectShot[]> {
    const shotsWithSession = shotsData.map(shot => ({ ...shot, sessionId }));
    const created = await db.insert(shots).values(shotsWithSession).returning();
    return created;
  }

  async getSessionShots(sessionId: string): Promise<SelectShot[]> {
    return await db.select().from(shots).where(eq(shots.sessionId, sessionId));
  }

  // Monthly Scores & Leaderboard
  async calculateMonthlyScores(period: string): Promise<void> {
    // This would involve complex aggregation logic
    // For now, this is a placeholder that would be implemented based on business logic
    // The actual implementation would aggregate session data and update ladderTrainingScores table
  }

  async getHallLeaderboard(hallId: string, period: string): Promise<SelectLadderTrainingScore[]> {
    return await db
      .select()
      .from(ladderTrainingScores)
      .where(and(
        eq(ladderTrainingScores.hallId, hallId),
        eq(ladderTrainingScores.period, period)
      ))
      .orderBy(desc(ladderTrainingScores.rank));
  }

  async getPlayerTrainingScore(playerId: string, period: string): Promise<SelectLadderTrainingScore | null> {
    const results = await db
      .select()
      .from(ladderTrainingScores)
      .where(and(
        eq(ladderTrainingScores.playerId, playerId),
        eq(ladderTrainingScores.period, period)
      ));
    return results[0] || null;
  }

  // Reward Management
  async createReward(reward: InsertSubscriptionReward): Promise<SelectSubscriptionReward> {
    const [created] = await db.insert(subscriptionRewards).values(reward).returning();
    return created;
  }

  async getRewardsForPeriod(period: string): Promise<SelectSubscriptionReward[]> {
    return await db.select().from(subscriptionRewards).where(eq(subscriptionRewards.period, period));
  }

  async markRewardApplied(rewardId: string, stripeCouponId: string): Promise<void> {
    await db.update(subscriptionRewards)
      .set({
        appliedToStripe: true,
        stripeCouponId: stripeCouponId,
        appliedDate: new Date()
      })
      .where(eq(subscriptionRewards.id, rewardId));
  }

  // ── Missing methods delegated to memStorage ──────────────────────────────
  async getOrganization(id: string) { return this.memStorage.getOrganization(id); }
  async getAllOrganizations() { return this.memStorage.getAllOrganizations(); }
  async createOrganization(org: any) { return this.memStorage.createOrganization(org); }
  async updateOrganization(id: string, updates: any) { return this.memStorage.updateOrganization(id, updates); }
  async getAllPayoutTransfers() { return this.memStorage.getAllPayoutTransfers(); }
  async getPayoutTransfer(id: string) { return this.memStorage.getPayoutTransfer(id); }
  async createPayoutTransfer(transfer: any) { return this.memStorage.createPayoutTransfer(transfer); }
  async getAllHallMatches() { return this.memStorage.getAllHallMatches(); }
  async getRosterByHall(hallId: string) { return this.memStorage.getRosterByHall(hallId); }
  async getRosterByPlayer(playerId: string) { return this.memStorage.getRosterByPlayer(playerId); }
  async unlockHallBattles(hallId: string, unlockedBy: string) { return this.memStorage.unlockHallBattles(hallId, unlockedBy); }
  async lockHallBattles(hallId: string) { return this.memStorage.lockHallBattles(hallId); }
  // ── Auto-generated delegation stubs for IStorage compliance ──
  async getPayoutTransfersByInvoice(invoiceId: string): Promise<any> { return (this.memStorage as any).getPayoutTransfersByInvoice(invoiceId); }
  async getAllMatches(): Promise<any> { return (this.memStorage as any).getAllMatches(); }
  async getAllTournaments(): Promise<any> { return (this.memStorage as any).getAllTournaments(); }
  async getAllKellyPools(): Promise<any> { return (this.memStorage as any).getAllKellyPools(); }
  async getAllBounties(): Promise<any> { return (this.memStorage as any).getAllBounties(); }
  async getAllCharityEvents(): Promise<any> { return (this.memStorage as any).getAllCharityEvents(); }
  async getAllSupportRequests(): Promise<any> { return (this.memStorage as any).getAllSupportRequests(); }
  async getAllLiveStreams(): Promise<any> { return (this.memStorage as any).getAllLiveStreams(); }
  async getLiveStreamsByLocation(city?: string, state?: string): Promise<any> { return (this.memStorage as any).getLiveStreamsByLocation(city, state); }
  async getLiveStreamStats(): Promise<any> { return (this.memStorage as any).getLiveStreamStats(); }
  async getAllHallRosters(): Promise<any> { return (this.memStorage as any).getAllHallRosters(); }
  async getAllRookieMatches(): Promise<any> { return (this.memStorage as any).getAllRookieMatches(); }
  async getAllRookieEvents(): Promise<any> { return (this.memStorage as any).getAllRookieEvents(); }
  async getAllRookieSubscriptions(): Promise<any> { return (this.memStorage as any).getAllRookieSubscriptions(); }
  async getRookieLeaderboard(): Promise<any> { return (this.memStorage as any).getRookieLeaderboard(); }
  async promoteRookieToMainLadder(playerId: string): Promise<any> { return (this.memStorage as any).promoteRookieToMainLadder(playerId); }
  async creditWallet(userId: string, amount: number): Promise<any> { return (this.memStorage as any).creditWallet(userId, amount); }
  async lockCredits(userId: string, amount: number): Promise<any> { return (this.memStorage as any).lockCredits(userId, amount); }
  async unlockCredits(userId: string, amount: number): Promise<any> { return (this.memStorage as any).unlockCredits(userId, amount); }
  async addCredits(userId: string, amount: number): Promise<any> { return (this.memStorage as any).addCredits(userId, amount); }
  async processDelayedPayouts(potId: string, winningSide: string): Promise<any> { return (this.memStorage as any).processDelayedPayouts(potId, winningSide); }
  async getAllChallengePools(): Promise<any> { return (this.memStorage as any).getAllChallengePools(); }
  async getSideBet(id: string): Promise<any> { return (this.memStorage as any).getSideBet(id); }
  async getSideBetsByPot(challengePoolId: string): Promise<any> { return (this.memStorage as any).getSideBetsByPot(challengePoolId); }
  async getSideBetsByUser(userId: string): Promise<any> { return (this.memStorage as any).getSideBetsByUser(userId); }
  async createSideBet(insertBet: InsertSideBet): Promise<any> { return (this.memStorage as any).createSideBet(insertBet); }
  async updateSideBet(id: string, updates: Partial<SideBet>): Promise<any> { return (this.memStorage as any).updateSideBet(id, updates); }
  async getLedgerByUser(userId: string): Promise<any> { return (this.memStorage as any).getLedgerByUser(userId); }
  async getResolutionByPot(challengePoolId: string): Promise<any> { return (this.memStorage as any).getResolutionByPot(challengePoolId); }
  async getTeamsByOperator(operatorId: string): Promise<any> { return (this.memStorage as any).getTeamsByOperator(operatorId); }
  async getTeamsByHall(hallId: string): Promise<any> { return (this.memStorage as any).getTeamsByHall(hallId); }
  async removeTeamPlayer(id: string): Promise<any> { return (this.memStorage as any).removeTeamPlayer(id); }
  async getTeamMatchesByOperator(operatorId: string): Promise<any> { return (this.memStorage as any).getTeamMatchesByOperator(operatorId); }
  async getAllTeamChallenges(): Promise<any> { return (this.memStorage as any).getAllTeamChallenges(); }
  async getTeamChallengesByOperator(operatorId: string): Promise<any> { return (this.memStorage as any).getTeamChallengesByOperator(operatorId); }
  async getTeamChallengesByType(challengeType: string): Promise<any> { return (this.memStorage as any).getTeamChallengesByType(challengeType); }
  async getTeamChallengesByStatus(status: string): Promise<any> { return (this.memStorage as any).getTeamChallengesByStatus(status); }
  async acceptTeamChallenge(challengeId: string, acceptingTeamId: string): Promise<any> { return (this.memStorage as any).acceptTeamChallenge(challengeId, acceptingTeamId); }
  async calculateTeamChallengeStake(...args: any[]): Promise<any> { return (this.memStorage as any).calculateTeamChallengeStake(...args); }
  async validateProMembership(playerId: string): Promise<any> { return (this.memStorage as any).validateProMembership(playerId); }
  async createTeamChallengeWithParticipants(
    challengeData: InsertTeamChallenge,
    teamPlayers: string[]
  ): Promise<any> {
    return (this.memStorage as any).createTeamChallengeWithParticipants(
      challengeData, teamPlayers);
  }
  async getTeamRegistrationsByDivision(divisionId: string): Promise<any> { return (this.memStorage as any).getTeamRegistrationsByDivision(divisionId); }
  async checkinUser(data: InsertCheckin): Promise<any> { return (this.memStorage as any).checkinUser(data); }
  async getCheckinsBySession(sessionId: string): Promise<any> { return (this.memStorage as any).getCheckinsBySession(sessionId); }
  async getCheckinsByVenue(venueId: string): Promise<any> { return (this.memStorage as any).getCheckinsByVenue(venueId); }
  async getActiveCheckins(sessionId: string, venueId: string): Promise<any> { return (this.memStorage as any).getActiveCheckins(sessionId, venueId); }
  async getActiveVotes(sessionId: string, venueId: string): Promise<any> { return (this.memStorage as any).getActiveVotes(sessionId, venueId); }
  async closeAttitudeVote(id: string, result: string): Promise<any> { return (this.memStorage as any).closeAttitudeVote(id, result); }
  async getBallotsByVote(voteId: string): Promise<any> { return (this.memStorage as any).getBallotsByVote(voteId); }
  async hasUserVoted(voteId: string, userId: string): Promise<any> { return (this.memStorage as any).hasUserVoted(voteId, userId); }
  async calculateVoteWeights(voteId: string): Promise<any> { return (this.memStorage as any).calculateVoteWeights(voteId); }
  async checkVoteQuorum(voteId: string): Promise<any> { return (this.memStorage as any).checkVoteQuorum(voteId); }
  async getIncidentsByUser(userId: string): Promise<any> { return (this.memStorage as any).getIncidentsByUser(userId); }
  async getRecentIncidents(venueId: string, hours: number): Promise<any> { return (this.memStorage as any).getRecentIncidents(venueId, hours); }
  async canUserBeVotedOn(userId: string, sessionId: string): Promise<any> { return (this.memStorage as any).canUserBeVotedOn(userId, sessionId); }
  async getLastVoteForUser(userId: string, sessionId: string): Promise<any> { return (this.memStorage as any).getLastVoteForUser(userId, sessionId); }
  async isUserImmune(userId: string, sessionId: string): Promise<any> { return (this.memStorage as any).isUserImmune(userId, sessionId); }
  async getUploadedFileByPath(objectPath: string): Promise<any> { return (this.memStorage as any).getUploadedFileByPath(objectPath); }
  async getUserUploadedFiles(userId: string, category?: string): Promise<any> { return (this.memStorage as any).getUserUploadedFiles(userId, category); }
  async getAllUploadedFiles(): Promise<any> { return (this.memStorage as any).getAllUploadedFiles(); }
  async incrementFileDownloadCount(id: string): Promise<any> { return (this.memStorage as any).incrementFileDownloadCount(id); }
  async getUserSharedFiles(userId: string): Promise<any> { return (this.memStorage as any).getUserSharedFiles(userId); }
  async getWeightRulesByPlayer(playerId: string): Promise<any> { return (this.memStorage as any).getWeightRulesByPlayer(playerId); }
  async getTutoringSessionsByRookie(rookieId: string): Promise<any> { return (this.memStorage as any).getTutoringSessionsByRookie(rookieId); }
  async getTutoringCreditsByTutor(tutorId: string): Promise<any> { return (this.memStorage as any).getTutoringCreditsByTutor(tutorId); }
  async getPlatformEarningsByOperator(operatorId: string): Promise<any> { return (this.memStorage as any).getPlatformEarningsByOperator(operatorId); }
  async getMembershipEarningsByOperator(operatorId: string): Promise<any> { return (this.memStorage as any).getMembershipEarningsByOperator(operatorId); }
  async getIcalFeedTokenByToken(token: string): Promise<any> { return (this.memStorage as any).getIcalFeedTokenByToken(token); }
  async revokeIcalFeedToken(id: string, revokedBy: string, reason?: string): Promise<any> { return (this.memStorage as any).revokeIcalFeedToken(id, revokedBy, reason); }
  async markTokenUsed(token: string): Promise<any> { return (this.memStorage as any).markTokenUsed(token); }
  async cleanupExpiredTokens(): Promise<any> { return (this.memStorage as any).cleanupExpiredTokens(); }
  async getPaymentMethodsByUser(userId: string): Promise<any> { return (this.memStorage as any).getPaymentMethodsByUser(userId); }
  async getDefaultPaymentMethod(userId: string): Promise<any> { return (this.memStorage as any).getDefaultPaymentMethod(userId); }
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<any> { return (this.memStorage as any).setDefaultPaymentMethod(userId, paymentMethodId); }
  async deactivatePaymentMethod(id: string): Promise<any> { return (this.memStorage as any).deactivatePaymentMethod(id); }
  async getStakesHoldsByChallenge(challengeId: string): Promise<any> { return (this.memStorage as any).getStakesHoldsByChallenge(challengeId); }
  async getStakesHoldsByStatus(status: string): Promise<any> { return (this.memStorage as any).getStakesHoldsByStatus(status); }
  async getExpiringStakesHolds(hours: number = 24): Promise<any> { return (this.memStorage as any).getExpiringStakesHolds(hours); }
  async captureStakesHold(id: string, reason?: string): Promise<any> { return (this.memStorage as any).captureStakesHold(id, reason); }
  async releaseStakesHold(id: string, reason?: string): Promise<any> { return (this.memStorage as any).releaseStakesHold(id, reason); }
  async getNotificationDeliveriesByUser(userId: string): Promise<any> { return (this.memStorage as any).getNotificationDeliveriesByUser(userId); }
  async getNotificationDeliveriesByChallenge(challengeId: string): Promise<any> { return (this.memStorage as any).getNotificationDeliveriesByChallenge(challengeId); }
  async getNotificationDeliveriesByStatus(status: string): Promise<any> { return (this.memStorage as any).getNotificationDeliveriesByStatus(status); }
  async markNotificationDelivered(id: string, providerId?: string): Promise<any> { return (this.memStorage as any).markNotificationDelivered(id, providerId); }
  async markNotificationFailed(id: string, errorMessage: string): Promise<any> { return (this.memStorage as any).markNotificationFailed(id, errorMessage); }
  async getDisputeResolutionsByChallenge(challengeId: string): Promise<any> { return (this.memStorage as any).getDisputeResolutionsByChallenge(challengeId); }
  async getDisputeResolutionsByPlayer(playerId: string): Promise<any> { return (this.memStorage as any).getDisputeResolutionsByPlayer(playerId); }
  async getDisputeResolutionsByStatus(status: string): Promise<any> { return (this.memStorage as any).getDisputeResolutionsByStatus(status); }
  async resolveDispute(id: string, resolution: string, resolvedBy: string, action?: string): Promise<any> { return (this.memStorage as any).resolveDispute(id, resolution, resolvedBy, action); }
  async addDisputeEvidence(id: string, evidenceUrls: string[], evidenceTypes: string[], notes?: string): Promise<any> { return (this.memStorage as any).addDisputeEvidence(id, evidenceUrls, evidenceTypes, notes); }
  async getActiveCooldowns(): Promise<any> { return (this.memStorage as any).getActiveCooldowns(); }
  async getExpiringCooldowns(hours: number = 24): Promise<any> { return (this.memStorage as any).getExpiringCooldowns(hours); }
  async liftPlayerCooldown(id: string, liftedBy: string, reason: string): Promise<any> { return (this.memStorage as any).liftPlayerCooldown(id, liftedBy, reason); }
  async checkPlayerEligibility(playerId: string): Promise<any> { return (this.memStorage as any).checkPlayerEligibility(playerId); }
  async getDeviceAttestationsByPlayer(playerId: string): Promise<any> { return (this.memStorage as any).getDeviceAttestationsByPlayer(playerId); }
  async getDeviceAttestationsByChallenge(challengeId: string): Promise<any> { return (this.memStorage as any).getDeviceAttestationsByChallenge(challengeId); }
  async getHighRiskAttestations(threshold: number = 0.8): Promise<any> { return (this.memStorage as any).getHighRiskAttestations(threshold); }
  async getJob(id: string): Promise<any> { return (this.memStorage as any).getJob(id); }
  async getJobsByType(jobType: string): Promise<any> { return (this.memStorage as any).getJobsByType(jobType); }
  async getJobsByStatus(status: string): Promise<any> { return (this.memStorage as any).getJobsByStatus(status); }
  async getPendingJobs(limit: number = 50): Promise<any> { return (this.memStorage as any).getPendingJobs(limit); }
  async getFailedJobs(limit: number = 50): Promise<any> { return (this.memStorage as any).getFailedJobs(limit); }
  async createJob(insertJob: InsertJobQueue): Promise<any> { return (this.memStorage as any).createJob(insertJob); }
  async updateJob(id: string, updates: Partial<JobQueue>): Promise<any> { return (this.memStorage as any).updateJob(id, updates); }
  async markJobStarted(id: string, processedBy: string): Promise<any> { return (this.memStorage as any).markJobStarted(id, processedBy); }
  async markJobCompleted(id: string, result?: any): Promise<any> { return (this.memStorage as any).markJobCompleted(id, result); }
  async markJobFailed(id: string, errorMessage: string): Promise<any> { return (this.memStorage as any).markJobFailed(id, errorMessage); }
  async requeueJob(id: string): Promise<any> { return (this.memStorage as any).requeueJob(id); }
  async cleanupCompletedJobs(olderThanDays: number = 7): Promise<any> { return (this.memStorage as any).cleanupCompletedJobs(olderThanDays); }
  async getSystemMetricsByTimeWindow(windowStart: Date, windowEnd: Date, metricType?: string): Promise<any> { return (this.memStorage as any).getSystemMetricsByTimeWindow(windowStart, windowEnd, metricType); }
  async aggregateMetrics(metricType: string, timeWindow: string, startDate: Date, endDate: Date): Promise<any> { return (this.memStorage as any).aggregateMetrics(metricType, timeWindow, startDate, endDate); }
  async getPrizePool(...args: any[]): Promise<any> { return (this.memStorage as any).getPrizePool(...args); }
  async getPrizePoolByPoolId(...args: any[]): Promise<any> { return (this.memStorage as any).getPrizePoolByPoolId(...args); }
  async getPrizePoolsByHall(...args: any[]): Promise<any> { return (this.memStorage as any).getPrizePoolsByHall(...args); }
  async getPrizePoolsByPeriod(...args: any[]): Promise<any> { return (this.memStorage as any).getPrizePoolsByPeriod(...args); }
  async getPrizePoolsByStatus(...args: any[]): Promise<any> { return (this.memStorage as any).getPrizePoolsByStatus(...args); }
  async createPrizePool(...args: any[]): Promise<any> { return (this.memStorage as any).createPrizePool(...args); }
  async updatePrizePool(...args: any[]): Promise<any> { return (this.memStorage as any).updatePrizePool(...args); }
  async lockPrizePool(...args: any[]): Promise<any> { return (this.memStorage as any).lockPrizePool(...args); }
  async getPrizePoolContribution(...args: any[]): Promise<any> { return (this.memStorage as any).getPrizePoolContribution(...args); }
  async getPrizePoolContributionsByPoolId(...args: any[]): Promise<any> { return (this.memStorage as any).getPrizePoolContributionsByPoolId(...args); }
  async getPrizePoolContributionsByPlayer(...args: any[]): Promise<any> { return (this.memStorage as any).getPrizePoolContributionsByPlayer(...args); }
  async createPrizePoolContribution(...args: any[]): Promise<any> { return (this.memStorage as any).createPrizePoolContribution(...args); }
  async aggregatePrizePoolContributions(...args: any[]): Promise<any> { return (this.memStorage as any).aggregatePrizePoolContributions(...args); }
  async getPrizePoolDistribution(...args: any[]): Promise<any> { return (this.memStorage as any).getPrizePoolDistribution(...args); }
  async getPrizePoolDistributionsByPoolId(...args: any[]): Promise<any> { return (this.memStorage as any).getPrizePoolDistributionsByPoolId(...args); }
  async getPrizePoolDistributionsByRecipient(...args: any[]): Promise<any> { return (this.memStorage as any).getPrizePoolDistributionsByRecipient(...args); }
  async getPrizePoolDistributionsByStatus(...args: any[]): Promise<any> { return (this.memStorage as any).getPrizePoolDistributionsByStatus(...args); }
  async createPrizePoolDistribution(...args: any[]): Promise<any> { return (this.memStorage as any).createPrizePoolDistribution(...args); }
  async updatePrizePoolDistribution(...args: any[]): Promise<any> { return (this.memStorage as any).updatePrizePoolDistribution(...args); }
  async markDistributionCompleted(...args: any[]): Promise<any> { return (this.memStorage as any).markDistributionCompleted(...args); }
  async markDistributionFailed(...args: any[]): Promise<any> { return (this.memStorage as any).markDistributionFailed(...args); }

}

export const storage = new DatabaseStorage();
