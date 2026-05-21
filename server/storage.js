"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.DatabaseStorage = exports.MemStorage = void 0;
var schema_1 = require("@shared/schema");
var db_1 = require("./config/db");
var drizzle_orm_1 = require("drizzle-orm");
var crypto_1 = require("crypto");
// Utility function to safely merge objects without undefined values
function assignNoUndefined(base, updates) {
    var out = __assign({}, base);
    for (var k in updates) {
        if (updates[k] !== undefined) {
            out[k] = updates[k];
        }
    }
    return out;
}
// Helper to ensure nullable fields are properly set to null instead of undefined
function nullifyUndefined(value) {
    return value === undefined ? null : value;
}
// Centralized nullable field registry based on schema  
var NULLABLE_FIELDS = {
    Player: ["city", "theme", "birthday", "stripeCustomerId", "userId", "rookiePassExpiresAt", "graduatedAt"],
    Match: ["notes", "winner", "commission", "reportedAt"],
    Tournament: ["stripeProductId"],
    SidePot: ["matchId", "creatorId", "sideALabel", "sideBLabel", "lockCutoffAt", "description", "evidenceJson", "verificationSource", "customCreatedBy", "winningSide", "resolvedAt", "disputeDeadline", "autoResolvedAt"],
    Wallet: [],
    SideBet: ["challengePoolId", "userId", "side", "fundedAt"],
    Resolution: ["challengePoolId", "winnerSide", "decidedBy", "notes"],
    User: [],
    Organization: [],
    OperatorSettings: ["customBranding", "freeMonthsGrantedBy", "freeMonthsGrantedAt"],
    KellyPool: ["table"],
    Bounty: ["rank", "targetId", "description"],
    CharityEvent: ["description"],
    SupportRequest: ["description", "amount"],
    LiveStream: ["title", "matchId", "hallMatchId", "tournamentId", "streamerId", "embedUrl", "thumbnailUrl", "lastLiveAt"],
    PoolHall: ["description", "address", "phone", "unlockedBy", "unlockedAt"],
    HallMatch: ["winnerHallId", "scheduledDate", "completedAt", "notes"],
    HallRoster: ["position"],
    RookieMatch: ["notes", "winner", "reportedAt"],
    RookieEvent: ["description"],
    RookieSubscription: ["expiresAt", "cancelledAt"],
    Team: ["hallId"],
    TeamPlayer: ["position"],
    TeamMatch: ["winnerTeamId", "putUpRound", "scheduledAt", "completedAt"],
    TeamSet: ["winnerId", "loserId", "putUpType", "completedAt", "clipUrl"],
    TeamChallenge: ["description", "acceptingTeamId", "challengePoolId", "winnerId", "completedAt", "expiresAt"],
    TeamChallengeParticipant: [],
    AttitudeVote: ["result"],
    OperatorSubscription: ["nextBillingDate"],
    MembershipSubscription: ["stripeCustomerId", "currentPeriodStart", "currentPeriodEnd"],
    TeamStripeAccount: ["businessType", "email", "lastOnboardingRefresh"],
    MatchEntry: ["awayTeamId", "stripeCheckoutSessionId", "stripePaymentIntentId", "winnerId", "scheduledAt", "completedAt", "venueId", "streamUrl", "captainHomeId", "captainAwayId"],
    PayoutDistribution: ["stripeTransferId", "transferredAt", "operatorTierAtPayout", "revenueSplitAtPayout", "notes"],
    TeamRegistration: ["logoUrl", "stripePaymentIntentId", "confirmedAt", "bracketPosition", "seedRank", "venueId", "seasonId"],
    UploadedFile: ["description", "lastAccessedAt"],
    FileShare: ["sharedWithUserId", "sharedWithRole", "sharedWithHallId", "expiresAt"],
    WeightRule: ["lastLossAt"],
    TutoringSession: ["notes", "completedAt"],
    Challenge: ["checkedInAt", "completedAt", "winnerId", "posterImageUrl", "description", "updatedAt"],
    ChallengeFee: ["actualAt", "stripeChargeId", "stripeCustomerId", "chargedAt", "waivedAt", "waivedBy", "waiverReason"],
    ChallengeCheckIn: ["checkedInBy", "location"],
    ChallengePolicy: [],
    IcalFeedToken: ["name", "lastUsedAt", "hallId", "expiresAt", "revokedAt", "revokedBy", "revokeReason"],
    PaymentMethod: ["stripeSetupIntentId", "brand", "last4", "expiryMonth", "expiryYear", "metadata"],
    StakesHold: ["capturedAt", "releasedAt", "captureReason", "releaseReason", "metadata"],
    NotificationSettings: ["emailAddress", "phoneNumber"],
    NotificationDelivery: ["challengeId", "providerId", "errorMessage", "sentAt", "deliveredAt", "metadata"],
    DisputeResolution: ["challengeFeeId", "filedAgainst", "evidenceNotes", "resolution", "resolvedBy", "resolutionAction", "operatorNotes", "resolvedAt", "auditLog"],
    PlayerCooldown: ["liftedAt", "liftedBy", "liftReason", "metadata"],
    DeviceAttestation: ["geolocation", "distanceFromHall", "ipAddress", "userAgent", "scannerStaffId"],
    JobQueue: ["processedBy", "startedAt", "completedAt", "errorMessage", "result", "metadata"],
    SystemMetric: ["hallId", "metadata"],
    SystemAlert: ["currentValue", "lastTriggered", "metadata"],
};
// Centralized update helper that handles nullable fields properly
function applyUpdate(base, updates, nullableKeys) {
    var normalized = Object.fromEntries(Object.entries(updates).map(function (_a) {
        var k = _a[0], v = _a[1];
        return [
            k,
            nullableKeys.includes(k) ? (v === undefined ? null : v) : v
        ];
    }));
    return assignNoUndefined(base, normalized);
}
// Generic update helper for Map-based storage
function updateMapRecord(map, id, updates, nullable) {
    var cur = map.get(id);
    if (!cur)
        return undefined;
    var next = applyUpdate(cur, updates, nullable);
    map.set(id, next);
    return next;
}
var MemStorage = /** @class */ (function () {
    function MemStorage() {
        this.users = new Map();
        this.organizations = new Map();
        this.payoutTransfers = new Map();
        this.players = new Map();
        this.matches = new Map();
        this.tournaments = new Map();
        this.tournamentCalcuttas = new Map();
        this.calcuttaBids = new Map();
        this.seasonPredictions = new Map();
        this.predictionEntries = new Map();
        this.addedMoneyFunds = new Map();
        this.kellyPools = new Map();
        this.moneyGames = new Map();
        this.bounties = new Map();
        this.charityEvents = new Map();
        this.supportRequests = new Map();
        this.liveStreams = new Map();
        this.poolHalls = new Map();
        this.hallMatches = new Map();
        this.rookieMatches = new Map();
        this.rookieEvents = new Map();
        this.rookieAchievements = new Map();
        this.rookieSubscriptions = new Map();
        this.hallRosters = new Map();
        this.webhookEvents = new Map();
        this.operatorSettings = new Map(); // keyed by operatorUserId
        // Side Betting Storage
        this.wallets = new Map(); // keyed by userId
        this.sidePots = new Map();
        this.sideBets = new Map();
        this.ledgerEntries = new Map();
        this.resolutions = new Map();
        // Operator Subscription Storage
        this.operatorSubscriptions = new Map(); // keyed by operatorId
        this.operatorSubscriptionSplits = new Map(); // keyed by split id
        // Team Division Storage
        this.teams = new Map();
        this.teamPlayers = new Map();
        this.teamMatches = new Map();
        this.teamSets = new Map();
        // Team Challenge Storage
        this.teamChallenges = new Map();
        this.teamChallengeParticipants = new Map();
        // === SPORTSMANSHIP VOTE-OUT SYSTEM ===
        this.checkins = new Map();
        this.attitudeVotes = new Map();
        this.attitudeBallots = new Map();
        this.incidents = new Map();
        // === MATCH DIVISION SYSTEM ===
        this.matchDivisions = new Map();
        this.operatorTiers = new Map();
        // === TEAM STRIPE & EARNINGS SYSTEM ===
        this.teamStripeAccounts = new Map();
        this.matchEntries = new Map();
        this.payoutDistributions = new Map();
        this.teamRegistrations = new Map();
        // === FILE MANAGEMENT SYSTEM ===
        this.uploadedFiles = new Map();
        this.fileShares = new Map();
        // === WEIGHT RULES & TUTORING SYSTEM ===
        this.weightRules = new Map();
        this.tutoringSessions = new Map();
        this.tutoringCredits = new Map();
        // === COMMISSION & EARNINGS TRACKING ===
        this.commissionRates = new Map();
        this.platformEarnings = new Map();
        this.membershipEarnings = new Map();
        this.operatorPayouts = new Map();
        // === MEMBERSHIP SUBSCRIPTIONS ===
        this.membershipSubscriptions = new Map();
        // === CHALLENGE SYSTEM ===
        this.challenges = new Map();
        this.challengeFees = new Map();
        this.challengeCheckIns = new Map();
        this.challengePolicies = new Map();
        // === QR CODE & ICAL SYSTEMS ===
        this.qrCodeNonces = new Map();
        this.icalFeedTokens = new Map();
        // === PAYMENT METHODS & STAKES ===
        this.paymentMethods = new Map();
        this.stakesHolds = new Map();
        // === NOTIFICATION SYSTEM ===
        this.notificationSettings = new Map();
        this.notificationDeliveries = new Map();
        // === DISPUTE MANAGEMENT ===
        this.disputeResolutions = new Map();
        // === ANTI-ABUSE SYSTEM ===
        this.playerCooldowns = new Map();
        this.deviceAttestations = new Map();
        // === JOB QUEUE & SYSTEM METRICS ===
        this.jobQueue = new Map();
        this.systemMetrics = new Map();
        this.systemAlerts = new Map();
        // === BAN APPEALS ===
        this.banAppeals = new Map();
        // Initialize with seed data for demonstration (disabled in production)
        if (process.env.NODE_ENV === "development") {
            this.initializeSeedData();
        }
    }
    // User Management Methods
    MemStorage.prototype.getUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.users.get(id)];
            });
        });
    };
    MemStorage.prototype.getUserByEmail = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.users.values()).find(function (user) { return user.email === email; })];
            });
        });
    };
    MemStorage.prototype.getUserByVerificationToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.users.values()).find(function (user) { return user.verificationToken === token; })];
            });
        });
    };
    MemStorage.prototype.getUserByStripeConnectId = function (stripeConnectId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.users.values()).find(function (user) { return user.stripeConnectId === stripeConnectId; })];
            });
        });
    };
    MemStorage.prototype.getAllUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.users.values())];
            });
        });
    };
    MemStorage.prototype.getStaffUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.users.values()).filter(function (user) {
                        return user.globalRole === "STAFF" || user.globalRole === "OWNER";
                    })];
            });
        });
    };
    MemStorage.prototype.createUser = function (insertUser) {
        return __awaiter(this, void 0, void 0, function () {
            var id, user;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                id = (0, crypto_1.randomUUID)();
                user = {
                    id: id,
                    email: insertUser.email,
                    name: insertUser.name,
                    passwordHash: insertUser.passwordHash,
                    twoFactorEnabled: (_a = insertUser.twoFactorEnabled) !== null && _a !== void 0 ? _a : false,
                    twoFactorSecret: insertUser.twoFactorSecret,
                    phoneNumber: insertUser.phoneNumber,
                    globalRole: insertUser.globalRole,
                    role: insertUser.role,
                    profileComplete: (_b = insertUser.profileComplete) !== null && _b !== void 0 ? _b : false,
                    onboardingComplete: (_c = insertUser.onboardingComplete) !== null && _c !== void 0 ? _c : false,
                    accountStatus: (_d = insertUser.accountStatus) !== null && _d !== void 0 ? _d : "active",
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
                return [2 /*return*/, user];
            });
        });
    };
    MemStorage.prototype.updateUser = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, updateMapRecord(this.users, id, __assign(__assign({}, updates), { updatedAt: new Date() }), NULLABLE_FIELDS.User)];
            });
        });
    };
    MemStorage.prototype.touchUserActivity = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                user = this.users.get(id);
                if (!user)
                    return [2 /*return*/];
                this.users.set(id, __assign(__assign({}, user), { lastActivityAt: new Date() }));
                return [2 /*return*/];
            });
        });
    };
    MemStorage.prototype.getActivePlayerCountByHall = function (hallId) {
        return __awaiter(this, void 0, void 0, function () {
            var ACTIVE_PLAYER_CONFIG, now, windowMs, minAgeMs, roster, seenUsers, _i, roster_1, entry, player, user, createdAt, lastActivity;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require("./config/activePlayer"); })];
                    case 1:
                        ACTIVE_PLAYER_CONFIG = (_a.sent()).ACTIVE_PLAYER_CONFIG;
                        now = Date.now();
                        windowMs = ACTIVE_PLAYER_CONFIG.ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000;
                        minAgeMs = ACTIVE_PLAYER_CONFIG.MIN_ACCOUNT_AGE_HOURS * 60 * 60 * 1000;
                        return [4 /*yield*/, this.getRosterByHall(hallId)];
                    case 2:
                        roster = _a.sent();
                        seenUsers = new Set();
                        for (_i = 0, roster_1 = roster; _i < roster_1.length; _i++) {
                            entry = roster_1[_i];
                            player = this.players.get(entry.playerId);
                            if (!(player === null || player === void 0 ? void 0 : player.userId))
                                continue;
                            if (seenUsers.has(player.userId))
                                continue;
                            user = this.users.get(player.userId);
                            if (!user)
                                continue;
                            if (ACTIVE_PLAYER_CONFIG.EXCLUDE_BANNED && user.accountStatus === "banned")
                                continue;
                            if (ACTIVE_PLAYER_CONFIG.EXCLUDE_SUSPENDED && user.accountStatus === "suspended")
                                continue;
                            if (ACTIVE_PLAYER_CONFIG.REQUIRE_EMAIL_VERIFIED && user.emailVerified !== true)
                                continue;
                            createdAt = user.createdAt ? new Date(user.createdAt).getTime() : now;
                            if (now - createdAt < minAgeMs)
                                continue;
                            lastActivity = user.lastActivityAt
                                ? new Date(user.lastActivityAt).getTime()
                                : null;
                            if (lastActivity === null || now - lastActivity > windowMs)
                                continue;
                            seenUsers.add(player.userId);
                        }
                        return [2 /*return*/, seenUsers.size];
                }
            });
        });
    };
    MemStorage.prototype.upsertUser = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, updated, insertData;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        existing = this.users.get(user.id);
                        if (!existing) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.updateUser(user.id, user)];
                    case 1:
                        updated = _b.sent();
                        return [2 /*return*/, updated];
                    case 2:
                        insertData = {
                            email: user.email || "",
                            globalRole: user.globalRole || "PLAYER",
                            stripeCustomerId: user.stripeCustomerId,
                            stripeConnectId: user.stripeConnectId,
                            payoutShareBps: user.payoutShareBps,
                            onboardingComplete: (_a = user.onboardingComplete) !== null && _a !== void 0 ? _a : false,
                        };
                        return [2 /*return*/, this.createUser(insertData)];
                }
            });
        });
    };
    MemStorage.prototype.deleteUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.users.delete(id)];
            });
        });
    };
    // Organization methods
    MemStorage.prototype.getOrganization = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.organizations.get(id)];
            });
        });
    };
    MemStorage.prototype.getAllOrganizations = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.organizations.values())];
            });
        });
    };
    MemStorage.prototype.createOrganization = function (insertOrg) {
        return __awaiter(this, void 0, void 0, function () {
            var id, organization;
            var _a;
            return __generator(this, function (_b) {
                id = (0, crypto_1.randomUUID)();
                organization = {
                    id: id,
                    name: insertOrg.name,
                    stripeCustomerId: insertOrg.stripeCustomerId,
                    stripeSubscriptionId: insertOrg.stripeSubscriptionId,
                    seatLimit: (_a = insertOrg.seatLimit) !== null && _a !== void 0 ? _a : 5,
                    createdAt: new Date(),
                };
                this.organizations.set(id, organization);
                return [2 /*return*/, organization];
            });
        });
    };
    MemStorage.prototype.updateOrganization = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, updateMapRecord(this.organizations, id, updates, NULLABLE_FIELDS.Organization)];
            });
        });
    };
    // PayoutTransfer methods
    MemStorage.prototype.getPayoutTransfer = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.payoutTransfers.get(id)];
            });
        });
    };
    MemStorage.prototype.getPayoutTransfersByInvoice = function (invoiceId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.payoutTransfers.values()).filter(function (transfer) { return transfer.invoiceId === invoiceId; })];
            });
        });
    };
    MemStorage.prototype.getAllPayoutTransfers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.payoutTransfers.values())];
            });
        });
    };
    MemStorage.prototype.createPayoutTransfer = function (insertTransfer) {
        return __awaiter(this, void 0, void 0, function () {
            var id, transfer;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                transfer = {
                    id: id,
                    invoiceId: insertTransfer.invoiceId,
                    stripeTransferId: insertTransfer.stripeTransferId,
                    recipientUserId: insertTransfer.recipientUserId,
                    amount: insertTransfer.amount,
                    shareType: insertTransfer.shareType,
                    createdAt: new Date(),
                };
                this.payoutTransfers.set(id, transfer);
                return [2 /*return*/, transfer];
            });
        });
    };
    // OperatorSettings methods
    MemStorage.prototype.getOperatorSettings = function (operatorUserId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.operatorSettings.values()).find(function (settings) {
                        return settings.operatorUserId === operatorUserId;
                    })];
            });
        });
    };
    MemStorage.prototype.getAllOperatorSettings = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.operatorSettings.values())];
            });
        });
    };
    MemStorage.prototype.createOperatorSettings = function (settings) {
        return __awaiter(this, void 0, void 0, function () {
            var newSettings;
            return __generator(this, function (_a) {
                newSettings = {
                    id: (0, crypto_1.randomUUID)(),
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
                return [2 /*return*/, newSettings];
            });
        });
    };
    MemStorage.prototype.updateOperatorSettings = function (operatorUserId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var existing;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getOperatorSettings(operatorUserId)];
                    case 1:
                        existing = _a.sent();
                        if (!existing)
                            return [2 /*return*/, undefined];
                        return [2 /*return*/, updateMapRecord(this.operatorSettings, existing.id, __assign(__assign({}, updates), { updatedAt: new Date() }), NULLABLE_FIELDS.OperatorSettings || [])];
                }
            });
        });
    };
    MemStorage.prototype.initializeSeedData = function () {
        var _this = this;
        // Initialize owner user for platform management
        var ownerId = (0, crypto_1.randomUUID)();
        var ownerUser = {
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
        var testOrg1 = {
            id: (0, crypto_1.randomUUID)(),
            name: "Seguin Winners Pool Hall",
            stripeCustomerId: "cus_test_seguin123",
            stripeSubscriptionId: "sub_test_seguin123",
            seatLimit: 25,
            createdAt: new Date(),
        };
        this.organizations.set(testOrg1.id, testOrg1);
        var testOrg2 = {
            id: (0, crypto_1.randomUUID)(),
            name: "San Marcos Sharks",
            seatLimit: 5,
            createdAt: new Date(),
        };
        this.organizations.set(testOrg2.id, testOrg2);
        // Initialize Tri-City pool halls
        var seguin = {
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
        var newBraunfels = {
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
        var sanMarcos = {
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
        var hallMatch1 = {
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
        var hallMatch2 = {
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
        var seedPlayers = [
            {
                id: (0, crypto_1.randomUUID)(),
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
                id: (0, crypto_1.randomUUID)(),
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
                id: (0, crypto_1.randomUUID)(),
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
                id: (0, crypto_1.randomUUID)(),
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
                id: (0, crypto_1.randomUUID)(),
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
                id: (0, crypto_1.randomUUID)(),
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
                id: (0, crypto_1.randomUUID)(),
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
                id: (0, crypto_1.randomUUID)(),
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
                id: (0, crypto_1.randomUUID)(),
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
        seedPlayers.forEach(function (player) {
            _this.players.set(player.id, player);
        });
        // Seed tournaments
        var tournament1 = {
            id: (0, crypto_1.randomUUID)(),
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
        var tournament2 = {
            id: (0, crypto_1.randomUUID)(),
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
        var kellyPool = {
            id: (0, crypto_1.randomUUID)(),
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
        var charityEvent = {
            id: (0, crypto_1.randomUUID)(),
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
        var bounty1 = {
            id: (0, crypto_1.randomUUID)(),
            type: "onPlayer",
            rank: null,
            targetId: seedPlayers[0].id, // Tyga Hoodz
            prize: 50,
            active: true,
            description: "Beat the King of 600+ Division",
            createdAt: new Date(),
        };
        var bounty2 = {
            id: (0, crypto_1.randomUUID)(),
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
        var moneyGame1 = {
            id: (0, crypto_1.randomUUID)(),
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
        var moneyGame2 = {
            id: (0, crypto_1.randomUUID)(),
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
        var moneyGame3 = {
            id: (0, crypto_1.randomUUID)(),
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
        var poolhallDivision = {
            id: (0, crypto_1.randomUUID)(),
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
        var cityDivision = {
            id: (0, crypto_1.randomUUID)(),
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
        var stateDivision = {
            id: (0, crypto_1.randomUUID)(),
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
        var rookieHall = {
            id: (0, crypto_1.randomUUID)(),
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
        var basicHall = {
            id: (0, crypto_1.randomUUID)(),
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
        var eliteOperator = {
            id: (0, crypto_1.randomUUID)(),
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
        var franchise = {
            id: (0, crypto_1.randomUUID)(),
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
    };
    // Player methods
    MemStorage.prototype.getPlayer = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.players.get(id)];
            });
        });
    };
    MemStorage.prototype.getPlayerByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, player;
            return __generator(this, function (_b) {
                for (_i = 0, _a = Array.from(this.players.values()); _i < _a.length; _i++) {
                    player = _a[_i];
                    if (player.userId === userId) {
                        return [2 /*return*/, player];
                    }
                }
                return [2 /*return*/, undefined];
            });
        });
    };
    MemStorage.prototype.getPlayers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.players.values())];
            });
        });
    };
    MemStorage.prototype.getAllPlayers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getPlayers()];
            });
        });
    };
    MemStorage.prototype.createPlayer = function (insertPlayer) {
        return __awaiter(this, void 0, void 0, function () {
            var id, player;
            var _a, _b, _c, _d, _e, _f, _g, _h;
            return __generator(this, function (_j) {
                id = (0, crypto_1.randomUUID)();
                player = {
                    id: id,
                    name: insertPlayer.name,
                    rating: (_a = insertPlayer.rating) !== null && _a !== void 0 ? _a : 500,
                    city: nullifyUndefined(insertPlayer.city),
                    member: nullifyUndefined(insertPlayer.member),
                    theme: nullifyUndefined(insertPlayer.theme),
                    points: (_b = insertPlayer.points) !== null && _b !== void 0 ? _b : 800,
                    streak: nullifyUndefined(insertPlayer.streak),
                    respectPoints: nullifyUndefined(insertPlayer.respectPoints),
                    birthday: nullifyUndefined(insertPlayer.birthday),
                    stripeCustomerId: nullifyUndefined(insertPlayer.stripeCustomerId),
                    userId: nullifyUndefined(insertPlayer.userId),
                    isRookie: (_c = insertPlayer.isRookie) !== null && _c !== void 0 ? _c : true,
                    rookieWins: (_d = insertPlayer.rookieWins) !== null && _d !== void 0 ? _d : 0,
                    rookieLosses: (_e = insertPlayer.rookieLosses) !== null && _e !== void 0 ? _e : 0,
                    rookiePoints: (_f = insertPlayer.rookiePoints) !== null && _f !== void 0 ? _f : 0,
                    rookieStreak: (_g = insertPlayer.rookieStreak) !== null && _g !== void 0 ? _g : 0,
                    rookiePassActive: (_h = insertPlayer.rookiePassActive) !== null && _h !== void 0 ? _h : false,
                    rookiePassExpiresAt: nullifyUndefined(insertPlayer.rookiePassExpiresAt),
                    graduatedAt: nullifyUndefined(insertPlayer.graduatedAt),
                    membershipTier: nullifyUndefined(insertPlayer.membershipTier),
                    createdAt: new Date(),
                };
                this.players.set(id, player);
                return [2 /*return*/, player];
            });
        });
    };
    MemStorage.prototype.updatePlayer = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, updateMapRecord(this.players, id, updates, NULLABLE_FIELDS.Player)];
            });
        });
    };
    MemStorage.prototype.deletePlayer = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.players.delete(id)];
            });
        });
    };
    // Match methods
    MemStorage.prototype.getMatch = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.matches.get(id)];
            });
        });
    };
    MemStorage.prototype.getMatches = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.matches.values())];
            });
        });
    };
    MemStorage.prototype.getAllMatches = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getMatches()];
            });
        });
    };
    MemStorage.prototype.createMatch = function (insertMatch) {
        return __awaiter(this, void 0, void 0, function () {
            var id, match;
            var _a, _b, _c, _d, _e, _f;
            return __generator(this, function (_g) {
                id = (0, crypto_1.randomUUID)();
                match = {
                    id: id,
                    division: insertMatch.division,
                    challenger: insertMatch.challenger,
                    opponent: insertMatch.opponent,
                    game: insertMatch.game,
                    table: insertMatch.table,
                    stake: insertMatch.stake,
                    time: insertMatch.time,
                    notes: nullifyUndefined(insertMatch.notes),
                    status: (_a = insertMatch.status) !== null && _a !== void 0 ? _a : "scheduled",
                    winner: nullifyUndefined(insertMatch.winner),
                    commission: nullifyUndefined(insertMatch.commission),
                    bountyAward: nullifyUndefined(insertMatch.bountyAward),
                    weightMultiplierBps: nullifyUndefined(insertMatch.weightMultiplierBps),
                    owedWeight: (_b = insertMatch.owedWeight) !== null && _b !== void 0 ? _b : false,
                    platformCommissionBps: (_c = insertMatch.platformCommissionBps) !== null && _c !== void 0 ? _c : 1000,
                    operatorCommissionBps: (_d = insertMatch.operatorCommissionBps) !== null && _d !== void 0 ? _d : 500,
                    platformEarnings: (_e = insertMatch.platformEarnings) !== null && _e !== void 0 ? _e : 0,
                    operatorEarnings: (_f = insertMatch.operatorEarnings) !== null && _f !== void 0 ? _f : 0,
                    prizePoolAmount: nullifyUndefined(insertMatch.prizePoolAmount),
                    reportedAt: null,
                    createdAt: new Date(),
                };
                this.matches.set(id, match);
                return [2 /*return*/, match];
            });
        });
    };
    // Tournament methods
    MemStorage.prototype.getTournament = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.tournaments.get(id)];
            });
        });
    };
    MemStorage.prototype.getTournaments = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.tournaments.values())];
            });
        });
    };
    MemStorage.prototype.getAllTournaments = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getTournaments()];
            });
        });
    };
    MemStorage.prototype.createTournament = function (insertTournament) {
        return __awaiter(this, void 0, void 0, function () {
            var id, tournament;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                tournament = __assign(__assign({ status: null, currentPlayers: null, stripeProductId: null, addedMoney: null, calcuttaEnabled: null, calcuttaDeadline: null, seasonPredictionEnabled: null }, insertTournament), { id: id, createdAt: new Date() });
                this.tournaments.set(id, tournament);
                return [2 /*return*/, tournament];
            });
        });
    };
    MemStorage.prototype.updateTournament = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var tournament, updatedTournament;
            return __generator(this, function (_a) {
                tournament = this.tournaments.get(id);
                if (!tournament)
                    return [2 /*return*/, undefined];
                updatedTournament = __assign(__assign({}, tournament), updates);
                this.tournaments.set(id, updatedTournament);
                return [2 /*return*/, updatedTournament];
            });
        });
    };
    // Tournament Calcutta methods
    MemStorage.prototype.getTournamentCalcutta = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.tournamentCalcuttas.get(id)];
            });
        });
    };
    MemStorage.prototype.getTournamentCalcuttas = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.tournamentCalcuttas.values())];
            });
        });
    };
    MemStorage.prototype.getTournamentCalcuttasByTournament = function (tournamentId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.tournamentCalcuttas.values()).filter(function (c) { return c.tournamentId === tournamentId; })];
            });
        });
    };
    MemStorage.prototype.createTournamentCalcutta = function (insertCalcutta) {
        return __awaiter(this, void 0, void 0, function () {
            var id, calcutta;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                calcutta = __assign(__assign({ currentBid: null, currentBidderId: null, minimumBid: null, totalBids: null, biddingOpen: null, finalPayout: null, status: null }, insertCalcutta), { id: id, createdAt: new Date() });
                this.tournamentCalcuttas.set(id, calcutta);
                return [2 /*return*/, calcutta];
            });
        });
    };
    MemStorage.prototype.updateTournamentCalcutta = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var calcutta, updatedCalcutta;
            return __generator(this, function (_a) {
                calcutta = this.tournamentCalcuttas.get(id);
                if (!calcutta)
                    return [2 /*return*/, undefined];
                updatedCalcutta = __assign(__assign({}, calcutta), updates);
                this.tournamentCalcuttas.set(id, updatedCalcutta);
                return [2 /*return*/, updatedCalcutta];
            });
        });
    };
    // Calcutta Bid methods
    MemStorage.prototype.getCalcuttaBid = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.calcuttaBids.get(id)];
            });
        });
    };
    MemStorage.prototype.getCalcuttaBids = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.calcuttaBids.values())];
            });
        });
    };
    MemStorage.prototype.getCalcuttaBidsByCalcutta = function (calcuttaId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.calcuttaBids.values()).filter(function (b) { return b.calcuttaId === calcuttaId; })];
            });
        });
    };
    MemStorage.prototype.getCalcuttaBidsByBidder = function (bidderId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.calcuttaBids.values()).filter(function (b) { return b.bidderId === bidderId; })];
            });
        });
    };
    MemStorage.prototype.createCalcuttaBid = function (insertBid) {
        return __awaiter(this, void 0, void 0, function () {
            var id, bid;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                bid = __assign(__assign({ bidTime: null, isWinning: null, stripePaymentIntentId: null }, insertBid), { id: id, createdAt: new Date() });
                this.calcuttaBids.set(id, bid);
                return [2 /*return*/, bid];
            });
        });
    };
    MemStorage.prototype.updateCalcuttaBid = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var bid, updatedBid;
            return __generator(this, function (_a) {
                bid = this.calcuttaBids.get(id);
                if (!bid)
                    return [2 /*return*/, undefined];
                updatedBid = __assign(__assign({}, bid), updates);
                this.calcuttaBids.set(id, updatedBid);
                return [2 /*return*/, updatedBid];
            });
        });
    };
    // Season Prediction methods
    MemStorage.prototype.getSeasonPrediction = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.seasonPredictions.get(id)];
            });
        });
    };
    MemStorage.prototype.getSeasonPredictions = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.seasonPredictions.values())];
            });
        });
    };
    MemStorage.prototype.getSeasonPredictionsByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.seasonPredictions.values()).filter(function (p) { return p.status === status; })];
            });
        });
    };
    MemStorage.prototype.createSeasonPrediction = function (insertPrediction) {
        return __awaiter(this, void 0, void 0, function () {
            var id, prediction;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                prediction = __assign(__assign({ description: null, totalPool: null, serviceFee: null, prizePool: null, addedMoneyContribution: null, minimumMatches: null, predictionsOpen: null, predictionDeadline: null, seasonEndDate: null, status: null, firstPlaceWins: null, secondPlaceWins: null, thirdPlaceWins: null, entryFee: 5000 }, insertPrediction), { id: id, createdAt: new Date() });
                this.seasonPredictions.set(id, prediction);
                return [2 /*return*/, prediction];
            });
        });
    };
    MemStorage.prototype.updateSeasonPrediction = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var prediction, updatedPrediction;
            return __generator(this, function (_a) {
                prediction = this.seasonPredictions.get(id);
                if (!prediction)
                    return [2 /*return*/, undefined];
                updatedPrediction = __assign(__assign({}, prediction), updates);
                this.seasonPredictions.set(id, updatedPrediction);
                return [2 /*return*/, updatedPrediction];
            });
        });
    };
    // Prediction Entry methods
    MemStorage.prototype.getPredictionEntry = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.predictionEntries.get(id)];
            });
        });
    };
    MemStorage.prototype.getPredictionEntries = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.predictionEntries.values())];
            });
        });
    };
    MemStorage.prototype.getPredictionEntriesByPrediction = function (predictionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.predictionEntries.values()).filter(function (e) { return e.predictionId === predictionId; })];
            });
        });
    };
    MemStorage.prototype.getPredictionEntriesByPredictor = function (predictorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.predictionEntries.values()).filter(function (e) { return e.predictorId === predictorId; })];
            });
        });
    };
    MemStorage.prototype.createPredictionEntry = function (insertEntry) {
        return __awaiter(this, void 0, void 0, function () {
            var id, entry;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                entry = __assign(__assign({ predictionScore: null, payout: null, stripePaymentIntentId: null }, insertEntry), { id: id, createdAt: new Date() });
                this.predictionEntries.set(id, entry);
                return [2 /*return*/, entry];
            });
        });
    };
    MemStorage.prototype.updatePredictionEntry = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var entry, updatedEntry;
            return __generator(this, function (_a) {
                entry = this.predictionEntries.get(id);
                if (!entry)
                    return [2 /*return*/, undefined];
                updatedEntry = __assign(__assign({}, entry), updates);
                this.predictionEntries.set(id, updatedEntry);
                return [2 /*return*/, updatedEntry];
            });
        });
    };
    // Added Money Fund methods
    MemStorage.prototype.getAddedMoneyFund = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.addedMoneyFunds.get(id)];
            });
        });
    };
    MemStorage.prototype.getAddedMoneyFunds = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.addedMoneyFunds.values())];
            });
        });
    };
    MemStorage.prototype.getAddedMoneyFundsBySource = function (sourceType) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.addedMoneyFunds.values()).filter(function (f) { return f.sourceType === sourceType; })];
            });
        });
    };
    MemStorage.prototype.getAddedMoneyFundsByTournament = function (tournamentId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.addedMoneyFunds.values()).filter(function (f) { return f.tournamentId === tournamentId; })];
            });
        });
    };
    MemStorage.prototype.createAddedMoneyFund = function (insertFund) {
        return __awaiter(this, void 0, void 0, function () {
            var id, fund;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                fund = __assign(__assign({ allocationDate: null, tournamentId: null, remainingBalance: null }, insertFund), { id: id, createdAt: new Date() });
                this.addedMoneyFunds.set(id, fund);
                return [2 /*return*/, fund];
            });
        });
    };
    MemStorage.prototype.updateAddedMoneyFund = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var fund, updatedFund;
            return __generator(this, function (_a) {
                fund = this.addedMoneyFunds.get(id);
                if (!fund)
                    return [2 /*return*/, undefined];
                updatedFund = __assign(__assign({}, fund), updates);
                this.addedMoneyFunds.set(id, updatedFund);
                return [2 /*return*/, updatedFund];
            });
        });
    };
    // Kelly Pool methods
    MemStorage.prototype.getKellyPool = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.kellyPools.get(id)];
            });
        });
    };
    MemStorage.prototype.getKellyPools = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.kellyPools.values())];
            });
        });
    };
    MemStorage.prototype.getAllKellyPools = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getKellyPools()];
            });
        });
    };
    MemStorage.prototype.createKellyPool = function (insertKellyPool) {
        return __awaiter(this, void 0, void 0, function () {
            var id, kellyPool;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                kellyPool = __assign(__assign({ status: null, table: null, currentPlayers: null, balls: null }, insertKellyPool), { id: id, createdAt: new Date() });
                this.kellyPools.set(id, kellyPool);
                return [2 /*return*/, kellyPool];
            });
        });
    };
    MemStorage.prototype.updateKellyPool = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var kellyPool, updatedKellyPool;
            return __generator(this, function (_a) {
                kellyPool = this.kellyPools.get(id);
                if (!kellyPool)
                    return [2 /*return*/, undefined];
                updatedKellyPool = __assign(__assign({}, kellyPool), updates);
                this.kellyPools.set(id, updatedKellyPool);
                return [2 /*return*/, updatedKellyPool];
            });
        });
    };
    // Money Game methods
    MemStorage.prototype.getMoneyGame = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.moneyGames.get(id)];
            });
        });
    };
    MemStorage.prototype.getMoneyGames = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.moneyGames.values())];
            });
        });
    };
    MemStorage.prototype.getMoneyGamesByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.moneyGames.values()).filter(function (game) { return game.status === status; })];
            });
        });
    };
    MemStorage.prototype.createMoneyGame = function (insertMoneyGame) {
        return __awaiter(this, void 0, void 0, function () {
            var id, moneyGame;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                moneyGame = __assign(__assign({ winner: null }, insertMoneyGame), { id: id, createdAt: new Date() });
                this.moneyGames.set(id, moneyGame);
                return [2 /*return*/, moneyGame];
            });
        });
    };
    MemStorage.prototype.updateMoneyGame = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var moneyGame, updatedMoneyGame;
            return __generator(this, function (_a) {
                moneyGame = this.moneyGames.get(id);
                if (!moneyGame)
                    return [2 /*return*/, undefined];
                updatedMoneyGame = __assign(__assign({}, moneyGame), updates);
                this.moneyGames.set(id, updatedMoneyGame);
                return [2 /*return*/, updatedMoneyGame];
            });
        });
    };
    MemStorage.prototype.deleteMoneyGame = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.moneyGames.delete(id)];
            });
        });
    };
    // Bounty methods
    MemStorage.prototype.getBounty = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.bounties.get(id)];
            });
        });
    };
    MemStorage.prototype.getBounties = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.bounties.values())];
            });
        });
    };
    MemStorage.prototype.getAllBounties = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getBounties()];
            });
        });
    };
    MemStorage.prototype.createBounty = function (insertBounty) {
        return __awaiter(this, void 0, void 0, function () {
            var id, bounty;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                bounty = __assign(__assign({ rank: null, targetId: null, active: null, description: null }, insertBounty), { id: id, createdAt: new Date() });
                this.bounties.set(id, bounty);
                return [2 /*return*/, bounty];
            });
        });
    };
    MemStorage.prototype.updateBounty = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var bounty, updatedBounty;
            return __generator(this, function (_a) {
                bounty = this.bounties.get(id);
                if (!bounty)
                    return [2 /*return*/, undefined];
                updatedBounty = __assign(__assign({}, bounty), updates);
                this.bounties.set(id, updatedBounty);
                return [2 /*return*/, updatedBounty];
            });
        });
    };
    // Charity Event methods
    MemStorage.prototype.getCharityEvent = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.charityEvents.get(id)];
            });
        });
    };
    MemStorage.prototype.getCharityEvents = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.charityEvents.values())];
            });
        });
    };
    MemStorage.prototype.getAllCharityEvents = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getCharityEvents()];
            });
        });
    };
    MemStorage.prototype.createCharityEvent = function (insertCharityEvent) {
        return __awaiter(this, void 0, void 0, function () {
            var id, charityEvent;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                charityEvent = __assign(__assign({ active: null, description: null, raised: null, percentage: null }, insertCharityEvent), { id: id, createdAt: new Date() });
                this.charityEvents.set(id, charityEvent);
                return [2 /*return*/, charityEvent];
            });
        });
    };
    MemStorage.prototype.updateCharityEvent = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var charityEvent, updatedCharityEvent;
            return __generator(this, function (_a) {
                charityEvent = this.charityEvents.get(id);
                if (!charityEvent)
                    return [2 /*return*/, undefined];
                updatedCharityEvent = __assign(__assign({}, charityEvent), updates);
                this.charityEvents.set(id, updatedCharityEvent);
                return [2 /*return*/, updatedCharityEvent];
            });
        });
    };
    // Support Request methods
    MemStorage.prototype.getSupportRequest = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.supportRequests.get(id)];
            });
        });
    };
    MemStorage.prototype.getSupportRequests = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.supportRequests.values())];
            });
        });
    };
    MemStorage.prototype.getAllSupportRequests = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getSupportRequests()];
            });
        });
    };
    MemStorage.prototype.createSupportRequest = function (insertSupportRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var id, supportRequest;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                supportRequest = __assign(__assign({ status: null, description: null, amount: null }, insertSupportRequest), { id: id, createdAt: new Date() });
                this.supportRequests.set(id, supportRequest);
                return [2 /*return*/, supportRequest];
            });
        });
    };
    MemStorage.prototype.updateSupportRequest = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var supportRequest, updatedSupportRequest;
            return __generator(this, function (_a) {
                supportRequest = this.supportRequests.get(id);
                if (!supportRequest)
                    return [2 /*return*/, undefined];
                updatedSupportRequest = __assign(__assign({}, supportRequest), updates);
                this.supportRequests.set(id, updatedSupportRequest);
                return [2 /*return*/, updatedSupportRequest];
            });
        });
    };
    // Live Stream methods
    MemStorage.prototype.getLiveStream = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.liveStreams.get(id)];
            });
        });
    };
    MemStorage.prototype.getLiveStreams = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.liveStreams.values())];
            });
        });
    };
    MemStorage.prototype.getAllLiveStreams = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getLiveStreams()];
            });
        });
    };
    MemStorage.prototype.createLiveStream = function (insertLiveStream) {
        return __awaiter(this, void 0, void 0, function () {
            var id, liveStream;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                liveStream = __assign(__assign({ title: null, isLive: null, viewerCount: null, matchId: null, hallMatchId: null, maxViewers: 0, embedUrl: null, lastLiveAt: null }, insertLiveStream), { category: insertLiveStream.category || null, quality: insertLiveStream.quality || null, tags: insertLiveStream.tags || [], tournamentId: insertLiveStream.tournamentId || null, streamerId: insertLiveStream.streamerId || null, thumbnailUrl: insertLiveStream.thumbnailUrl || null, language: insertLiveStream.language || "en", id: id, createdAt: new Date() });
                this.liveStreams.set(id, liveStream);
                return [2 /*return*/, liveStream];
            });
        });
    };
    MemStorage.prototype.updateLiveStream = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var liveStream, updatedLiveStream;
            return __generator(this, function (_a) {
                liveStream = this.liveStreams.get(id);
                if (!liveStream)
                    return [2 /*return*/, undefined];
                updatedLiveStream = __assign(__assign({}, liveStream), updates);
                this.liveStreams.set(id, updatedLiveStream);
                return [2 /*return*/, updatedLiveStream];
            });
        });
    };
    MemStorage.prototype.deleteLiveStream = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.liveStreams.delete(id)];
            });
        });
    };
    MemStorage.prototype.getLiveStreamsByLocation = function (city, state) {
        return __awaiter(this, void 0, void 0, function () {
            var allStreams;
            return __generator(this, function (_a) {
                allStreams = Array.from(this.liveStreams.values());
                return [2 /*return*/, allStreams.filter(function (stream) {
                        var _a, _b;
                        var matchesCity = !city || ((_a = stream.city) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(city.toLowerCase()));
                        var matchesState = !state || ((_b = stream.state) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === state.toLowerCase();
                        return matchesCity && matchesState;
                    })];
            });
        });
    };
    MemStorage.prototype.getLiveStreamStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var allStreams, liveStreams, totalViewers, peakViewers, platformStats, locationStats;
            return __generator(this, function (_a) {
                allStreams = Array.from(this.liveStreams.values());
                liveStreams = allStreams.filter(function (s) { return s.isLive; });
                totalViewers = liveStreams.reduce(function (sum, stream) { return sum + (stream.viewerCount || 0); }, 0);
                peakViewers = allStreams.reduce(function (max, stream) { return Math.max(max, stream.maxViewers || 0); }, 0);
                platformStats = allStreams.reduce(function (acc, stream) {
                    acc[stream.platform] = (acc[stream.platform] || 0) + 1;
                    return acc;
                }, {});
                locationStats = allStreams.reduce(function (acc, stream) {
                    if (stream.state) {
                        acc[stream.state] = (acc[stream.state] || 0) + 1;
                    }
                    return acc;
                }, {});
                return [2 /*return*/, {
                        totalStreams: allStreams.length,
                        liveStreams: liveStreams.length,
                        totalViewers: totalViewers,
                        peakViewers: peakViewers,
                        platformStats: platformStats,
                        locationStats: locationStats
                    }];
            });
        });
    };
    // Webhook Event methods
    MemStorage.prototype.getWebhookEvent = function (stripeEventId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.webhookEvents.values()).find(function (event) { return event.stripeEventId === stripeEventId; })];
            });
        });
    };
    MemStorage.prototype.createWebhookEvent = function (insertWebhookEvent) {
        return __awaiter(this, void 0, void 0, function () {
            var id, webhookEvent;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                webhookEvent = __assign(__assign({}, insertWebhookEvent), { id: id, processedAt: new Date() });
                this.webhookEvents.set(id, webhookEvent);
                return [2 /*return*/, webhookEvent];
            });
        });
    };
    // Pool Hall methods
    MemStorage.prototype.getPoolHall = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.poolHalls.get(id)];
            });
        });
    };
    MemStorage.prototype.getPoolHalls = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.poolHalls.values())];
            });
        });
    };
    MemStorage.prototype.getAllPoolHalls = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getPoolHalls()];
            });
        });
    };
    MemStorage.prototype.createPoolHall = function (insertPoolHall) {
        return __awaiter(this, void 0, void 0, function () {
            var id, poolHall;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                poolHall = __assign(__assign({ points: 0, active: true, description: null, wins: 0, losses: 0, address: null, phone: null, battlesUnlocked: false, unlockedBy: null, unlockedAt: null }, insertPoolHall), { id: id, createdAt: new Date() });
                this.poolHalls.set(id, poolHall);
                return [2 /*return*/, poolHall];
            });
        });
    };
    MemStorage.prototype.updatePoolHall = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var poolHall, updated;
            return __generator(this, function (_a) {
                poolHall = this.poolHalls.get(id);
                if (!poolHall)
                    return [2 /*return*/, undefined];
                updated = __assign(__assign({}, poolHall), updates);
                this.poolHalls.set(id, updated);
                return [2 /*return*/, updated];
            });
        });
    };
    MemStorage.prototype.unlockHallBattles = function (hallId, unlockedBy) {
        return __awaiter(this, void 0, void 0, function () {
            var hall, updated;
            return __generator(this, function (_a) {
                hall = this.poolHalls.get(hallId);
                if (!hall)
                    return [2 /*return*/, undefined];
                updated = __assign(__assign({}, hall), { battlesUnlocked: true, unlockedBy: unlockedBy, unlockedAt: new Date() });
                this.poolHalls.set(hallId, updated);
                return [2 /*return*/, updated];
            });
        });
    };
    MemStorage.prototype.lockHallBattles = function (hallId) {
        return __awaiter(this, void 0, void 0, function () {
            var hall, updated;
            return __generator(this, function (_a) {
                hall = this.poolHalls.get(hallId);
                if (!hall)
                    return [2 /*return*/, undefined];
                updated = __assign(__assign({}, hall), { battlesUnlocked: false, unlockedBy: null, unlockedAt: null });
                this.poolHalls.set(hallId, updated);
                return [2 /*return*/, updated];
            });
        });
    };
    // Hall Match methods
    MemStorage.prototype.getHallMatch = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.hallMatches.get(id)];
            });
        });
    };
    MemStorage.prototype.getAllHallMatches = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.hallMatches.values())];
            });
        });
    };
    MemStorage.prototype.getHallMatchesByHall = function (hallId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.hallMatches.values()).filter(function (match) { return match.homeHallId === hallId || match.awayHallId === hallId; })];
            });
        });
    };
    MemStorage.prototype.createHallMatch = function (insertHallMatch) {
        return __awaiter(this, void 0, void 0, function () {
            var id, hallMatch;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                hallMatch = __assign(__assign({ status: "scheduled", stake: null, notes: null, totalRacks: 7, homeScore: null, awayScore: null, winnerHallId: null, scheduledDate: null, completedAt: null }, insertHallMatch), { id: id, createdAt: new Date() });
                this.hallMatches.set(id, hallMatch);
                return [2 /*return*/, hallMatch];
            });
        });
    };
    MemStorage.prototype.updateHallMatch = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var hallMatch, updated, homeHall, awayHall;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        hallMatch = this.hallMatches.get(id);
                        if (!hallMatch)
                            return [2 /*return*/, undefined];
                        updated = __assign(__assign({}, hallMatch), updates);
                        if (!(updates.status === "completed" && updates.winnerHallId && !hallMatch.winnerHallId)) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.getPoolHall(hallMatch.homeHallId)];
                    case 1:
                        homeHall = _a.sent();
                        return [4 /*yield*/, this.getPoolHall(hallMatch.awayHallId)];
                    case 2:
                        awayHall = _a.sent();
                        if (!(homeHall && awayHall)) return [3 /*break*/, 8];
                        if (!(updates.winnerHallId === hallMatch.homeHallId)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.updatePoolHall(homeHall.id, { wins: homeHall.wins + 1, points: homeHall.points + 100 })];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.updatePoolHall(awayHall.id, { losses: awayHall.losses + 1, points: Math.max(0, awayHall.points - 50) })];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 5: return [4 /*yield*/, this.updatePoolHall(awayHall.id, { wins: awayHall.wins + 1, points: awayHall.points + 100 })];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, this.updatePoolHall(homeHall.id, { losses: homeHall.losses + 1, points: Math.max(0, homeHall.points - 50) })];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8:
                        this.hallMatches.set(id, updated);
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    // Hall Roster methods
    MemStorage.prototype.getHallRoster = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.hallRosters.get(id)];
            });
        });
    };
    MemStorage.prototype.getAllHallRosters = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.hallRosters.values())];
            });
        });
    };
    MemStorage.prototype.getRosterByHall = function (hallId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.hallRosters.values()).filter(function (roster) { return roster.hallId === hallId && roster.isActive; })];
            });
        });
    };
    MemStorage.prototype.getRosterByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.hallRosters.values()).filter(function (roster) { return roster.playerId === playerId && roster.isActive; })];
            });
        });
    };
    MemStorage.prototype.createHallRoster = function (insertHallRoster) {
        return __awaiter(this, void 0, void 0, function () {
            var id, hallRoster;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                hallRoster = __assign(__assign({ position: null, isActive: true }, insertHallRoster), { id: id, joinedAt: new Date() });
                this.hallRosters.set(id, hallRoster);
                return [2 /*return*/, hallRoster];
            });
        });
    };
    MemStorage.prototype.updateHallRoster = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var hallRoster, updated;
            return __generator(this, function (_a) {
                hallRoster = this.hallRosters.get(id);
                if (!hallRoster)
                    return [2 /*return*/, undefined];
                updated = __assign(__assign({}, hallRoster), updates);
                this.hallRosters.set(id, updated);
                return [2 /*return*/, updated];
            });
        });
    };
    // Rookie System Implementation
    MemStorage.prototype.getRookieMatch = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.rookieMatches.get(id)];
            });
        });
    };
    MemStorage.prototype.getAllRookieMatches = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.rookieMatches.values()).sort(function (a, b) { var _a, _b; return (((_a = b.createdAt) === null || _a === void 0 ? void 0 : _a.getTime()) || 0) - (((_b = a.createdAt) === null || _b === void 0 ? void 0 : _b.getTime()) || 0); })];
            });
        });
    };
    MemStorage.prototype.getRookieMatchesByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.rookieMatches.values())
                        .filter(function (match) { return match.challenger === playerId || match.opponent === playerId; })
                        .sort(function (a, b) { var _a, _b; return (((_a = b.createdAt) === null || _a === void 0 ? void 0 : _a.getTime()) || 0) - (((_b = a.createdAt) === null || _b === void 0 ? void 0 : _b.getTime()) || 0); })];
            });
        });
    };
    MemStorage.prototype.createRookieMatch = function (match) {
        return __awaiter(this, void 0, void 0, function () {
            var newMatch;
            return __generator(this, function (_a) {
                newMatch = __assign(__assign({ status: "scheduled", notes: null, winner: null, commission: 200, fee: 800, pointsAwarded: null }, match), { id: (0, crypto_1.randomUUID)(), reportedAt: null, createdAt: new Date() });
                this.rookieMatches.set(newMatch.id, newMatch);
                return [2 /*return*/, newMatch];
            });
        });
    };
    MemStorage.prototype.updateRookieMatch = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var match, updatedMatch;
            return __generator(this, function (_a) {
                match = this.rookieMatches.get(id);
                if (!match)
                    return [2 /*return*/, undefined];
                updatedMatch = __assign(__assign({}, match), updates);
                this.rookieMatches.set(id, updatedMatch);
                return [2 /*return*/, updatedMatch];
            });
        });
    };
    MemStorage.prototype.getRookieEvent = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.rookieEvents.get(id)];
            });
        });
    };
    MemStorage.prototype.getAllRookieEvents = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.rookieEvents.values()).sort(function (a, b) { var _a, _b; return (((_a = b.createdAt) === null || _a === void 0 ? void 0 : _a.getTime()) || 0) - (((_b = a.createdAt) === null || _b === void 0 ? void 0 : _b.getTime()) || 0); })];
            });
        });
    };
    MemStorage.prototype.createRookieEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var newEvent;
            return __generator(this, function (_a) {
                newEvent = __assign(__assign({ id: (0, crypto_1.randomUUID)(), status: event.status || "open", prizePool: event.prizePool || 0, maxPlayers: event.maxPlayers || 8, currentPlayers: event.currentPlayers || 0, buyIn: event.buyIn || 500, prizeType: event.prizeType || "credit", description: event.description || null }, event), { createdAt: new Date() });
                this.rookieEvents.set(newEvent.id, newEvent);
                return [2 /*return*/, newEvent];
            });
        });
    };
    MemStorage.prototype.updateRookieEvent = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var event, updatedEvent;
            return __generator(this, function (_a) {
                event = this.rookieEvents.get(id);
                if (!event)
                    return [2 /*return*/, undefined];
                updatedEvent = __assign(__assign({}, event), updates);
                this.rookieEvents.set(id, updatedEvent);
                return [2 /*return*/, updatedEvent];
            });
        });
    };
    MemStorage.prototype.getRookieAchievement = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.rookieAchievements.get(id)];
            });
        });
    };
    MemStorage.prototype.getRookieAchievementsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.rookieAchievements.values())
                        .filter(function (achievement) { return achievement.playerId === playerId; })
                        .sort(function (a, b) { var _a, _b; return (((_a = b.earnedAt) === null || _a === void 0 ? void 0 : _a.getTime()) || 0) - (((_b = a.earnedAt) === null || _b === void 0 ? void 0 : _b.getTime()) || 0); })];
            });
        });
    };
    MemStorage.prototype.createRookieAchievement = function (achievement) {
        return __awaiter(this, void 0, void 0, function () {
            var newAchievement;
            return __generator(this, function (_a) {
                newAchievement = __assign(__assign({ id: (0, crypto_1.randomUUID)(), description: achievement.description || null, badge: achievement.badge || null }, achievement), { earnedAt: new Date() });
                this.rookieAchievements.set(newAchievement.id, newAchievement);
                return [2 /*return*/, newAchievement];
            });
        });
    };
    MemStorage.prototype.getRookieSubscription = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.rookieSubscriptions.values()).find(function (sub) { return sub.playerId === playerId; })];
            });
        });
    };
    MemStorage.prototype.getAllRookieSubscriptions = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.rookieSubscriptions.values()).sort(function (a, b) { var _a, _b; return (((_a = b.startedAt) === null || _a === void 0 ? void 0 : _a.getTime()) || 0) - (((_b = a.startedAt) === null || _b === void 0 ? void 0 : _b.getTime()) || 0); })];
            });
        });
    };
    MemStorage.prototype.createRookieSubscription = function (subscription) {
        return __awaiter(this, void 0, void 0, function () {
            var newSubscription;
            return __generator(this, function (_a) {
                newSubscription = __assign(__assign({ status: "active", stripeSubscriptionId: null, monthlyFee: 500, expiresAt: null, cancelledAt: null }, subscription), { id: (0, crypto_1.randomUUID)(), startedAt: new Date() });
                this.rookieSubscriptions.set(newSubscription.id, newSubscription);
                return [2 /*return*/, newSubscription];
            });
        });
    };
    MemStorage.prototype.updateRookieSubscription = function (playerId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var subscription, updatedSubscription;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getRookieSubscription(playerId)];
                    case 1:
                        subscription = _a.sent();
                        if (!subscription)
                            return [2 /*return*/, undefined];
                        updatedSubscription = __assign(__assign({}, subscription), updates);
                        this.rookieSubscriptions.set(subscription.id, updatedSubscription);
                        return [2 /*return*/, updatedSubscription];
                }
            });
        });
    };
    MemStorage.prototype.getRookieLeaderboard = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.players.values())
                        .filter(function (player) { return player.isRookie; })
                        .sort(function (a, b) {
                        // Sort by rookie points descending, then by wins
                        var aPoints = a.rookiePoints || 0;
                        var bPoints = b.rookiePoints || 0;
                        var aWins = a.rookieWins || 0;
                        var bWins = b.rookieWins || 0;
                        if (bPoints !== aPoints) {
                            return bPoints - aPoints;
                        }
                        return bWins - aWins;
                    })];
            });
        });
    };
    MemStorage.prototype.promoteRookieToMainLadder = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            var player, updatedPlayer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        player = this.players.get(playerId);
                        if (!player || !player.isRookie)
                            return [2 /*return*/, undefined];
                        updatedPlayer = __assign(__assign({}, player), { isRookie: false, graduatedAt: new Date() });
                        this.players.set(playerId, updatedPlayer);
                        // Award graduation achievement
                        return [4 /*yield*/, this.createRookieAchievement({
                                playerId: playerId,
                                type: "graduated",
                                title: "Graduated to Main Ladder",
                                description: "Reached 100 rookie points and joined the main ladder",
                                badge: "🎓",
                            })];
                    case 1:
                        // Award graduation achievement
                        _a.sent();
                        return [2 /*return*/, updatedPlayer];
                }
            });
        });
    };
    // Side Betting - Wallet Operations
    MemStorage.prototype.getWallet = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.wallets.get(userId)];
            });
        });
    };
    MemStorage.prototype.createWallet = function (wallet) {
        return __awaiter(this, void 0, void 0, function () {
            var newWallet;
            return __generator(this, function (_a) {
                newWallet = {
                    userId: wallet.userId,
                    balanceCredits: wallet.balanceCredits || 0,
                    balanceLockedCredits: wallet.balanceLockedCredits || 0,
                    createdAt: new Date(),
                };
                this.wallets.set(wallet.userId, newWallet);
                return [2 /*return*/, newWallet];
            });
        });
    };
    MemStorage.prototype.updateWallet = function (userId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, updateMapRecord(this.wallets, userId, updates, NULLABLE_FIELDS.Wallet)];
            });
        });
    };
    MemStorage.prototype.creditWallet = function (userId, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var wallet, currentBalance, updatedWallet;
            var _a;
            return __generator(this, function (_b) {
                wallet = this.wallets.get(userId);
                if (!wallet)
                    return [2 /*return*/, undefined];
                currentBalance = (_a = wallet.balanceCredits) !== null && _a !== void 0 ? _a : 0;
                updatedWallet = __assign(__assign({}, wallet), { balanceCredits: currentBalance + amount });
                this.wallets.set(userId, updatedWallet);
                return [2 /*return*/, updatedWallet];
            });
        });
    };
    MemStorage.prototype.lockCredits = function (userId, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var wallet, currentBalance, currentLocked, updatedWallet;
            var _a, _b;
            return __generator(this, function (_c) {
                wallet = this.wallets.get(userId);
                currentBalance = (_a = wallet === null || wallet === void 0 ? void 0 : wallet.balanceCredits) !== null && _a !== void 0 ? _a : 0;
                currentLocked = (_b = wallet === null || wallet === void 0 ? void 0 : wallet.balanceLockedCredits) !== null && _b !== void 0 ? _b : 0;
                if (!wallet || currentBalance < amount)
                    return [2 /*return*/, false];
                updatedWallet = __assign(__assign({}, wallet), { balanceCredits: currentBalance - amount, balanceLockedCredits: currentLocked + amount });
                this.wallets.set(userId, updatedWallet);
                return [2 /*return*/, true];
            });
        });
    };
    MemStorage.prototype.unlockCredits = function (userId, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var wallet, currentBalance, currentLocked, updatedWallet;
            var _a, _b;
            return __generator(this, function (_c) {
                wallet = this.wallets.get(userId);
                currentBalance = (_a = wallet === null || wallet === void 0 ? void 0 : wallet.balanceCredits) !== null && _a !== void 0 ? _a : 0;
                currentLocked = (_b = wallet === null || wallet === void 0 ? void 0 : wallet.balanceLockedCredits) !== null && _b !== void 0 ? _b : 0;
                if (!wallet || currentLocked < amount)
                    return [2 /*return*/, false];
                updatedWallet = __assign(__assign({}, wallet), { balanceCredits: currentBalance + amount, balanceLockedCredits: currentLocked - amount });
                this.wallets.set(userId, updatedWallet);
                return [2 /*return*/, true];
            });
        });
    };
    // Side Betting - Side Pots
    MemStorage.prototype.getSidePot = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.sidePots.get(id)];
            });
        });
    };
    MemStorage.prototype.getSidePots = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.sidePots.values())];
            });
        });
    };
    MemStorage.prototype.getAllSidePots = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getSidePots()];
            });
        });
    };
    MemStorage.prototype.getSidePotsByMatch = function (matchId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.sidePots.values()).filter(function (pot) { return pot.matchId === matchId; })];
            });
        });
    };
    MemStorage.prototype.getSidePotsByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.sidePots.values()).filter(function (pot) { return pot.status === status; })];
            });
        });
    };
    MemStorage.prototype.createSidePot = function (insertPot) {
        return __awaiter(this, void 0, void 0, function () {
            var id, pot;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                pot = {
                    id: id,
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
                return [2 /*return*/, pot];
            });
        });
    };
    MemStorage.prototype.updateSidePot = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var pot, updatedPot;
            return __generator(this, function (_a) {
                pot = this.sidePots.get(id);
                if (!pot)
                    return [2 /*return*/, undefined];
                updatedPot = __assign(__assign({}, pot), updates);
                this.sidePots.set(id, updatedPot);
                return [2 /*return*/, updatedPot];
            });
        });
    };
    MemStorage.prototype.getExpiredDisputePots = function (now) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.sidePots.values()).filter(function (pot) {
                        return pot.status === "resolved" &&
                            pot.disputeDeadline &&
                            now > pot.disputeDeadline &&
                            pot.disputeStatus === "none" &&
                            !pot.autoResolvedAt;
                    })];
            });
        });
    };
    MemStorage.prototype.processDelayedPayouts = function (potId, winningSide) {
        return __awaiter(this, void 0, void 0, function () {
            var pot, bets, winners, losers, totalPot, serviceFee, netPot, totalWinnerStake, payouts, _i, winners_1, winner, winnerShare, winnings, _a, losers_1, loser;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getSidePot(potId)];
                    case 1:
                        pot = _b.sent();
                        if (!pot)
                            throw new Error("Side pot not found");
                        return [4 /*yield*/, this.getSideBetsByPot(potId)];
                    case 2:
                        bets = _b.sent();
                        winners = bets.filter(function (bet) { return bet.side === winningSide; });
                        losers = bets.filter(function (bet) { return bet.side !== winningSide; });
                        totalPot = bets.reduce(function (sum, bet) { return sum + (bet.amount || 0); }, 0);
                        serviceFee = Math.floor(totalPot * (pot.feeBps || 850) / 10000);
                        netPot = totalPot - serviceFee;
                        totalWinnerStake = winners.reduce(function (sum, bet) { return sum + (bet.amount || 0); }, 0);
                        payouts = [];
                        _i = 0, winners_1 = winners;
                        _b.label = 3;
                    case 3:
                        if (!(_i < winners_1.length)) return [3 /*break*/, 8];
                        winner = winners_1[_i];
                        winnerShare = totalWinnerStake > 0 ? (winner.amount || 0) / totalWinnerStake : 0;
                        winnings = Math.floor(winnerShare * netPot);
                        // Credit winner's wallet
                        return [4 /*yield*/, this.creditWallet(winner.userId, winnings)];
                    case 4:
                        // Credit winner's wallet
                        _b.sent();
                        // Update bet status
                        return [4 /*yield*/, this.updateSideBet(winner.id, { status: "paid" })];
                    case 5:
                        // Update bet status
                        _b.sent();
                        // Create ledger entry
                        return [4 /*yield*/, this.createLedgerEntry({
                                userId: winner.userId,
                                type: "pot_release_win",
                                amount: winnings,
                                refId: winner.id,
                                metaJson: JSON.stringify({ sidePotId: potId, winnings: winnings, originalStake: winner.amount }),
                            })];
                    case 6:
                        // Create ledger entry
                        _b.sent();
                        payouts.push({
                            userId: winner.userId,
                            amount: winnings,
                            originalStake: winner.amount
                        });
                        _b.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 3];
                    case 8:
                        _a = 0, losers_1 = losers;
                        _b.label = 9;
                    case 9:
                        if (!(_a < losers_1.length)) return [3 /*break*/, 12];
                        loser = losers_1[_a];
                        return [4 /*yield*/, this.updateSideBet(loser.id, { status: "lost" })];
                    case 10:
                        _b.sent();
                        _b.label = 11;
                    case 11:
                        _a++;
                        return [3 /*break*/, 9];
                    case 12: return [2 /*return*/, {
                            totalPot: totalPot,
                            serviceFee: serviceFee,
                            netPot: netPot,
                            winnersCount: winners.length,
                            losersCount: losers.length,
                            payouts: payouts
                        }];
                }
            });
        });
    };
    // Side Betting - Side Bets
    MemStorage.prototype.getSideBet = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.sideBets.get(id)];
            });
        });
    };
    MemStorage.prototype.getSideBetsByPot = function (challengePoolId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.sideBets.values()).filter(function (bet) { return bet.challengePoolId === challengePoolId; })];
            });
        });
    };
    MemStorage.prototype.getSideBetsByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.sideBets.values()).filter(function (bet) { return bet.userId === userId; })];
            });
        });
    };
    MemStorage.prototype.createSideBet = function (insertBet) {
        return __awaiter(this, void 0, void 0, function () {
            var id, bet;
            var _a;
            return __generator(this, function (_b) {
                id = (0, crypto_1.randomUUID)();
                bet = {
                    id: id,
                    challengePoolId: nullifyUndefined(insertBet.challengePoolId),
                    userId: nullifyUndefined(insertBet.userId),
                    side: nullifyUndefined(insertBet.side),
                    amount: insertBet.amount,
                    status: (_a = insertBet.status) !== null && _a !== void 0 ? _a : "pending",
                    fundedAt: nullifyUndefined(insertBet.fundedAt),
                    createdAt: new Date(),
                };
                this.sideBets.set(id, bet);
                return [2 /*return*/, bet];
            });
        });
    };
    MemStorage.prototype.updateSideBet = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var bet, updatedBet;
            return __generator(this, function (_a) {
                bet = this.sideBets.get(id);
                if (!bet)
                    return [2 /*return*/, undefined];
                updatedBet = assignNoUndefined(bet, __assign(__assign({}, updates), { challengePoolId: updates.challengePoolId !== undefined ? nullifyUndefined(updates.challengePoolId) : bet.challengePoolId, userId: updates.userId !== undefined ? nullifyUndefined(updates.userId) : bet.userId, side: updates.side !== undefined ? nullifyUndefined(updates.side) : bet.side, fundedAt: updates.fundedAt !== undefined ? nullifyUndefined(updates.fundedAt) : bet.fundedAt }));
                this.sideBets.set(id, updatedBet);
                return [2 /*return*/, updatedBet];
            });
        });
    };
    // Side Betting - Ledger
    MemStorage.prototype.getLedgerEntry = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.ledgerEntries.get(id)];
            });
        });
    };
    MemStorage.prototype.getLedgerByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.ledgerEntries.values())
                        .filter(function (entry) { return entry.userId === userId; })
                        .sort(function (a, b) { var _a, _b; return (((_a = b.createdAt) === null || _a === void 0 ? void 0 : _a.getTime()) || 0) - (((_b = a.createdAt) === null || _b === void 0 ? void 0 : _b.getTime()) || 0); })];
            });
        });
    };
    MemStorage.prototype.createLedgerEntry = function (insertEntry) {
        return __awaiter(this, void 0, void 0, function () {
            var id, entry;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                entry = {
                    id: id,
                    userId: nullifyUndefined(insertEntry.userId),
                    type: nullifyUndefined(insertEntry.type),
                    amount: nullifyUndefined(insertEntry.amount),
                    refId: nullifyUndefined(insertEntry.refId),
                    metaJson: nullifyUndefined(insertEntry.metaJson),
                    createdAt: new Date(),
                };
                this.ledgerEntries.set(id, entry);
                return [2 /*return*/, entry];
            });
        });
    };
    // Side Betting - Resolutions
    MemStorage.prototype.getResolution = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.resolutions.get(id)];
            });
        });
    };
    MemStorage.prototype.getResolutionByPot = function (challengePoolId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.resolutions.values()).find(function (res) { return res.challengePoolId === challengePoolId; })];
            });
        });
    };
    MemStorage.prototype.createResolution = function (insertResolution) {
        return __awaiter(this, void 0, void 0, function () {
            var id, resolution;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                resolution = {
                    id: id,
                    challengePoolId: nullifyUndefined(insertResolution.challengePoolId),
                    winnerSide: nullifyUndefined(insertResolution.winnerSide),
                    decidedBy: nullifyUndefined(insertResolution.decidedBy),
                    decidedAt: new Date(), // decidedAt has defaultNow() in schema but we need it for the type
                    notes: nullifyUndefined(insertResolution.notes),
                };
                this.resolutions.set(id, resolution);
                return [2 /*return*/, resolution];
            });
        });
    };
    // Challenge Pool aliases (for backwards compatibility)
    MemStorage.prototype.getChallengePool = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getSidePot(id)];
            });
        });
    };
    MemStorage.prototype.getAllChallengePools = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getAllSidePots()];
            });
        });
    };
    MemStorage.prototype.createChallengePool = function (pool) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.createSidePot(pool)];
            });
        });
    };
    MemStorage.prototype.updateChallengePool = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateSidePot(id, updates)];
            });
        });
    };
    // Challenge Entry aliases (for backwards compatibility)
    MemStorage.prototype.getChallengeEntry = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getSideBet(id)];
            });
        });
    };
    MemStorage.prototype.getChallengeEntriesByPool = function (poolId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getSideBetsByPot(poolId)];
            });
        });
    };
    MemStorage.prototype.createChallengeEntry = function (entry) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.createSideBet(entry)];
            });
        });
    };
    MemStorage.prototype.updateChallengeEntry = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateSideBet(id, updates)];
            });
        });
    };
    // Wallet aliases (for backwards compatibility)
    MemStorage.prototype.addCredits = function (userId, amount) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.creditWallet(userId, amount)];
            });
        });
    };
    // Operator Subscription Methods
    MemStorage.prototype.getOperatorSubscription = function (operatorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.operatorSubscriptions.get(operatorId)];
            });
        });
    };
    MemStorage.prototype.getAllOperatorSubscriptions = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.operatorSubscriptions.values())];
            });
        });
    };
    MemStorage.prototype.createOperatorSubscription = function (insertSubscription) {
        return __awaiter(this, void 0, void 0, function () {
            var id, _a, basePriceMonthly, tier, subscription;
            return __generator(this, function (_b) {
                id = (0, crypto_1.randomUUID)();
                _a = this.calculateSubscriptionPricing(insertSubscription.playerCount || 0, insertSubscription.extraLadders || 0, insertSubscription.rookieModuleActive || false, insertSubscription.rookiePassesActive || 0), basePriceMonthly = _a.basePriceMonthly, tier = _a.tier;
                subscription = {
                    id: id,
                    operatorId: insertSubscription.operatorId,
                    hallName: insertSubscription.hallName,
                    playerCount: insertSubscription.playerCount || 0,
                    tier: tier,
                    basePriceMonthly: basePriceMonthly,
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
                return [2 /*return*/, subscription];
            });
        });
    };
    MemStorage.prototype.updateOperatorSubscription = function (operatorId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var subscription, updatedSubscription;
            return __generator(this, function (_a) {
                subscription = this.operatorSubscriptions.get(operatorId);
                if (!subscription)
                    return [2 /*return*/, undefined];
                updatedSubscription = __assign(__assign(__assign({}, subscription), updates), { updatedAt: new Date() });
                this.operatorSubscriptions.set(operatorId, updatedSubscription);
                return [2 /*return*/, updatedSubscription];
            });
        });
    };
    // Operator Subscription Split Methods
    MemStorage.prototype.createOperatorSubscriptionSplit = function (split) {
        return __awaiter(this, void 0, void 0, function () {
            var id, subscriptionSplit;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                subscriptionSplit = {
                    id: id,
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
                return [2 /*return*/, subscriptionSplit];
            });
        });
    };
    MemStorage.prototype.getOperatorSubscriptionSplits = function (operatorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.operatorSubscriptionSplits.values())
                        .filter(function (split) { return split.operatorId === operatorId; })];
            });
        });
    };
    MemStorage.prototype.getOperatorSubscriptionSplitsBySubscription = function (subscriptionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.operatorSubscriptionSplits.values())
                        .filter(function (split) { return split.subscriptionId === subscriptionId; })];
            });
        });
    };
    MemStorage.prototype.getTrusteeEarnings = function (trusteeId) {
        return __awaiter(this, void 0, void 0, function () {
            var splits, totalEarnings;
            return __generator(this, function (_a) {
                splits = Array.from(this.operatorSubscriptionSplits.values())
                    .filter(function (split) { return split.trusteeId === trusteeId; });
                totalEarnings = splits.reduce(function (sum, split) { return sum + split.trusteeAmount; }, 0);
                return [2 /*return*/, {
                        totalEarnings: totalEarnings,
                        splitCount: splits.length,
                        splits: splits
                    }];
            });
        });
    };
    MemStorage.prototype.getOperatorSubscriptionSplit = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.operatorSubscriptionSplits.get(id)];
            });
        });
    };
    // Helper method to calculate subscription pricing
    MemStorage.prototype.calculateSubscriptionPricing = function (playerCount, extraLadders, rookieModule, rookiePasses) {
        var tier;
        var basePriceMonthly;
        if (playerCount <= 15) {
            tier = "small";
            basePriceMonthly = 19900; // $199
        }
        else if (playerCount <= 25) {
            tier = "medium";
            basePriceMonthly = 29900; // $299
        }
        else if (playerCount <= 40) {
            tier = "large";
            basePriceMonthly = 39900; // $399
        }
        else {
            tier = "mega";
            basePriceMonthly = 49900; // $499
        }
        return { basePriceMonthly: basePriceMonthly, tier: tier };
    };
    MemStorage.prototype.calculateTotalMonthlyCharge = function (basePriceMonthly, subscription) {
        var total = basePriceMonthly;
        // Add extra ladder charges
        total += (subscription.extraLadders || 0) * 10000; // $100 per extra ladder
        // Add rookie module charge
        if (subscription.rookieModuleActive) {
            total += 5000; // $50/mo
        }
        // Add rookie pass charges
        total += (subscription.rookiePassesActive || 0) * 1500; // $15 per pass
        // Add extra player charges for players beyond tier limit
        var tierLimits = { small: 15, medium: 25, large: 40, mega: 999 };
        var playerCount = subscription.playerCount || 0;
        if (playerCount > 15 && subscription.tier === "small") {
            total += Math.max(0, playerCount - 15) * 800; // $8 per extra player
        }
        else if (playerCount > 25 && subscription.tier === "medium") {
            total += Math.max(0, playerCount - 25) * 800;
        }
        else if (playerCount > 40 && subscription.tier === "large") {
            total += Math.max(0, playerCount - 40) * 800;
        }
        return total;
    };
    // Membership Subscription Methods
    MemStorage.prototype.getMembershipSubscriptionByPlayerId = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.membershipSubscriptions.values()).find(function (sub) { return sub.playerId === playerId; })];
            });
        });
    };
    MemStorage.prototype.createMembershipSubscription = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var subscription;
            return __generator(this, function (_a) {
                subscription = {
                    id: (0, crypto_1.randomUUID)(),
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
                return [2 /*return*/, subscription];
            });
        });
    };
    MemStorage.prototype.updateMembershipSubscription = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var subscription, updatedSubscription;
            return __generator(this, function (_a) {
                subscription = this.membershipSubscriptions.get(id);
                if (!subscription)
                    return [2 /*return*/, undefined];
                updatedSubscription = __assign(__assign(__assign({}, subscription), updates), { updatedAt: new Date() });
                this.membershipSubscriptions.set(id, updatedSubscription);
                return [2 /*return*/, updatedSubscription];
            });
        });
    };
    // Team Division System Methods
    MemStorage.prototype.getTeam = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.teams.get(id)];
            });
        });
    };
    MemStorage.prototype.getTeamsByOperator = function (operatorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.teams.values()).filter(function (team) { return team.operatorId === operatorId; })];
            });
        });
    };
    MemStorage.prototype.getTeamsByHall = function (hallId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.teams.values()).filter(function (team) { return team.hallId === hallId; })];
            });
        });
    };
    MemStorage.prototype.createTeam = function (insertTeam) {
        return __awaiter(this, void 0, void 0, function () {
            var id, team;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                team = {
                    id: id,
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
                return [2 /*return*/, team];
            });
        });
    };
    MemStorage.prototype.updateTeam = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var team, updatedTeam;
            return __generator(this, function (_a) {
                team = this.teams.get(id);
                if (!team)
                    return [2 /*return*/, undefined];
                updatedTeam = __assign(__assign({}, team), updates);
                this.teams.set(id, updatedTeam);
                return [2 /*return*/, updatedTeam];
            });
        });
    };
    MemStorage.prototype.deleteTeam = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.teams.delete(id)];
            });
        });
    };
    // Team Player Methods
    MemStorage.prototype.getTeamPlayer = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.teamPlayers.get(id)];
            });
        });
    };
    MemStorage.prototype.getTeamPlayersByTeam = function (teamId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.teamPlayers.values()).filter(function (player) { return player.teamId === teamId; })];
            });
        });
    };
    MemStorage.prototype.getTeamPlayersByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.teamPlayers.values()).filter(function (player) { return player.playerId === playerId; })];
            });
        });
    };
    MemStorage.prototype.createTeamPlayer = function (insertTeamPlayer) {
        return __awaiter(this, void 0, void 0, function () {
            var id, teamPlayer;
            var _a;
            return __generator(this, function (_b) {
                id = (0, crypto_1.randomUUID)();
                teamPlayer = {
                    id: id,
                    teamId: insertTeamPlayer.teamId,
                    playerId: insertTeamPlayer.playerId,
                    role: insertTeamPlayer.role,
                    position: nullifyUndefined(insertTeamPlayer.position),
                    isActive: (_a = insertTeamPlayer.isActive) !== null && _a !== void 0 ? _a : true,
                    seasonWins: 0,
                    seasonLosses: 0,
                    joinedAt: new Date(),
                };
                this.teamPlayers.set(id, teamPlayer);
                return [2 /*return*/, teamPlayer];
            });
        });
    };
    MemStorage.prototype.updateTeamPlayer = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var teamPlayer, updatedTeamPlayer;
            return __generator(this, function (_a) {
                teamPlayer = this.teamPlayers.get(id);
                if (!teamPlayer)
                    return [2 /*return*/, undefined];
                updatedTeamPlayer = __assign(__assign({}, teamPlayer), updates);
                this.teamPlayers.set(id, updatedTeamPlayer);
                return [2 /*return*/, updatedTeamPlayer];
            });
        });
    };
    MemStorage.prototype.removeTeamPlayer = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.teamPlayers.delete(id)];
            });
        });
    };
    // Team Match Methods
    MemStorage.prototype.getTeamMatch = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.teamMatches.get(id)];
            });
        });
    };
    MemStorage.prototype.getTeamMatchesByTeam = function (teamId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.teamMatches.values()).filter(function (match) {
                        return match.homeTeamId === teamId || match.awayTeamId === teamId;
                    })];
            });
        });
    };
    MemStorage.prototype.getTeamMatchesByOperator = function (operatorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.teamMatches.values()).filter(function (match) { return match.operatorId === operatorId; })];
            });
        });
    };
    MemStorage.prototype.createTeamMatch = function (insertTeamMatch) {
        return __awaiter(this, void 0, void 0, function () {
            var id, teamMatch;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                teamMatch = {
                    id: id,
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
                return [2 /*return*/, teamMatch];
            });
        });
    };
    MemStorage.prototype.updateTeamMatch = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var teamMatch, updatedTeamMatch;
            return __generator(this, function (_a) {
                teamMatch = this.teamMatches.get(id);
                if (!teamMatch)
                    return [2 /*return*/, undefined];
                updatedTeamMatch = __assign(__assign({}, teamMatch), updates);
                this.teamMatches.set(id, updatedTeamMatch);
                return [2 /*return*/, updatedTeamMatch];
            });
        });
    };
    // Team Set Methods
    MemStorage.prototype.getTeamSet = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.teamSets.get(id)];
            });
        });
    };
    MemStorage.prototype.getTeamSetsByMatch = function (teamMatchId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.teamSets.values()).filter(function (set) { return set.teamMatchId === teamMatchId; })];
            });
        });
    };
    MemStorage.prototype.createTeamSet = function (insertTeamSet) {
        return __awaiter(this, void 0, void 0, function () {
            var id, teamSet;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                teamSet = {
                    id: id,
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
                return [2 /*return*/, teamSet];
            });
        });
    };
    MemStorage.prototype.updateTeamSet = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var teamSet, updatedTeamSet;
            return __generator(this, function (_a) {
                teamSet = this.teamSets.get(id);
                if (!teamSet)
                    return [2 /*return*/, undefined];
                updatedTeamSet = __assign(__assign({}, teamSet), updates);
                this.teamSets.set(id, updatedTeamSet);
                return [2 /*return*/, updatedTeamSet];
            });
        });
    };
    // Team Challenge System Methods
    MemStorage.prototype.getTeamChallenge = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.teamChallenges.get(id)];
            });
        });
    };
    MemStorage.prototype.getAllTeamChallenges = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.teamChallenges.values())];
            });
        });
    };
    MemStorage.prototype.getTeamChallengesByOperator = function (operatorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.teamChallenges.values()).filter(function (challenge) {
                        return challenge.operatorId === operatorId;
                    })];
            });
        });
    };
    MemStorage.prototype.getTeamChallengesByType = function (challengeType) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.teamChallenges.values()).filter(function (challenge) {
                        return challenge.challengeType === challengeType;
                    })];
            });
        });
    };
    MemStorage.prototype.getTeamChallengesByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.teamChallenges.values()).filter(function (challenge) {
                        return challenge.status === status;
                    })];
            });
        });
    };
    MemStorage.prototype.createTeamChallenge = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var challenge;
            var _a;
            return __generator(this, function (_b) {
                challenge = {
                    id: (0, crypto_1.randomUUID)(),
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
                    requiresProMembership: (_a = data.requiresProMembership) !== null && _a !== void 0 ? _a : true,
                    operatorId: data.operatorId,
                    createdAt: new Date(),
                };
                this.teamChallenges.set(challenge.id, challenge);
                return [2 /*return*/, challenge];
            });
        });
    };
    MemStorage.prototype.updateTeamChallenge = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var challenge, updatedChallenge;
            return __generator(this, function (_a) {
                challenge = this.teamChallenges.get(id);
                if (!challenge)
                    return [2 /*return*/, undefined];
                updatedChallenge = __assign(__assign({}, challenge), updates);
                this.teamChallenges.set(id, updatedChallenge);
                return [2 /*return*/, updatedChallenge];
            });
        });
    };
    MemStorage.prototype.acceptTeamChallenge = function (challengeId, acceptingTeamId) {
        return __awaiter(this, void 0, void 0, function () {
            var challenge, updatedChallenge;
            return __generator(this, function (_a) {
                challenge = this.teamChallenges.get(challengeId);
                if (!challenge || challenge.status !== "open")
                    return [2 /*return*/, undefined];
                updatedChallenge = __assign(__assign({}, challenge), { acceptingTeamId: acceptingTeamId, status: "accepted" });
                this.teamChallenges.set(challengeId, updatedChallenge);
                return [2 /*return*/, updatedChallenge];
            });
        });
    };
    MemStorage.prototype.getTeamChallengeParticipant = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.teamChallengeParticipants.get(id)];
            });
        });
    };
    MemStorage.prototype.getTeamChallengeParticipantsByChallenge = function (challengeId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.teamChallengeParticipants.values()).filter(function (participant) {
                        return participant.teamChallengeId === challengeId;
                    })];
            });
        });
    };
    MemStorage.prototype.createTeamChallengeParticipant = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var participant;
            return __generator(this, function (_a) {
                participant = {
                    id: (0, crypto_1.randomUUID)(),
                    teamChallengeId: data.teamChallengeId,
                    teamId: data.teamId,
                    playerId: data.playerId,
                    feeContribution: data.feeContribution,
                    hasPaid: data.hasPaid || false,
                    membershipTier: data.membershipTier,
                    createdAt: new Date(),
                };
                this.teamChallengeParticipants.set(participant.id, participant);
                return [2 /*return*/, participant];
            });
        });
    };
    MemStorage.prototype.updateTeamChallengeParticipant = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var participant, updatedParticipant;
            return __generator(this, function (_a) {
                participant = this.teamChallengeParticipants.get(id);
                if (!participant)
                    return [2 /*return*/, undefined];
                updatedParticipant = __assign(__assign({}, participant), updates);
                this.teamChallengeParticipants.set(id, updatedParticipant);
                return [2 /*return*/, updatedParticipant];
            });
        });
    };
    // Team Challenge Business Logic Methods
    MemStorage.prototype.calculateTeamChallengeStake = function (challengeType, individualFee) {
        var teamSize = this.getTeamSizeFromChallengeType(challengeType);
        return individualFee * teamSize;
    };
    MemStorage.prototype.getTeamSizeFromChallengeType = function (challengeType) {
        switch (challengeType) {
            case "2man_army": return 2;
            case "3man_crew": return 3;
            default: throw new Error("Unknown challenge type: ".concat(challengeType));
        }
    };
    MemStorage.prototype.validateProMembership = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            var player;
            return __generator(this, function (_a) {
                player = this.players.get(playerId);
                return [2 /*return*/, (player === null || player === void 0 ? void 0 : player.membershipTier) === "pro"];
            });
        });
    };
    MemStorage.prototype.createTeamChallengeWithParticipants = function (challengeData, teamPlayers) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, teamPlayers_1, playerId, isProMember, totalStake, challenge, participants, _a, teamPlayers_2, playerId, player, participant;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, teamPlayers_1 = teamPlayers;
                        _b.label = 1;
                    case 1:
                        if (!(_i < teamPlayers_1.length)) return [3 /*break*/, 4];
                        playerId = teamPlayers_1[_i];
                        return [4 /*yield*/, this.validateProMembership(playerId)];
                    case 2:
                        isProMember = _b.sent();
                        if (!isProMember) {
                            throw new Error("Player ".concat(playerId, " does not have Pro membership required for team challenges"));
                        }
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        totalStake = this.calculateTeamChallengeStake(challengeData.challengeType, challengeData.individualFee);
                        return [4 /*yield*/, this.createTeamChallenge(__assign(__assign({}, challengeData), { totalStake: totalStake }))];
                    case 5:
                        challenge = _b.sent();
                        participants = [];
                        _a = 0, teamPlayers_2 = teamPlayers;
                        _b.label = 6;
                    case 6:
                        if (!(_a < teamPlayers_2.length)) return [3 /*break*/, 9];
                        playerId = teamPlayers_2[_a];
                        player = this.players.get(playerId);
                        if (!player)
                            throw new Error("Player ".concat(playerId, " not found"));
                        return [4 /*yield*/, this.createTeamChallengeParticipant({
                                teamChallengeId: challenge.id,
                                teamId: challengeData.challengingTeamId,
                                playerId: playerId,
                                feeContribution: challengeData.individualFee,
                                membershipTier: player.membershipTier || "none",
                            })];
                    case 7:
                        participant = _b.sent();
                        participants.push(participant);
                        _b.label = 8;
                    case 8:
                        _a++;
                        return [3 /*break*/, 6];
                    case 9: return [2 /*return*/, { challenge: challenge, participants: participants }];
                }
            });
        });
    };
    // === SPORTSMANSHIP VOTE-OUT SYSTEM IMPLEMENTATION ===
    // Check-in management
    MemStorage.prototype.checkinUser = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var checkin;
            return __generator(this, function (_a) {
                checkin = {
                    id: (0, crypto_1.randomUUID)(),
                    userId: data.userId,
                    venueId: data.venueId,
                    sessionId: data.sessionId,
                    role: data.role,
                    verified: data.verified || false,
                    createdAt: new Date(),
                };
                this.checkins.set(checkin.id, checkin);
                return [2 /*return*/, checkin];
            });
        });
    };
    MemStorage.prototype.getCheckinsBySession = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.checkins.values()).filter(function (checkin) {
                        return checkin.sessionId === sessionId;
                    })];
            });
        });
    };
    MemStorage.prototype.getCheckinsByVenue = function (venueId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.checkins.values()).filter(function (checkin) {
                        return checkin.venueId === venueId;
                    })];
            });
        });
    };
    MemStorage.prototype.getActiveCheckins = function (sessionId, venueId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.checkins.values()).filter(function (checkin) {
                        return checkin.sessionId === sessionId && checkin.venueId === venueId;
                    })];
            });
        });
    };
    // Vote management
    MemStorage.prototype.createAttitudeVote = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var vote;
            return __generator(this, function (_a) {
                vote = {
                    id: (0, crypto_1.randomUUID)(),
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
                return [2 /*return*/, vote];
            });
        });
    };
    MemStorage.prototype.getAttitudeVote = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.attitudeVotes.get(id)];
            });
        });
    };
    MemStorage.prototype.getActiveVotes = function (sessionId, venueId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.attitudeVotes.values()).filter(function (vote) {
                        return vote.sessionId === sessionId &&
                            vote.venueId === venueId &&
                            vote.status === "open";
                    })];
            });
        });
    };
    MemStorage.prototype.updateAttitudeVote = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var vote, updatedVote;
            return __generator(this, function (_a) {
                vote = this.attitudeVotes.get(id);
                if (!vote)
                    return [2 /*return*/, undefined];
                updatedVote = __assign(__assign({}, vote), updates);
                this.attitudeVotes.set(id, updatedVote);
                return [2 /*return*/, updatedVote];
            });
        });
    };
    MemStorage.prototype.closeAttitudeVote = function (id, result) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateAttitudeVote(id, { status: "closed", result: result })];
            });
        });
    };
    // Ballot management
    MemStorage.prototype.createAttitudeBallot = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var ballot;
            return __generator(this, function (_a) {
                ballot = {
                    id: (0, crypto_1.randomUUID)(),
                    voteId: data.voteId,
                    voterUserId: data.voterUserId,
                    weight: data.weight || 1,
                    choice: data.choice,
                    tags: nullifyUndefined(data.tags),
                    note: nullifyUndefined(data.note),
                    createdAt: new Date(),
                };
                this.attitudeBallots.set(ballot.id, ballot);
                return [2 /*return*/, ballot];
            });
        });
    };
    MemStorage.prototype.getBallotsByVote = function (voteId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.attitudeBallots.values()).filter(function (ballot) {
                        return ballot.voteId === voteId;
                    })];
            });
        });
    };
    MemStorage.prototype.hasUserVoted = function (voteId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.attitudeBallots.values()).some(function (ballot) {
                        return ballot.voteId === voteId && ballot.voterUserId === userId;
                    })];
            });
        });
    };
    // Vote calculation utilities
    MemStorage.prototype.calculateVoteWeights = function (voteId) {
        return __awaiter(this, void 0, void 0, function () {
            var ballots, outWeight, keepWeight, _i, ballots_1, ballot;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getBallotsByVote(voteId)];
                    case 1:
                        ballots = _a.sent();
                        outWeight = 0;
                        keepWeight = 0;
                        for (_i = 0, ballots_1 = ballots; _i < ballots_1.length; _i++) {
                            ballot = ballots_1[_i];
                            if (ballot.choice === "out") {
                                outWeight += ballot.weight;
                            }
                            else if (ballot.choice === "keep") {
                                keepWeight += ballot.weight;
                            }
                        }
                        return [2 /*return*/, {
                                totalWeight: outWeight + keepWeight,
                                outWeight: outWeight,
                                keepWeight: keepWeight
                            }];
                }
            });
        });
    };
    MemStorage.prototype.checkVoteQuorum = function (voteId) {
        return __awaiter(this, void 0, void 0, function () {
            var vote, totalWeight;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAttitudeVote(voteId)];
                    case 1:
                        vote = _a.sent();
                        if (!vote)
                            return [2 /*return*/, false];
                        return [4 /*yield*/, this.calculateVoteWeights(voteId)];
                    case 2:
                        totalWeight = (_a.sent()).totalWeight;
                        return [2 /*return*/, totalWeight >= vote.quorumRequired];
                }
            });
        });
    };
    // Incident management
    MemStorage.prototype.createIncident = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var incident;
            var _a, _b, _c, _d, _e, _f, _g;
            return __generator(this, function (_h) {
                incident = {
                    id: (0, crypto_1.randomUUID)(),
                    userId: data.userId,
                    sessionId: (_a = data.sessionId) !== null && _a !== void 0 ? _a : "",
                    venueId: (_b = data.venueId) !== null && _b !== void 0 ? _b : "",
                    type: (_c = data.type) !== null && _c !== void 0 ? _c : "",
                    details: (_d = data.details) !== null && _d !== void 0 ? _d : "",
                    consequence: (_e = data.consequence) !== null && _e !== void 0 ? _e : "",
                    pointsPenalty: data.pointsPenalty || 0,
                    creditsFine: data.creditsFine || 0,
                    createdBy: (_f = data.createdBy) !== null && _f !== void 0 ? _f : "",
                    voteId: (_g = data.voteId) !== null && _g !== void 0 ? _g : null,
                    createdAt: new Date(),
                };
                this.incidents.set(incident.id, incident);
                return [2 /*return*/, incident];
            });
        });
    };
    MemStorage.prototype.getIncidentsByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.incidents.values()).filter(function (incident) {
                        return incident.userId === userId;
                    })];
            });
        });
    };
    MemStorage.prototype.getRecentIncidents = function (venueId, hours) {
        return __awaiter(this, void 0, void 0, function () {
            var cutoffTime;
            return __generator(this, function (_a) {
                cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
                return [2 /*return*/, Array.from(this.incidents.values()).filter(function (incident) {
                        return incident.venueId === venueId &&
                            incident.createdAt && incident.createdAt >= cutoffTime;
                    })];
            });
        });
    };
    // User eligibility and cooldowns
    MemStorage.prototype.canUserBeVotedOn = function (userId, sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var recentVotes, todayIncidents;
            return __generator(this, function (_a) {
                recentVotes = Array.from(this.attitudeVotes.values()).filter(function (vote) {
                    return vote.targetUserId === userId &&
                        vote.sessionId === sessionId &&
                        vote.startedAt && vote.startedAt > new Date(Date.now() - 15 * 60 * 1000);
                } // 15 minutes ago
                );
                // Can't be voted on if there was a recent vote
                if (recentVotes.length > 0)
                    return [2 /*return*/, false];
                todayIncidents = Array.from(this.incidents.values()).filter(function (incident) {
                    return incident.userId === userId &&
                        incident.type === "ejection" &&
                        incident.createdAt && incident.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000);
                } // Last 24 hours
                );
                return [2 /*return*/, todayIncidents.length === 0];
            });
        });
    };
    MemStorage.prototype.getLastVoteForUser = function (userId, sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var userVotes;
            return __generator(this, function (_a) {
                userVotes = Array.from(this.attitudeVotes.values())
                    .filter(function (vote) { return vote.targetUserId === userId && vote.sessionId === sessionId; })
                    .sort(function (a, b) { var _a, _b; return (((_a = b.startedAt) === null || _a === void 0 ? void 0 : _a.getTime()) || 0) - (((_b = a.startedAt) === null || _b === void 0 ? void 0 : _b.getTime()) || 0); });
                return [2 /*return*/, userVotes[0]];
            });
        });
    };
    MemStorage.prototype.isUserImmune = function (userId, sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var activeMatches;
            return __generator(this, function (_a) {
                activeMatches = Array.from(this.matches.values()).filter(function (match) {
                    return (match.challenger === userId || match.opponent === userId) &&
                        match.status === "in_progress";
                });
                // If user is in an active match, they have immunity (during their turn)
                // This is a simplified implementation - real implementation would check whose turn it is
                return [2 /*return*/, activeMatches.length > 0];
            });
        });
    };
    // === MATCH DIVISION SYSTEM IMPLEMENTATION ===
    // Match Division management
    MemStorage.prototype.createMatchDivision = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var division;
            var _a;
            return __generator(this, function (_b) {
                division = {
                    id: (0, crypto_1.randomUUID)(),
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
                    active: (_a = data.active) !== null && _a !== void 0 ? _a : true,
                    createdAt: new Date(),
                };
                this.matchDivisions.set(division.id, division);
                return [2 /*return*/, division];
            });
        });
    };
    MemStorage.prototype.getMatchDivisions = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.matchDivisions.values()).filter(function (d) { return d.active; })];
            });
        });
    };
    MemStorage.prototype.getMatchDivision = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.matchDivisions.get(id)];
            });
        });
    };
    MemStorage.prototype.getMatchDivisionByName = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.matchDivisions.values()).find(function (d) { return d.name === name && d.active; })];
            });
        });
    };
    // Operator Tier management
    MemStorage.prototype.createOperatorTier = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var tier;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                tier = {
                    id: (0, crypto_1.randomUUID)(),
                    name: data.name,
                    displayName: data.displayName,
                    monthlyFee: data.monthlyFee,
                    revenueSplitPercent: data.revenueSplitPercent,
                    maxTeams: (_a = data.maxTeams) !== null && _a !== void 0 ? _a : null,
                    hasPromoTools: data.hasPromoTools || false,
                    hasLiveStreamBonus: data.hasLiveStreamBonus || false,
                    hasResellRights: data.hasResellRights || false,
                    description: (_b = data.description) !== null && _b !== void 0 ? _b : null,
                    features: data.features || [],
                    active: (_c = data.active) !== null && _c !== void 0 ? _c : true,
                    createdAt: new Date(),
                };
                this.operatorTiers.set(tier.id, tier);
                return [2 /*return*/, tier];
            });
        });
    };
    MemStorage.prototype.getOperatorTiers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.operatorTiers.values()).filter(function (t) { return t.active; })];
            });
        });
    };
    MemStorage.prototype.getOperatorTier = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.operatorTiers.get(id)];
            });
        });
    };
    MemStorage.prototype.getOperatorTierByName = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.operatorTiers.values()).find(function (t) { return t.name === name && t.active; })];
            });
        });
    };
    // Team Stripe Connect Account management
    MemStorage.prototype.createTeamStripeAccount = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var account;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                account = {
                    id: (0, crypto_1.randomUUID)(),
                    teamId: data.teamId,
                    stripeAccountId: data.stripeAccountId,
                    accountStatus: data.accountStatus || "pending",
                    onboardingCompleted: data.onboardingCompleted || false,
                    detailsSubmitted: data.detailsSubmitted || false,
                    payoutsEnabled: data.payoutsEnabled || false,
                    chargesEnabled: data.chargesEnabled || false,
                    businessType: (_a = data.businessType) !== null && _a !== void 0 ? _a : null,
                    country: data.country || "US",
                    email: (_b = data.email) !== null && _b !== void 0 ? _b : null,
                    lastOnboardingRefresh: (_c = data.lastOnboardingRefresh) !== null && _c !== void 0 ? _c : null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                this.teamStripeAccounts.set(account.id, account);
                return [2 /*return*/, account];
            });
        });
    };
    MemStorage.prototype.getTeamStripeAccount = function (teamId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.teamStripeAccounts.values()).find(function (a) { return a.teamId === teamId; })];
            });
        });
    };
    MemStorage.prototype.updateTeamStripeAccount = function (teamId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var account, updatedAccount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getTeamStripeAccount(teamId)];
                    case 1:
                        account = _a.sent();
                        if (!account)
                            return [2 /*return*/, undefined];
                        updatedAccount = __assign(__assign(__assign({}, account), updates), { updatedAt: new Date() });
                        this.teamStripeAccounts.set(account.id, updatedAccount);
                        return [2 /*return*/, updatedAccount];
                }
            });
        });
    };
    // Match Entry management
    MemStorage.prototype.createMatchEntry = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var entry;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            return __generator(this, function (_l) {
                entry = {
                    id: (0, crypto_1.randomUUID)(),
                    matchId: data.matchId,
                    divisionId: data.divisionId,
                    homeTeamId: data.homeTeamId,
                    awayTeamId: (_a = data.awayTeamId) !== null && _a !== void 0 ? _a : null,
                    entryFeePerPlayer: data.entryFeePerPlayer,
                    totalStake: data.totalStake,
                    stripeCheckoutSessionId: (_b = data.stripeCheckoutSessionId) !== null && _b !== void 0 ? _b : null,
                    stripePaymentIntentId: (_c = data.stripePaymentIntentId) !== null && _c !== void 0 ? _c : null,
                    paymentStatus: data.paymentStatus || "pending",
                    matchStatus: data.matchStatus || "open",
                    winnerId: (_d = data.winnerId) !== null && _d !== void 0 ? _d : null,
                    homeScore: data.homeScore || 0,
                    awayScore: data.awayScore || 0,
                    scheduledAt: (_e = data.scheduledAt) !== null && _e !== void 0 ? _e : null,
                    completedAt: (_f = data.completedAt) !== null && _f !== void 0 ? _f : null,
                    venueId: (_g = data.venueId) !== null && _g !== void 0 ? _g : null,
                    streamUrl: (_h = data.streamUrl) !== null && _h !== void 0 ? _h : null,
                    captainHomeId: (_j = data.captainHomeId) !== null && _j !== void 0 ? _j : null,
                    captainAwayId: (_k = data.captainAwayId) !== null && _k !== void 0 ? _k : null,
                    operatorId: data.operatorId,
                    metadata: data.metadata,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                this.matchEntries.set(entry.id, entry);
                return [2 /*return*/, entry];
            });
        });
    };
    MemStorage.prototype.getMatchEntry = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.matchEntries.get(id)];
            });
        });
    };
    MemStorage.prototype.getMatchEntryByMatchId = function (matchId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.matchEntries.values()).find(function (e) { return e.matchId === matchId; })];
            });
        });
    };
    MemStorage.prototype.getMatchEntriesByDivision = function (divisionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.matchEntries.values()).filter(function (e) { return e.divisionId === divisionId; })];
            });
        });
    };
    MemStorage.prototype.updateMatchEntry = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var entry, updatedEntry;
            return __generator(this, function (_a) {
                entry = this.matchEntries.get(id);
                if (!entry)
                    return [2 /*return*/, undefined];
                updatedEntry = __assign(__assign(__assign({}, entry), updates), { updatedAt: new Date() });
                this.matchEntries.set(id, updatedEntry);
                return [2 /*return*/, updatedEntry];
            });
        });
    };
    // Payout Distribution management
    MemStorage.prototype.createPayoutDistribution = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var payout;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                payout = {
                    id: (0, crypto_1.randomUUID)(),
                    matchEntryId: data.matchEntryId,
                    winningTeamId: data.winningTeamId,
                    totalPayout: data.totalPayout,
                    platformFee: data.platformFee,
                    operatorFee: data.operatorFee,
                    teamPayout: data.teamPayout,
                    stripeTransferId: (_a = data.stripeTransferId) !== null && _a !== void 0 ? _a : null,
                    transferStatus: data.transferStatus || "pending",
                    transferredAt: (_b = data.transferredAt) !== null && _b !== void 0 ? _b : null,
                    operatorTierAtPayout: (_c = data.operatorTierAtPayout) !== null && _c !== void 0 ? _c : null,
                    revenueSplitAtPayout: (_d = data.revenueSplitAtPayout) !== null && _d !== void 0 ? _d : null,
                    payoutMethod: data.payoutMethod || "stripe_transfer",
                    notes: (_e = data.notes) !== null && _e !== void 0 ? _e : null,
                    createdAt: new Date(),
                };
                this.payoutDistributions.set(payout.id, payout);
                return [2 /*return*/, payout];
            });
        });
    };
    MemStorage.prototype.getPayoutDistribution = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.payoutDistributions.get(id)];
            });
        });
    };
    MemStorage.prototype.getPayoutByMatchEntry = function (matchEntryId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.payoutDistributions.values()).find(function (p) { return p.matchEntryId === matchEntryId; })];
            });
        });
    };
    MemStorage.prototype.updatePayoutDistribution = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var payout, updatedPayout;
            return __generator(this, function (_a) {
                payout = this.payoutDistributions.get(id);
                if (!payout)
                    return [2 /*return*/, undefined];
                updatedPayout = __assign(__assign({}, payout), updates);
                this.payoutDistributions.set(id, updatedPayout);
                return [2 /*return*/, updatedPayout];
            });
        });
    };
    // Team Registration management
    MemStorage.prototype.createTeamRegistration = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var registration;
            var _a, _b, _c, _d, _e, _f, _g;
            return __generator(this, function (_h) {
                registration = {
                    id: (0, crypto_1.randomUUID)(),
                    teamId: data.teamId,
                    divisionId: data.divisionId,
                    captainId: data.captainId,
                    teamName: data.teamName,
                    logoUrl: (_a = data.logoUrl) !== null && _a !== void 0 ? _a : null,
                    playerRoster: data.playerRoster || [],
                    entryFeePaid: data.entryFeePaid || false,
                    stripePaymentIntentId: (_b = data.stripePaymentIntentId) !== null && _b !== void 0 ? _b : null,
                    registrationStatus: data.registrationStatus || "pending",
                    confirmedAt: (_c = data.confirmedAt) !== null && _c !== void 0 ? _c : null,
                    bracketPosition: (_d = data.bracketPosition) !== null && _d !== void 0 ? _d : null,
                    seedRank: (_e = data.seedRank) !== null && _e !== void 0 ? _e : null,
                    operatorId: data.operatorId,
                    venueId: (_f = data.venueId) !== null && _f !== void 0 ? _f : null,
                    seasonId: (_g = data.seasonId) !== null && _g !== void 0 ? _g : null,
                    metadata: data.metadata,
                    createdAt: new Date(),
                };
                this.teamRegistrations.set(registration.id, registration);
                return [2 /*return*/, registration];
            });
        });
    };
    MemStorage.prototype.getTeamRegistration = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.teamRegistrations.get(id)];
            });
        });
    };
    MemStorage.prototype.getTeamRegistrationsByDivision = function (divisionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.teamRegistrations.values()).filter(function (r) { return r.divisionId === divisionId; })];
            });
        });
    };
    MemStorage.prototype.updateTeamRegistration = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var registration, updatedRegistration;
            return __generator(this, function (_a) {
                registration = this.teamRegistrations.get(id);
                if (!registration)
                    return [2 /*return*/, undefined];
                updatedRegistration = __assign(__assign({}, registration), updates);
                this.teamRegistrations.set(id, updatedRegistration);
                return [2 /*return*/, updatedRegistration];
            });
        });
    };
    // === FILE UPLOAD TRACKING METHODS ===
    MemStorage.prototype.getUploadedFile = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.uploadedFiles.get(id)];
            });
        });
    };
    MemStorage.prototype.getUploadedFileByPath = function (objectPath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.uploadedFiles.values()).find(function (file) { return file.objectPath === objectPath; })];
            });
        });
    };
    MemStorage.prototype.getUserUploadedFiles = function (userId, category) {
        return __awaiter(this, void 0, void 0, function () {
            var userFiles;
            return __generator(this, function (_a) {
                userFiles = Array.from(this.uploadedFiles.values()).filter(function (file) {
                    return file.userId === userId && file.isActive;
                });
                if (category) {
                    return [2 /*return*/, userFiles.filter(function (file) { return file.category === category; })];
                }
                return [2 /*return*/, userFiles];
            });
        });
    };
    MemStorage.prototype.getAllUploadedFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.uploadedFiles.values()).filter(function (file) { return file.isActive; })];
            });
        });
    };
    MemStorage.prototype.createUploadedFile = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var file;
            return __generator(this, function (_a) {
                file = {
                    id: (0, crypto_1.randomUUID)(),
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
                return [2 /*return*/, file];
            });
        });
    };
    MemStorage.prototype.updateUploadedFile = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var file, updatedFile;
            return __generator(this, function (_a) {
                file = this.uploadedFiles.get(id);
                if (!file)
                    return [2 /*return*/, undefined];
                updatedFile = __assign(__assign({}, file), updates);
                this.uploadedFiles.set(id, updatedFile);
                return [2 /*return*/, updatedFile];
            });
        });
    };
    MemStorage.prototype.deleteUploadedFile = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var file, updatedFile;
            return __generator(this, function (_a) {
                file = this.uploadedFiles.get(id);
                if (!file)
                    return [2 /*return*/, false];
                updatedFile = __assign(__assign({}, file), { isActive: false });
                this.uploadedFiles.set(id, updatedFile);
                return [2 /*return*/, true];
            });
        });
    };
    MemStorage.prototype.incrementFileDownloadCount = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var file, updatedFile;
            return __generator(this, function (_a) {
                file = this.uploadedFiles.get(id);
                if (!file)
                    return [2 /*return*/];
                updatedFile = __assign(__assign({}, file), { downloadCount: (file.downloadCount || 0) + 1 });
                this.uploadedFiles.set(id, updatedFile);
                return [2 /*return*/];
            });
        });
    };
    // === FILE SHARING METHODS ===
    MemStorage.prototype.getFileShare = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.fileShares.get(id)];
            });
        });
    };
    MemStorage.prototype.getFileShares = function (fileId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.fileShares.values()).filter(function (share) {
                        return share.fileId === fileId && share.isActive;
                    })];
            });
        });
    };
    MemStorage.prototype.getUserSharedFiles = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.fileShares.values()).filter(function (share) {
                        return share.sharedWithUserId === userId && share.isActive;
                    })];
            });
        });
    };
    MemStorage.prototype.createFileShare = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var share;
            return __generator(this, function (_a) {
                share = {
                    id: (0, crypto_1.randomUUID)(),
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
                return [2 /*return*/, share];
            });
        });
    };
    MemStorage.prototype.updateFileShare = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var share, updatedShare;
            return __generator(this, function (_a) {
                share = this.fileShares.get(id);
                if (!share)
                    return [2 /*return*/, undefined];
                updatedShare = __assign(__assign({}, share), updates);
                this.fileShares.set(id, updatedShare);
                return [2 /*return*/, updatedShare];
            });
        });
    };
    MemStorage.prototype.deleteFileShare = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var share, updatedShare;
            return __generator(this, function (_a) {
                share = this.fileShares.get(id);
                if (!share)
                    return [2 /*return*/, false];
                updatedShare = __assign(__assign({}, share), { isActive: false });
                this.fileShares.set(id, updatedShare);
                return [2 /*return*/, true];
            });
        });
    };
    // === WEIGHT RULES METHODS ===
    MemStorage.prototype.getWeightRule = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.weightRules.get(id)];
            });
        });
    };
    MemStorage.prototype.getWeightRulesByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.weightRules.values()).filter(function (rule) { return rule.playerId === playerId; })];
            });
        });
    };
    MemStorage.prototype.createWeightRule = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var rule;
            return __generator(this, function (_a) {
                rule = {
                    id: (0, crypto_1.randomUUID)(),
                    playerId: data.playerId,
                    opponentId: data.opponentId,
                    consecutiveLosses: data.consecutiveLosses || 0,
                    totalLosses: data.totalLosses || 0,
                    weightOwed: data.weightOwed || false,
                    lastLossAt: data.lastLossAt || null,
                    createdAt: new Date(),
                };
                this.weightRules.set(rule.id, rule);
                return [2 /*return*/, rule];
            });
        });
    };
    MemStorage.prototype.updateWeightRule = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var rule, updatedRule;
            return __generator(this, function (_a) {
                rule = this.weightRules.get(id);
                if (!rule)
                    return [2 /*return*/, undefined];
                updatedRule = __assign(__assign({}, rule), updates);
                this.weightRules.set(id, updatedRule);
                return [2 /*return*/, updatedRule];
            });
        });
    };
    // === TUTORING SYSTEM METHODS ===
    MemStorage.prototype.getTutoringSession = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.tutoringSessions.get(id)];
            });
        });
    };
    MemStorage.prototype.getTutoringSessionsByTutor = function (tutorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.tutoringSessions.values()).filter(function (session) { return session.tutorId === tutorId; })];
            });
        });
    };
    MemStorage.prototype.getTutoringSessionsByRookie = function (rookieId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.tutoringSessions.values()).filter(function (session) { return session.rookieId === rookieId; })];
            });
        });
    };
    MemStorage.prototype.createTutoringSession = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var session;
            return __generator(this, function (_a) {
                session = {
                    id: (0, crypto_1.randomUUID)(),
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
                return [2 /*return*/, session];
            });
        });
    };
    MemStorage.prototype.updateTutoringSession = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var session, updatedSession;
            return __generator(this, function (_a) {
                session = this.tutoringSessions.get(id);
                if (!session)
                    return [2 /*return*/, undefined];
                updatedSession = __assign(__assign({}, session), updates);
                this.tutoringSessions.set(id, updatedSession);
                return [2 /*return*/, updatedSession];
            });
        });
    };
    MemStorage.prototype.getTutoringCredits = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.tutoringCredits.get(id)];
            });
        });
    };
    MemStorage.prototype.getTutoringCreditsByTutor = function (tutorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.tutoringCredits.values()).filter(function (credits) { return credits.tutorId === tutorId; })];
            });
        });
    };
    MemStorage.prototype.createTutoringCredits = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var credits;
            var _a;
            return __generator(this, function (_b) {
                credits = {
                    id: (0, crypto_1.randomUUID)(),
                    tutorId: data.tutorId,
                    sessionId: (_a = data.sessionId) !== null && _a !== void 0 ? _a : null,
                    amount: data.amount,
                    applied: data.applied || false,
                    createdAt: new Date(),
                };
                this.tutoringCredits.set(credits.id, credits);
                return [2 /*return*/, credits];
            });
        });
    };
    // === COMMISSION AND EARNINGS METHODS ===
    MemStorage.prototype.getCommissionRate = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.commissionRates.get(id)];
            });
        });
    };
    MemStorage.prototype.getCommissionRatesByOperator = function (operatorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.commissionRates.values()).filter(function (rate) { return rate.operatorId === operatorId; })];
            });
        });
    };
    MemStorage.prototype.createCommissionRate = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var rate;
            return __generator(this, function (_a) {
                rate = {
                    id: (0, crypto_1.randomUUID)(),
                    operatorId: data.operatorId,
                    membershipTier: data.membershipTier,
                    platformCommissionBps: data.platformCommissionBps,
                    operatorCommissionBps: data.operatorCommissionBps,
                    escrowCommissionBps: data.escrowCommissionBps || 250,
                    effectiveDate: data.effectiveDate || new Date(),
                    createdAt: new Date(),
                };
                this.commissionRates.set(rate.id, rate);
                return [2 /*return*/, rate];
            });
        });
    };
    MemStorage.prototype.getPlatformEarnings = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.platformEarnings.get(id)];
            });
        });
    };
    MemStorage.prototype.getPlatformEarningsByOperator = function (operatorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.platformEarnings.values()).filter(function (earnings) { return earnings.operatorId === operatorId; })];
            });
        });
    };
    MemStorage.prototype.createPlatformEarnings = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var earnings;
            return __generator(this, function (_a) {
                earnings = {
                    id: (0, crypto_1.randomUUID)(),
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
                return [2 /*return*/, earnings];
            });
        });
    };
    MemStorage.prototype.getMembershipEarnings = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.membershipEarnings.get(id)];
            });
        });
    };
    MemStorage.prototype.getMembershipEarningsByOperator = function (operatorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.membershipEarnings.values()).filter(function (earnings) { return earnings.operatorId === operatorId; })];
            });
        });
    };
    MemStorage.prototype.createMembershipEarnings = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var earnings;
            return __generator(this, function (_a) {
                earnings = {
                    id: (0, crypto_1.randomUUID)(),
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
                return [2 /*return*/, earnings];
            });
        });
    };
    MemStorage.prototype.getOperatorPayout = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.operatorPayouts.get(id)];
            });
        });
    };
    MemStorage.prototype.getOperatorPayoutsByOperator = function (operatorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.operatorPayouts.values()).filter(function (payout) { return payout.operatorId === operatorId; })];
            });
        });
    };
    MemStorage.prototype.createOperatorPayout = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var payout;
            return __generator(this, function (_a) {
                payout = {
                    id: (0, crypto_1.randomUUID)(),
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
                return [2 /*return*/, payout];
            });
        });
    };
    // === CHALLENGE CALENDAR METHODS ===
    MemStorage.prototype.getChallenge = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.challenges.get(id)];
            });
        });
    };
    MemStorage.prototype.createChallenge = function (insertChallenge) {
        return __awaiter(this, void 0, void 0, function () {
            var id, challenge;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                id = (0, crypto_1.randomUUID)();
                challenge = {
                    id: id,
                    aPlayerId: insertChallenge.aPlayerId,
                    bPlayerId: insertChallenge.bPlayerId,
                    aPlayerName: insertChallenge.aPlayerName,
                    bPlayerName: insertChallenge.bPlayerName,
                    gameType: insertChallenge.gameType,
                    tableType: insertChallenge.tableType,
                    stakes: insertChallenge.stakes,
                    scheduledAt: new Date(insertChallenge.scheduledAt),
                    durationMinutes: (_a = insertChallenge.durationMinutes) !== null && _a !== void 0 ? _a : 90,
                    hallId: insertChallenge.hallId,
                    hallName: insertChallenge.hallName,
                    status: (_b = insertChallenge.status) !== null && _b !== void 0 ? _b : "scheduled",
                    checkedInAt: nullifyUndefined(insertChallenge.checkedInAt),
                    completedAt: nullifyUndefined(insertChallenge.completedAt),
                    winnerId: nullifyUndefined(insertChallenge.winnerId),
                    posterImageUrl: nullifyUndefined(insertChallenge.posterImageUrl),
                    description: nullifyUndefined(insertChallenge.description),
                    lateFeesApplied: (_c = insertChallenge.lateFeesApplied) !== null && _c !== void 0 ? _c : false,
                    noShowFeesApplied: (_d = insertChallenge.noShowFeesApplied) !== null && _d !== void 0 ? _d : false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                this.challenges.set(id, challenge);
                return [2 /*return*/, challenge];
            });
        });
    };
    MemStorage.prototype.updateChallenge = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, updateMapRecord(this.challenges, id, updates, NULLABLE_FIELDS.Challenge)];
            });
        });
    };
    MemStorage.prototype.getChallengesByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.challenges.values()).filter(function (challenge) { return challenge.aPlayerId === playerId || challenge.bPlayerId === playerId; })];
            });
        });
    };
    MemStorage.prototype.getChallengesByHall = function (hallId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.challenges.values()).filter(function (challenge) { return challenge.hallId === hallId; })];
            });
        });
    };
    MemStorage.prototype.getChallengesByDateRange = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.challenges.values()).filter(function (challenge) {
                        var scheduledAt = new Date(challenge.scheduledAt);
                        return scheduledAt >= startDate && scheduledAt <= endDate;
                    })];
            });
        });
    };
    MemStorage.prototype.getUpcomingChallenges = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            var now;
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_a) {
                now = new Date();
                return [2 /*return*/, Array.from(this.challenges.values())
                        .filter(function (challenge) { return new Date(challenge.scheduledAt) > now; })
                        .sort(function (a, b) { return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(); })
                        .slice(0, limit)];
            });
        });
    };
    // Challenge Fees
    MemStorage.prototype.getChallengeFee = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.challengeFees.get(id)];
            });
        });
    };
    MemStorage.prototype.createChallengeFee = function (insertFee) {
        return __awaiter(this, void 0, void 0, function () {
            var id, fee;
            var _a, _b;
            return __generator(this, function (_c) {
                id = (0, crypto_1.randomUUID)();
                fee = {
                    id: id,
                    challengeId: insertFee.challengeId,
                    playerId: insertFee.playerId,
                    feeType: insertFee.feeType,
                    amount: insertFee.amount,
                    scheduledAt: new Date(insertFee.scheduledAt),
                    actualAt: nullifyUndefined(insertFee.actualAt),
                    minutesLate: (_a = insertFee.minutesLate) !== null && _a !== void 0 ? _a : 0,
                    status: (_b = insertFee.status) !== null && _b !== void 0 ? _b : "pending",
                    stripeChargeId: nullifyUndefined(insertFee.stripeChargeId),
                    stripeCustomerId: nullifyUndefined(insertFee.stripeCustomerId),
                    chargedAt: nullifyUndefined(insertFee.chargedAt),
                    waivedAt: nullifyUndefined(insertFee.waivedAt),
                    waivedBy: nullifyUndefined(insertFee.waivedBy),
                    waiverReason: nullifyUndefined(insertFee.waiverReason),
                    createdAt: new Date(),
                };
                this.challengeFees.set(id, fee);
                return [2 /*return*/, fee];
            });
        });
    };
    MemStorage.prototype.updateChallengeFee = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, updateMapRecord(this.challengeFees, id, updates, NULLABLE_FIELDS.ChallengeFee)];
            });
        });
    };
    MemStorage.prototype.getChallengeFeesByChallenge = function (challengeId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.challengeFees.values()).filter(function (fee) { return fee.challengeId === challengeId; })];
            });
        });
    };
    MemStorage.prototype.getChallengeFeesByStatus = function (statuses) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.challengeFees.values()).filter(function (fee) { return statuses.includes(fee.status); })];
            });
        });
    };
    // Challenge Check-ins
    MemStorage.prototype.createChallengeCheckIn = function (insertCheckIn) {
        return __awaiter(this, void 0, void 0, function () {
            var id, checkIn;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                checkIn = {
                    id: id,
                    challengeId: insertCheckIn.challengeId,
                    playerId: insertCheckIn.playerId,
                    checkedInAt: new Date(insertCheckIn.checkedInAt),
                    checkedInBy: nullifyUndefined(insertCheckIn.checkedInBy),
                    location: nullifyUndefined(insertCheckIn.location),
                    createdAt: new Date(),
                };
                this.challengeCheckIns.set(id, checkIn);
                return [2 /*return*/, checkIn];
            });
        });
    };
    MemStorage.prototype.getChallengeCheckInsByChallenge = function (challengeId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.challengeCheckIns.values()).filter(function (checkIn) { return checkIn.challengeId === challengeId; })];
            });
        });
    };
    // Challenge Policies
    MemStorage.prototype.getChallengesPolicyByHall = function (hallId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.challengePolicies.values()).find(function (policy) { return policy.hallId === hallId; })];
            });
        });
    };
    MemStorage.prototype.createChallengePolicy = function (insertPolicy) {
        return __awaiter(this, void 0, void 0, function () {
            var id, policy;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            return __generator(this, function (_o) {
                id = (0, crypto_1.randomUUID)();
                policy = {
                    id: id,
                    hallId: insertPolicy.hallId,
                    lateFeeEnabled: (_a = insertPolicy.lateFeeEnabled) !== null && _a !== void 0 ? _a : true,
                    lateFeeAmount: (_b = insertPolicy.lateFeeAmount) !== null && _b !== void 0 ? _b : 500,
                    lateFeeThresholdMinutes: (_c = insertPolicy.lateFeeThresholdMinutes) !== null && _c !== void 0 ? _c : 15,
                    noShowFeeEnabled: (_d = insertPolicy.noShowFeeEnabled) !== null && _d !== void 0 ? _d : true,
                    noShowFeeAmount: (_e = insertPolicy.noShowFeeAmount) !== null && _e !== void 0 ? _e : 1500,
                    noShowThresholdMinutes: (_f = insertPolicy.noShowThresholdMinutes) !== null && _f !== void 0 ? _f : 45,
                    cancellationFeeEnabled: (_g = insertPolicy.cancellationFeeEnabled) !== null && _g !== void 0 ? _g : true,
                    cancellationFeeAmount: (_h = insertPolicy.cancellationFeeAmount) !== null && _h !== void 0 ? _h : 1000,
                    cancellationThresholdHours: (_j = insertPolicy.cancellationThresholdHours) !== null && _j !== void 0 ? _j : 24,
                    gracePeriodMinutes: (_k = insertPolicy.gracePeriodMinutes) !== null && _k !== void 0 ? _k : 5,
                    autoChargeEnabled: (_l = insertPolicy.autoChargeEnabled) !== null && _l !== void 0 ? _l : true,
                    requireConfirmation: (_m = insertPolicy.requireConfirmation) !== null && _m !== void 0 ? _m : false,
                    updatedBy: insertPolicy.updatedBy,
                    updatedAt: new Date(),
                };
                this.challengePolicies.set(id, policy);
                return [2 /*return*/, policy];
            });
        });
    };
    MemStorage.prototype.updateChallengePolicy = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, updateMapRecord(this.challengePolicies, id, updates, NULLABLE_FIELDS.ChallengePolicy)];
            });
        });
    };
    // QR Code Nonce Management (Replay Protection)
    MemStorage.prototype.createQrCodeNonce = function (insertNonce) {
        return __awaiter(this, void 0, void 0, function () {
            var nonce;
            return __generator(this, function (_a) {
                nonce = {
                    nonce: insertNonce.nonce,
                    challengeId: insertNonce.challengeId,
                    createdAt: new Date(),
                    expiresAt: new Date(insertNonce.expiresAt),
                    usedAt: insertNonce.usedAt ? new Date(insertNonce.usedAt) : null,
                    ipAddress: nullifyUndefined(insertNonce.ipAddress),
                    userAgent: nullifyUndefined(insertNonce.userAgent),
                };
                this.qrCodeNonces.set(insertNonce.nonce, nonce);
                return [2 /*return*/, nonce];
            });
        });
    };
    MemStorage.prototype.markNonceAsUsed = function (nonce, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function () {
            var existingNonce, updatedNonce;
            return __generator(this, function (_a) {
                existingNonce = this.qrCodeNonces.get(nonce);
                if (!existingNonce) {
                    return [2 /*return*/, undefined];
                }
                updatedNonce = __assign(__assign({}, existingNonce), { usedAt: new Date(), ipAddress: ipAddress || existingNonce.ipAddress, userAgent: userAgent || existingNonce.userAgent });
                this.qrCodeNonces.set(nonce, updatedNonce);
                return [2 /*return*/, updatedNonce];
            });
        });
    };
    MemStorage.prototype.isNonceUsed = function (nonce) {
        return __awaiter(this, void 0, void 0, function () {
            var existingNonce;
            return __generator(this, function (_a) {
                existingNonce = this.qrCodeNonces.get(nonce);
                return [2 /*return*/, (existingNonce === null || existingNonce === void 0 ? void 0 : existingNonce.usedAt) !== null];
            });
        });
    };
    MemStorage.prototype.isNonceValid = function (nonce) {
        return __awaiter(this, void 0, void 0, function () {
            var existingNonce, now;
            return __generator(this, function (_a) {
                existingNonce = this.qrCodeNonces.get(nonce);
                if (!existingNonce) {
                    return [2 /*return*/, false];
                }
                // Check if already used
                if (existingNonce.usedAt) {
                    return [2 /*return*/, false];
                }
                now = new Date();
                if (existingNonce.expiresAt < now) {
                    return [2 /*return*/, false];
                }
                return [2 /*return*/, true];
            });
        });
    };
    MemStorage.prototype.cleanupExpiredNonces = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, cleanedCount, _i, _a, _b, nonceKey, nonceValue;
            return __generator(this, function (_c) {
                now = new Date();
                cleanedCount = 0;
                for (_i = 0, _a = Array.from(this.qrCodeNonces.entries()); _i < _a.length; _i++) {
                    _b = _a[_i], nonceKey = _b[0], nonceValue = _b[1];
                    if (nonceValue.expiresAt < now) {
                        this.qrCodeNonces.delete(nonceKey);
                        cleanedCount++;
                    }
                }
                return [2 /*return*/, cleanedCount];
            });
        });
    };
    // === ICAL FEED TOKENS - SECURE PERSONAL CALENDAR AUTHENTICATION ===
    MemStorage.prototype.getIcalFeedToken = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.icalFeedTokens.get(id)];
            });
        });
    };
    MemStorage.prototype.getIcalFeedTokenByToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.icalFeedTokens.values()).find(function (feedToken) { return feedToken.token === token && feedToken.isActive && !feedToken.revokedAt; })];
            });
        });
    };
    MemStorage.prototype.getIcalFeedTokensByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.icalFeedTokens.values()).filter(function (feedToken) { return feedToken.playerId === playerId; })];
            });
        });
    };
    MemStorage.prototype.createIcalFeedToken = function (insertToken) {
        return __awaiter(this, void 0, void 0, function () {
            var id, feedToken;
            var _a, _b;
            return __generator(this, function (_c) {
                id = (0, crypto_1.randomUUID)();
                feedToken = {
                    id: id,
                    playerId: insertToken.playerId,
                    token: insertToken.token,
                    name: nullifyUndefined(insertToken.name),
                    isActive: (_a = insertToken.isActive) !== null && _a !== void 0 ? _a : true,
                    lastUsedAt: null,
                    useCount: 0,
                    hallId: nullifyUndefined(insertToken.hallId),
                    includeCompleted: (_b = insertToken.includeCompleted) !== null && _b !== void 0 ? _b : false,
                    createdAt: new Date(),
                    expiresAt: insertToken.expiresAt ? new Date(insertToken.expiresAt) : null,
                    revokedAt: null,
                    revokedBy: nullifyUndefined(insertToken.revokedBy),
                    revokeReason: nullifyUndefined(insertToken.revokeReason),
                };
                this.icalFeedTokens.set(id, feedToken);
                return [2 /*return*/, feedToken];
            });
        });
    };
    MemStorage.prototype.updateIcalFeedToken = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, updateMapRecord(this.icalFeedTokens, id, updates, NULLABLE_FIELDS.IcalFeedToken)];
            });
        });
    };
    MemStorage.prototype.revokeIcalFeedToken = function (id, revokedBy, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var updates;
            return __generator(this, function (_a) {
                updates = {
                    isActive: false,
                    revokedAt: new Date(),
                    revokedBy: revokedBy,
                    revokeReason: reason || null,
                };
                return [2 /*return*/, this.updateIcalFeedToken(id, updates)];
            });
        });
    };
    MemStorage.prototype.markTokenUsed = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var feedToken, updates, updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getIcalFeedTokenByToken(token)];
                    case 1:
                        feedToken = _a.sent();
                        if (!feedToken) {
                            return [2 /*return*/, false];
                        }
                        updates = {
                            lastUsedAt: new Date(),
                            useCount: (feedToken.useCount || 0) + 1,
                        };
                        return [4 /*yield*/, this.updateIcalFeedToken(feedToken.id, updates)];
                    case 2:
                        updated = _a.sent();
                        return [2 /*return*/, !!updated];
                }
            });
        });
    };
    MemStorage.prototype.cleanupExpiredTokens = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, cleanedCount, _i, _a, _b, tokenId, tokenValue;
            return __generator(this, function (_c) {
                now = new Date();
                cleanedCount = 0;
                for (_i = 0, _a = Array.from(this.icalFeedTokens.entries()); _i < _a.length; _i++) {
                    _b = _a[_i], tokenId = _b[0], tokenValue = _b[1];
                    if (tokenValue.expiresAt && tokenValue.expiresAt < now) {
                        this.icalFeedTokens.delete(tokenId);
                        cleanedCount++;
                    }
                }
                return [2 /*return*/, cleanedCount];
            });
        });
    };
    // === PAYMENT METHODS ===
    MemStorage.prototype.getPaymentMethod = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.paymentMethods.get(id)];
            });
        });
    };
    MemStorage.prototype.getPaymentMethodsByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.paymentMethods.values()).filter(function (pm) { return pm.userId === userId; })];
            });
        });
    };
    MemStorage.prototype.getDefaultPaymentMethod = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.paymentMethods.values()).find(function (pm) { return pm.userId === userId && pm.isDefault; })];
            });
        });
    };
    MemStorage.prototype.createPaymentMethod = function (insertPaymentMethod) {
        return __awaiter(this, void 0, void 0, function () {
            var id, paymentMethod;
            var _a, _b;
            return __generator(this, function (_c) {
                id = (0, crypto_1.randomUUID)();
                paymentMethod = {
                    id: id,
                    userId: insertPaymentMethod.userId,
                    stripePaymentMethodId: insertPaymentMethod.stripePaymentMethodId,
                    stripeSetupIntentId: nullifyUndefined(insertPaymentMethod.stripeSetupIntentId),
                    type: insertPaymentMethod.type,
                    brand: nullifyUndefined(insertPaymentMethod.brand),
                    last4: nullifyUndefined(insertPaymentMethod.last4),
                    expiryMonth: nullifyUndefined(insertPaymentMethod.expiryMonth),
                    expiryYear: nullifyUndefined(insertPaymentMethod.expiryYear),
                    isDefault: (_a = insertPaymentMethod.isDefault) !== null && _a !== void 0 ? _a : false,
                    isActive: (_b = insertPaymentMethod.isActive) !== null && _b !== void 0 ? _b : true,
                    metadata: nullifyUndefined(insertPaymentMethod.metadata),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                this.paymentMethods.set(id, paymentMethod);
                return [2 /*return*/, paymentMethod];
            });
        });
    };
    MemStorage.prototype.updatePaymentMethod = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, updateMapRecord(this.paymentMethods, id, __assign(__assign({}, updates), { updatedAt: new Date() }), NULLABLE_FIELDS.PaymentMethod)];
            });
        });
    };
    MemStorage.prototype.setDefaultPaymentMethod = function (userId, paymentMethodId) {
        return __awaiter(this, void 0, void 0, function () {
            var userPaymentMethods, _i, userPaymentMethods_1, _a, id, pm, paymentMethod, updatedPaymentMethod;
            return __generator(this, function (_b) {
                userPaymentMethods = Array.from(this.paymentMethods.entries());
                for (_i = 0, userPaymentMethods_1 = userPaymentMethods; _i < userPaymentMethods_1.length; _i++) {
                    _a = userPaymentMethods_1[_i], id = _a[0], pm = _a[1];
                    if (pm.userId === userId) {
                        this.paymentMethods.set(id, __assign(__assign({}, pm), { isDefault: false, updatedAt: new Date() }));
                    }
                }
                paymentMethod = this.paymentMethods.get(paymentMethodId);
                if (paymentMethod && paymentMethod.userId === userId) {
                    updatedPaymentMethod = __assign(__assign({}, paymentMethod), { isDefault: true, updatedAt: new Date() });
                    this.paymentMethods.set(paymentMethodId, updatedPaymentMethod);
                    return [2 /*return*/, updatedPaymentMethod];
                }
                return [2 /*return*/, undefined];
            });
        });
    };
    MemStorage.prototype.deactivatePaymentMethod = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updatePaymentMethod(id, { isActive: false })];
            });
        });
    };
    // === STAKES HOLDS ===
    MemStorage.prototype.getStakesHold = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.stakesHolds.get(id)];
            });
        });
    };
    MemStorage.prototype.getStakesHoldsByChallenge = function (challengeId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.stakesHolds.values()).filter(function (hold) { return hold.challengeId === challengeId; })];
            });
        });
    };
    MemStorage.prototype.getStakesHoldsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.stakesHolds.values()).filter(function (hold) { return hold.playerId === playerId; })];
            });
        });
    };
    MemStorage.prototype.createStakesHold = function (insertStakesHold) {
        return __awaiter(this, void 0, void 0, function () {
            var id, stakesHold;
            var _a;
            return __generator(this, function (_b) {
                id = (0, crypto_1.randomUUID)();
                stakesHold = {
                    id: id,
                    challengeId: insertStakesHold.challengeId,
                    playerId: insertStakesHold.playerId,
                    amount: insertStakesHold.amount,
                    status: (_a = insertStakesHold.status) !== null && _a !== void 0 ? _a : "held",
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
                return [2 /*return*/, stakesHold];
            });
        });
    };
    MemStorage.prototype.updateStakesHold = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, updateMapRecord(this.stakesHolds, id, updates, NULLABLE_FIELDS.StakesHold)];
            });
        });
    };
    MemStorage.prototype.releaseStakesHold = function (id, reason) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateStakesHold(id, {
                        status: "released",
                        releasedAt: new Date(),
                        releaseReason: reason || null
                    })];
            });
        });
    };
    MemStorage.prototype.captureStakesHold = function (id, reason) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateStakesHold(id, {
                        status: "captured",
                        capturedAt: new Date(),
                        captureReason: reason || null
                    })];
            });
        });
    };
    MemStorage.prototype.getStakesHoldsByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.stakesHolds.values()).filter(function (hold) { return hold.status === status; })];
            });
        });
    };
    MemStorage.prototype.getExpiringStakesHolds = function () {
        return __awaiter(this, arguments, void 0, function (hours) {
            var expiryThreshold;
            if (hours === void 0) { hours = 24; }
            return __generator(this, function (_a) {
                expiryThreshold = new Date(Date.now() + hours * 60 * 60 * 1000);
                return [2 /*return*/, Array.from(this.stakesHolds.values()).filter(function (hold) {
                        // Check if hold will expire within the specified hours
                        var createdTime = new Date(hold.createdAt);
                        var expiryTime = new Date(createdTime.getTime() + (24 * 60 * 60 * 1000)); // 24 hour default expiry
                        return expiryTime <= expiryThreshold && hold.status === 'held';
                    })];
            });
        });
    };
    // === NOTIFICATION SYSTEM ===
    MemStorage.prototype.getNotificationSettings = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.notificationSettings.get(userId)];
            });
        });
    };
    MemStorage.prototype.createNotificationSettings = function (insertSettings) {
        return __awaiter(this, void 0, void 0, function () {
            var id, settings;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            return __generator(this, function (_o) {
                id = (0, crypto_1.randomUUID)();
                settings = {
                    id: id,
                    userId: insertSettings.userId,
                    emailEnabled: (_a = insertSettings.emailEnabled) !== null && _a !== void 0 ? _a : true,
                    smsEnabled: (_b = insertSettings.smsEnabled) !== null && _b !== void 0 ? _b : false,
                    pushEnabled: (_c = insertSettings.pushEnabled) !== null && _c !== void 0 ? _c : true,
                    emailAddress: nullifyUndefined(insertSettings.emailAddress),
                    phoneNumber: nullifyUndefined(insertSettings.phoneNumber),
                    emailVerified: (_d = insertSettings.emailVerified) !== null && _d !== void 0 ? _d : false,
                    phoneVerified: (_e = insertSettings.phoneVerified) !== null && _e !== void 0 ? _e : false,
                    reminderT24h: (_f = insertSettings.reminderT24h) !== null && _f !== void 0 ? _f : true,
                    reminderT1h: (_g = insertSettings.reminderT1h) !== null && _g !== void 0 ? _g : true,
                    newChallenges: (_h = insertSettings.newChallenges) !== null && _h !== void 0 ? _h : true,
                    resultUpdates: (_j = insertSettings.resultUpdates) !== null && _j !== void 0 ? _j : true,
                    promotional: (_k = insertSettings.promotional) !== null && _k !== void 0 ? _k : false,
                    weeklyReports: (_l = insertSettings.weeklyReports) !== null && _l !== void 0 ? _l : true,
                    quietHours: (_m = insertSettings.quietHours) !== null && _m !== void 0 ? _m : false,
                    quietHoursStart: nullifyUndefined(insertSettings.quietHoursStart),
                    quietHoursEnd: nullifyUndefined(insertSettings.quietHoursEnd),
                    timezone: nullifyUndefined(insertSettings.timezone),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                this.notificationSettings.set(settings.userId, settings);
                return [2 /*return*/, settings];
            });
        });
    };
    MemStorage.prototype.updateNotificationSettings = function (userId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, updateMapRecord(this.notificationSettings, userId, __assign(__assign({}, updates), { updatedAt: new Date() }), NULLABLE_FIELDS.NotificationSettings)];
            });
        });
    };
    MemStorage.prototype.getNotificationDelivery = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.notificationDeliveries.get(id)];
            });
        });
    };
    MemStorage.prototype.createNotificationDelivery = function (insertDelivery) {
        return __awaiter(this, void 0, void 0, function () {
            var id, delivery;
            var _a;
            return __generator(this, function (_b) {
                id = (0, crypto_1.randomUUID)();
                delivery = {
                    id: id,
                    userId: insertDelivery.userId,
                    challengeId: nullifyUndefined(insertDelivery.challengeId),
                    type: insertDelivery.type,
                    channel: insertDelivery.channel,
                    recipient: insertDelivery.recipient,
                    subject: insertDelivery.subject,
                    content: insertDelivery.content,
                    status: (_a = insertDelivery.status) !== null && _a !== void 0 ? _a : "pending",
                    providerId: nullifyUndefined(insertDelivery.providerId),
                    errorMessage: nullifyUndefined(insertDelivery.errorMessage),
                    sentAt: nullifyUndefined(insertDelivery.sentAt),
                    deliveredAt: nullifyUndefined(insertDelivery.deliveredAt),
                    metadata: nullifyUndefined(insertDelivery.metadata),
                    createdAt: new Date(),
                };
                this.notificationDeliveries.set(id, delivery);
                return [2 /*return*/, delivery];
            });
        });
    };
    MemStorage.prototype.updateNotificationDelivery = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, updateMapRecord(this.notificationDeliveries, id, updates, NULLABLE_FIELDS.NotificationDelivery)];
            });
        });
    };
    MemStorage.prototype.getNotificationDeliveriesByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.notificationDeliveries.values()).filter(function (delivery) { return delivery.userId === userId; })];
            });
        });
    };
    MemStorage.prototype.getNotificationDeliveriesByChallenge = function (challengeId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.notificationDeliveries.values()).filter(function (delivery) { return delivery.challengeId === challengeId; })];
            });
        });
    };
    MemStorage.prototype.getNotificationDeliveriesByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.notificationDeliveries.values()).filter(function (delivery) { return delivery.status === status; })];
            });
        });
    };
    MemStorage.prototype.markNotificationDelivered = function (id, providerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateNotificationDelivery(id, {
                        status: "delivered",
                        deliveredAt: new Date(),
                        providerId: providerId || null
                    })];
            });
        });
    };
    MemStorage.prototype.markNotificationFailed = function (id, errorMessage) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateNotificationDelivery(id, {
                        status: "failed",
                        errorMessage: errorMessage
                    })];
            });
        });
    };
    // === DISPUTE MANAGEMENT ===
    MemStorage.prototype.getDisputeResolution = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.disputeResolutions.get(id)];
            });
        });
    };
    MemStorage.prototype.createDisputeResolution = function (insertDispute) {
        return __awaiter(this, void 0, void 0, function () {
            var id, dispute;
            var _a;
            return __generator(this, function (_b) {
                id = (0, crypto_1.randomUUID)();
                dispute = {
                    id: id,
                    challengeId: insertDispute.challengeId,
                    challengeFeeId: nullifyUndefined(insertDispute.challengeFeeId),
                    filedBy: insertDispute.filedBy,
                    filedAgainst: nullifyUndefined(insertDispute.filedAgainst),
                    disputeType: insertDispute.disputeType,
                    evidenceNotes: nullifyUndefined(insertDispute.evidenceNotes),
                    status: (_a = insertDispute.status) !== null && _a !== void 0 ? _a : "open",
                    resolution: nullifyUndefined(insertDispute.resolution),
                    resolvedBy: nullifyUndefined(insertDispute.resolvedBy),
                    resolutionAction: nullifyUndefined(insertDispute.resolutionAction),
                    operatorNotes: nullifyUndefined(insertDispute.operatorNotes),
                    resolvedAt: nullifyUndefined(insertDispute.resolvedAt),
                    auditLog: nullifyUndefined(insertDispute.auditLog),
                    createdAt: new Date(),
                };
                this.disputeResolutions.set(id, dispute);
                return [2 /*return*/, dispute];
            });
        });
    };
    MemStorage.prototype.updateDisputeResolution = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, updateMapRecord(this.disputeResolutions, id, updates, NULLABLE_FIELDS.DisputeResolution)];
            });
        });
    };
    MemStorage.prototype.resolveDispute = function (id, resolution, resolvedBy, action) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateDisputeResolution(id, {
                        status: "resolved",
                        resolution: resolution,
                        resolvedBy: resolvedBy,
                        resolutionAction: action || null,
                        resolvedAt: new Date()
                    })];
            });
        });
    };
    MemStorage.prototype.getDisputesByChallenge = function (challengeId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.disputeResolutions.values()).filter(function (dispute) { return dispute.challengeId === challengeId; })];
            });
        });
    };
    MemStorage.prototype.getDisputesByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.disputeResolutions.values()).filter(function (dispute) {
                        return dispute.filedBy === playerId || dispute.filedAgainst === playerId;
                    })];
            });
        });
    };
    MemStorage.prototype.getDisputeResolutionsByChallenge = function (challengeId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.disputeResolutions.values()).filter(function (dispute) { return dispute.challengeId === challengeId; })];
            });
        });
    };
    MemStorage.prototype.getDisputeResolutionsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.disputeResolutions.values()).filter(function (dispute) {
                        return dispute.filedBy === playerId || dispute.filedAgainst === playerId;
                    })];
            });
        });
    };
    MemStorage.prototype.getDisputeResolutionsByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.disputeResolutions.values()).filter(function (dispute) { return dispute.status === status; })];
            });
        });
    };
    MemStorage.prototype.addDisputeEvidence = function (id, evidenceUrls, evidenceTypes, notes) {
        return __awaiter(this, void 0, void 0, function () {
            var dispute, evidenceEntry, currentAuditLog;
            return __generator(this, function (_a) {
                dispute = this.disputeResolutions.get(id);
                if (!dispute)
                    return [2 /*return*/, undefined];
                evidenceEntry = {
                    urls: evidenceUrls,
                    types: evidenceTypes,
                    notes: notes || '',
                    addedAt: new Date().toISOString()
                };
                currentAuditLog = dispute.auditLog ? JSON.parse(dispute.auditLog) : [];
                currentAuditLog.push({
                    action: 'evidence_added',
                    timestamp: new Date().toISOString(),
                    evidence: evidenceEntry
                });
                return [2 /*return*/, this.updateDisputeResolution(id, {
                        auditLog: JSON.stringify(currentAuditLog)
                    })];
            });
        });
    };
    // === ANTI-ABUSE SYSTEM ===
    MemStorage.prototype.getPlayerCooldown = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.playerCooldowns.get(id)];
            });
        });
    };
    MemStorage.prototype.createPlayerCooldown = function (insertCooldown) {
        return __awaiter(this, void 0, void 0, function () {
            var id, cooldown;
            var _a;
            return __generator(this, function (_b) {
                id = (0, crypto_1.randomUUID)();
                cooldown = {
                    id: id,
                    playerId: insertCooldown.playerId,
                    cooldownType: insertCooldown.cooldownType,
                    reason: insertCooldown.reason,
                    durationMinutes: insertCooldown.durationMinutes,
                    appliedBy: insertCooldown.appliedBy,
                    endsAt: new Date(insertCooldown.endsAt),
                    liftedAt: nullifyUndefined(insertCooldown.liftedAt),
                    liftedBy: nullifyUndefined(insertCooldown.liftedBy),
                    liftReason: nullifyUndefined(insertCooldown.liftReason),
                    isActive: (_a = insertCooldown.isActive) !== null && _a !== void 0 ? _a : true,
                    metadata: nullifyUndefined(insertCooldown.metadata),
                    createdAt: new Date(),
                };
                this.playerCooldowns.set(id, cooldown);
                return [2 /*return*/, cooldown];
            });
        });
    };
    MemStorage.prototype.updatePlayerCooldown = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, updateMapRecord(this.playerCooldowns, id, updates, NULLABLE_FIELDS.PlayerCooldown)];
            });
        });
    };
    MemStorage.prototype.checkPlayerEligibility = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            var now, activeCooldowns, cooldown;
            return __generator(this, function (_a) {
                now = new Date();
                activeCooldowns = Array.from(this.playerCooldowns.values()).filter(function (cooldown) {
                    return cooldown.playerId === playerId &&
                        cooldown.isActive &&
                        cooldown.endsAt > now &&
                        !cooldown.liftedAt;
                });
                if (activeCooldowns.length > 0) {
                    cooldown = activeCooldowns[0];
                    return [2 /*return*/, {
                            eligible: false,
                            reason: cooldown.reason,
                            cooldownId: cooldown.id
                        }];
                }
                return [2 /*return*/, { eligible: true }];
            });
        });
    };
    MemStorage.prototype.getPlayerCooldownsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.playerCooldowns.values()).filter(function (cooldown) { return cooldown.playerId === playerId; })];
            });
        });
    };
    MemStorage.prototype.getActiveCooldowns = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now;
            return __generator(this, function (_a) {
                now = new Date();
                return [2 /*return*/, Array.from(this.playerCooldowns.values()).filter(function (cooldown) {
                        return cooldown.isActive &&
                            cooldown.endsAt > now &&
                            !cooldown.liftedAt;
                    })];
            });
        });
    };
    MemStorage.prototype.getExpiringCooldowns = function () {
        return __awaiter(this, arguments, void 0, function (hours) {
            var now, expiryThreshold;
            if (hours === void 0) { hours = 24; }
            return __generator(this, function (_a) {
                now = new Date();
                expiryThreshold = new Date(now.getTime() + hours * 60 * 60 * 1000);
                return [2 /*return*/, Array.from(this.playerCooldowns.values()).filter(function (cooldown) {
                        return cooldown.isActive &&
                            cooldown.endsAt <= expiryThreshold &&
                            cooldown.endsAt > now &&
                            !cooldown.liftedAt;
                    })];
            });
        });
    };
    MemStorage.prototype.liftPlayerCooldown = function (id, liftedBy, reason) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updatePlayerCooldown(id, {
                        isActive: false,
                        liftedAt: new Date(),
                        liftedBy: liftedBy,
                        liftReason: reason
                    })];
            });
        });
    };
    MemStorage.prototype.getDeviceAttestation = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.deviceAttestations.get(id)];
            });
        });
    };
    MemStorage.prototype.createDeviceAttestation = function (insertAttestation) {
        return __awaiter(this, void 0, void 0, function () {
            var id, attestation;
            var _a;
            return __generator(this, function (_b) {
                id = (0, crypto_1.randomUUID)();
                attestation = {
                    id: id,
                    challengeId: insertAttestation.challengeId,
                    playerId: insertAttestation.playerId,
                    deviceFingerprint: insertAttestation.deviceFingerprint,
                    attestationType: insertAttestation.attestationType,
                    geolocation: nullifyUndefined(insertAttestation.geolocation),
                    distanceFromHall: nullifyUndefined(insertAttestation.distanceFromHall),
                    ipAddress: nullifyUndefined(insertAttestation.ipAddress),
                    userAgent: nullifyUndefined(insertAttestation.userAgent),
                    scannerStaffId: nullifyUndefined(insertAttestation.scannerStaffId),
                    verificationStatus: (_a = insertAttestation.verificationStatus) !== null && _a !== void 0 ? _a : "pending",
                    createdAt: new Date(),
                };
                this.deviceAttestations.set(id, attestation);
                return [2 /*return*/, attestation];
            });
        });
    };
    MemStorage.prototype.getDeviceAttestationsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.deviceAttestations.values()).filter(function (attestation) { return attestation.playerId === playerId; })];
            });
        });
    };
    MemStorage.prototype.getDeviceAttestationsByChallenge = function (challengeId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.deviceAttestations.values()).filter(function (attestation) { return attestation.challengeId === challengeId; })];
            });
        });
    };
    MemStorage.prototype.getHighRiskAttestations = function () {
        return __awaiter(this, arguments, void 0, function (threshold) {
            if (threshold === void 0) { threshold = 0.8; }
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.deviceAttestations.values()).filter(function (attestation) { return (attestation.riskScore || 0) >= threshold; })];
            });
        });
    };
    // === JOB QUEUE & SYSTEM METRICS ===
    MemStorage.prototype.getJob = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.jobQueue.get(id)];
            });
        });
    };
    MemStorage.prototype.createJob = function (insertJob) {
        return __awaiter(this, void 0, void 0, function () {
            var id, job;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                id = (0, crypto_1.randomUUID)();
                job = {
                    id: id,
                    jobType: insertJob.jobType,
                    status: (_a = insertJob.status) !== null && _a !== void 0 ? _a : "pending",
                    priority: (_b = insertJob.priority) !== null && _b !== void 0 ? _b : 5,
                    payload: insertJob.payload,
                    maxAttempts: (_c = insertJob.maxAttempts) !== null && _c !== void 0 ? _c : 3,
                    attempts: (_d = insertJob.attempts) !== null && _d !== void 0 ? _d : 0,
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
                return [2 /*return*/, job];
            });
        });
    };
    MemStorage.prototype.updateJob = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, updateMapRecord(this.jobQueue, id, updates, NULLABLE_FIELDS.JobQueue)];
            });
        });
    };
    MemStorage.prototype.markJobCompleted = function (id, result) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateJob(id, {
                        status: "completed",
                        completedAt: new Date(),
                        result: result || null
                    })];
            });
        });
    };
    MemStorage.prototype.getJobsByType = function (jobType) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.jobQueue.values()).filter(function (job) { return job.jobType === jobType; })];
            });
        });
    };
    MemStorage.prototype.getJobsByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.jobQueue.values()).filter(function (job) { return job.status === status; })];
            });
        });
    };
    MemStorage.prototype.getPendingJobs = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.jobQueue.values())
                        .filter(function (job) { return job.status === "pending"; })
                        .sort(function (a, b) {
                        // Sort by priority (lower number = higher priority), then by scheduled time
                        if (a.priority !== b.priority) {
                            return a.priority - b.priority;
                        }
                        return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
                    })
                        .slice(0, limit)];
            });
        });
    };
    MemStorage.prototype.getFailedJobs = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.jobQueue.values())
                        .filter(function (job) { return job.status === "failed"; })
                        .sort(function (a, b) { return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); })
                        .slice(0, limit)];
            });
        });
    };
    MemStorage.prototype.markJobStarted = function (id, processedBy) {
        return __awaiter(this, void 0, void 0, function () {
            var job;
            return __generator(this, function (_a) {
                job = this.jobQueue.get(id);
                if (!job)
                    return [2 /*return*/, undefined];
                return [2 /*return*/, this.updateJob(id, {
                        status: "running",
                        startedAt: new Date(),
                        processedBy: processedBy,
                        attempts: (job.attempts || 0) + 1
                    })];
            });
        });
    };
    MemStorage.prototype.markJobFailed = function (id, errorMessage) {
        return __awaiter(this, void 0, void 0, function () {
            var job, currentAttempts, shouldRetry;
            return __generator(this, function (_a) {
                job = this.jobQueue.get(id);
                if (!job)
                    return [2 /*return*/, undefined];
                currentAttempts = (job.attempts || 0);
                shouldRetry = currentAttempts < (job.maxAttempts || 3);
                return [2 /*return*/, this.updateJob(id, {
                        status: shouldRetry ? "pending" : "failed",
                        errorMessage: errorMessage,
                        completedAt: shouldRetry ? null : new Date()
                    })];
            });
        });
    };
    MemStorage.prototype.requeueJob = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateJob(id, {
                        status: "pending",
                        startedAt: null,
                        completedAt: null,
                        errorMessage: null,
                        result: null,
                        processedBy: null
                    })];
            });
        });
    };
    MemStorage.prototype.cleanupCompletedJobs = function () {
        return __awaiter(this, arguments, void 0, function (olderThanDays) {
            var cutoffDate, deletedCount, _i, _a, _b, jobId, job;
            if (olderThanDays === void 0) { olderThanDays = 7; }
            return __generator(this, function (_c) {
                cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
                deletedCount = 0;
                for (_i = 0, _a = Array.from(this.jobQueue.entries()); _i < _a.length; _i++) {
                    _b = _a[_i], jobId = _b[0], job = _b[1];
                    if ((job.status === "completed" || job.status === "failed") &&
                        job.completedAt &&
                        new Date(job.completedAt) < cutoffDate) {
                        this.jobQueue.delete(jobId);
                        deletedCount++;
                    }
                }
                return [2 /*return*/, deletedCount];
            });
        });
    };
    MemStorage.prototype.getSystemMetric = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.systemMetrics.get(id)];
            });
        });
    };
    MemStorage.prototype.createSystemMetric = function (insertMetric) {
        return __awaiter(this, void 0, void 0, function () {
            var id, metric;
            var _a;
            return __generator(this, function (_b) {
                id = (0, crypto_1.randomUUID)();
                metric = {
                    id: id,
                    value: insertMetric.value,
                    metricType: insertMetric.metricType,
                    timeWindow: insertMetric.timeWindow,
                    windowStart: new Date(insertMetric.windowStart),
                    windowEnd: new Date(insertMetric.windowEnd),
                    hallId: nullifyUndefined(insertMetric.hallId),
                    metadata: nullifyUndefined(insertMetric.metadata),
                    count: (_a = insertMetric.count) !== null && _a !== void 0 ? _a : null,
                    createdAt: new Date(),
                };
                this.systemMetrics.set(id, metric);
                return [2 /*return*/, metric];
            });
        });
    };
    MemStorage.prototype.getSystemMetricsByType = function (metricType, hallId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.systemMetrics.values()).filter(function (metric) {
                        if (metric.metricType !== metricType)
                            return false;
                        if (hallId && metric.hallId !== hallId)
                            return false;
                        return true;
                    })];
            });
        });
    };
    MemStorage.prototype.getSystemMetricsByTimeWindow = function (windowStart, windowEnd, metricType) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.systemMetrics.values()).filter(function (metric) {
                        var metricWindowStart = new Date(metric.windowStart);
                        if (metricWindowStart < windowStart || metricWindowStart > windowEnd)
                            return false;
                        if (metricType && metric.metricType !== metricType)
                            return false;
                        return true;
                    })];
            });
        });
    };
    MemStorage.prototype.aggregateMetrics = function (metricType, timeWindow, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var metrics;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getSystemMetricsByTimeWindow(startDate, endDate, metricType)];
                    case 1:
                        metrics = _a.sent();
                        // For now, just return the filtered metrics. In a real implementation,
                        // this would aggregate values by time windows (hourly, daily, etc.)
                        return [2 /*return*/, metrics];
                }
            });
        });
    };
    MemStorage.prototype.getSystemAlert = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.systemAlerts.get(id)];
            });
        });
    };
    MemStorage.prototype.createSystemAlert = function (insertAlert) {
        return __awaiter(this, void 0, void 0, function () {
            var id, alert;
            var _a, _b;
            return __generator(this, function (_c) {
                id = (0, crypto_1.randomUUID)();
                alert = {
                    id: id,
                    message: insertAlert.message,
                    alertType: insertAlert.alertType,
                    condition: insertAlert.condition,
                    threshold: insertAlert.threshold,
                    severity: nullifyUndefined(insertAlert.severity),
                    currentValue: nullifyUndefined(insertAlert.currentValue),
                    isActive: (_a = insertAlert.isActive) !== null && _a !== void 0 ? _a : true,
                    isFiring: (_b = insertAlert.isFiring) !== null && _b !== void 0 ? _b : false,
                    lastTriggered: insertAlert.lastTriggered ? new Date(insertAlert.lastTriggered) : null,
                    metadata: nullifyUndefined(insertAlert.metadata),
                    createdAt: new Date(),
                };
                this.systemAlerts.set(id, alert);
                return [2 /*return*/, alert];
            });
        });
    };
    MemStorage.prototype.updateSystemAlert = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, updateMapRecord(this.systemAlerts, id, updates, NULLABLE_FIELDS.SystemAlert)];
            });
        });
    };
    MemStorage.prototype.acknowledgeAlert = function (id, acknowledgedBy) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateSystemAlert(id, {
                        isAcknowledged: true,
                        acknowledgedBy: acknowledgedBy,
                        acknowledgedAt: new Date()
                    })];
            });
        });
    };
    MemStorage.prototype.getSystemAlertsByType = function (alertType) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.systemAlerts.values()).filter(function (alert) { return alert.alertName === alertType; })];
            });
        });
    };
    MemStorage.prototype.getActiveAlerts = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.systemAlerts.values()).filter(function (alert) { return alert.isAcknowledged === false; })];
            });
        });
    };
    MemStorage.prototype.getFiringAlerts = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.systemAlerts.values()).filter(function (alert) { return alert.severity === "critical"; })];
            });
        });
    };
    MemStorage.prototype.triggerAlert = function (alertId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateSystemAlert(alertId, {
                        lastTriggered: new Date()
                    })];
            });
        });
    };
    MemStorage.prototype.resolveAlert = function (alertId, resolvedBy) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateSystemAlert(alertId, {
                        isAcknowledged: true,
                        acknowledgedBy: resolvedBy,
                        acknowledgedAt: new Date()
                    })];
            });
        });
    };
    // === AI COACH TRAINING ANALYTICS ===
    // These methods are not implemented in MemStorage - use DatabaseStorage instead
    MemStorage.prototype.createTrainingSession = function (session) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
            });
        });
    };
    MemStorage.prototype.getTrainingSession = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
            });
        });
    };
    MemStorage.prototype.getPlayerSessions = function (playerId, limit) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
            });
        });
    };
    MemStorage.prototype.recordShots = function (sessionId, shots) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
            });
        });
    };
    MemStorage.prototype.getSessionShots = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
            });
        });
    };
    MemStorage.prototype.calculateMonthlyScores = function (period) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
            });
        });
    };
    MemStorage.prototype.getHallLeaderboard = function (hallId, period) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
            });
        });
    };
    MemStorage.prototype.getPlayerTrainingScore = function (playerId, period) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
            });
        });
    };
    MemStorage.prototype.createReward = function (reward) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
            });
        });
    };
    MemStorage.prototype.getRewardsForPeriod = function (period) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
            });
        });
    };
    MemStorage.prototype.markRewardApplied = function (rewardId, stripeCouponId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error("Training analytics requires database storage. Please use DatabaseStorage implementation.");
            });
        });
    };
    // === BAN APPEALS ===
    MemStorage.prototype.getBanAppeal = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.banAppeals.get(id)];
            });
        });
    };
    MemStorage.prototype.getBanAppealsByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.banAppeals.values()).filter(function (a) { return a.userId === userId; })];
            });
        });
    };
    MemStorage.prototype.getBanAppealsByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.banAppeals.values()).filter(function (a) { return a.status === status; })];
            });
        });
    };
    MemStorage.prototype.getAllBanAppeals = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.banAppeals.values()).sort(function (a, b) {
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    })];
            });
        });
    };
    MemStorage.prototype.createBanAppeal = function (appeal) {
        return __awaiter(this, void 0, void 0, function () {
            var id, record;
            return __generator(this, function (_a) {
                id = (0, crypto_1.randomUUID)();
                record = {
                    id: id,
                    userId: appeal.userId,
                    userEmail: appeal.userEmail,
                    userName: appeal.userName || null,
                    reason: appeal.reason,
                    supportingContext: appeal.supportingContext || null,
                    status: appeal.status || "pending",
                    adminResponse: appeal.adminResponse || null,
                    reviewedBy: appeal.reviewedBy || null,
                    reviewedAt: null,
                    createdAt: new Date(),
                };
                this.banAppeals.set(id, record);
                return [2 /*return*/, record];
            });
        });
    };
    MemStorage.prototype.updateBanAppeal = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var cur, updated;
            return __generator(this, function (_a) {
                cur = this.banAppeals.get(id);
                if (!cur)
                    return [2 /*return*/, undefined];
                updated = __assign(__assign({}, cur), updates);
                this.banAppeals.set(id, updated);
                return [2 /*return*/, updated];
            });
        });
    };
    return MemStorage;
}());
exports.MemStorage = MemStorage;
// Database storage implementation using Drizzle ORM
var DatabaseStorage = /** @class */ (function () {
    function DatabaseStorage() {
        // For other methods, use MemStorage temporarily to maintain functionality
        this.memStorage = new MemStorage();
    }
    // Core player operations using real database
    DatabaseStorage.prototype.getPlayers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.players)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPlayer = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.players).where((0, drizzle_orm_1.eq)(schema_1.players.id, id))];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.createPlayer = function (player) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.players).values(player).returning()];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.updatePlayer = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.update(schema_1.players).set(updates).where((0, drizzle_orm_1.eq)(schema_1.players.id, id)).returning()];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.deletePlayer = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.players).where((0, drizzle_orm_1.eq)(schema_1.players.id, id))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rowCount > 0];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPlayerByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.players).where((0, drizzle_orm_1.eq)(schema_1.players.userId, userId))];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAllPlayers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getPlayers()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // User management operations using real database  
    DatabaseStorage.prototype.getUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id))];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserByEmail = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email))];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.getUserByVerificationToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.verificationToken, token))];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.createUser = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var safeUser, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        safeUser = this.sanitizeUserFields(user);
                        return [4 /*yield*/, db_1.db.insert(schema_1.users).values(safeUser).returning()];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateUser = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var safeUpdates, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        safeUpdates = this.sanitizeUserFields(updates);
                        return [4 /*yield*/, db_1.db.update(schema_1.users).set(safeUpdates).where((0, drizzle_orm_1.eq)(schema_1.users.id, id)).returning()];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.upsertUser = function (userData) {
        return __awaiter(this, void 0, void 0, function () {
            var existingUser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!userData.email) {
                            throw new Error("Email is required to create or update a user");
                        }
                        return [4 /*yield*/, this.getUserByEmail(userData.email)];
                    case 1:
                        existingUser = _a.sent();
                        if (!existingUser) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.updateUser(existingUser.id, userData)];
                    case 2: return [2 /*return*/, (_a.sent()) || existingUser];
                    case 3: return [4 /*yield*/, this.createUser(__assign({ email: userData.email, name: userData.name, globalRole: userData.globalRole || "PLAYER" }, userData))];
                    case 4: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.sanitizeUserFields = function (data) {
        var validColumns = [
            "id", "email", "name", "passwordHash", "twoFactorEnabled", "twoFactorSecret",
            "phoneNumber", "lastLoginAt", "loginAttempts", "lockedUntil", "globalRole",
            "role", "profileComplete", "onboardingComplete", "accountStatus",
            "stripeCustomerId", "stripeConnectId", "payoutShareBps", "hallName",
            "city", "state", "subscriptionTier", "trusteeId", "createdAt", "updatedAt",
            "emailVerified", "verificationToken", "verificationTokenExpiry",
            "banReason", "bannedAt", "bannedBy", "banExpiresAt"
        ];
        var sanitized = {};
        for (var _i = 0, validColumns_1 = validColumns; _i < validColumns_1.length; _i++) {
            var key = validColumns_1[_i];
            if (key in data && data[key] !== undefined) {
                sanitized[key] = data[key];
            }
        }
        return sanitized;
    };
    DatabaseStorage.prototype.getUserByStripeConnectId = function (stripeConnectId) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.stripeConnectId, stripeConnectId))];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAllUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.users)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getStaffUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.globalRole, "STAFF"))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteUser = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rowCount > 0];
                }
            });
        });
    };
    // Challenge date range query for conflict checking
    DatabaseStorage.prototype.getChallengesByDateRange = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // For now, return empty array since we haven't implemented challenges in database yet
                return [2 /*return*/, []];
            });
        });
    };
    // Challenge fee status query
    DatabaseStorage.prototype.getChallengeFeesByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // For now, return empty array since we haven't implemented challenge fees in database yet
                return [2 /*return*/, []];
            });
        });
    };
    // Forward all other methods to MemStorage for now
    DatabaseStorage.prototype.getMatches = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getMatches()];
        }); });
    };
    DatabaseStorage.prototype.getMatch = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getMatch(id)];
        }); });
    };
    DatabaseStorage.prototype.createMatch = function (match) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createMatch(match)];
        }); });
    };
    DatabaseStorage.prototype.updateMatch = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateMatch(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteMatch = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteMatch(id)];
        }); });
    };
    DatabaseStorage.prototype.getTournaments = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTournaments()];
        }); });
    };
    DatabaseStorage.prototype.getTournament = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTournament(id)];
        }); });
    };
    DatabaseStorage.prototype.createTournament = function (tournament) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createTournament(tournament)];
        }); });
    };
    DatabaseStorage.prototype.updateTournament = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateTournament(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteTournament = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteTournament(id)];
        }); });
    };
    // Tournament Calcuttas delegation methods  
    DatabaseStorage.prototype.getTournamentCalcutta = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTournamentCalcutta(id)];
        }); });
    };
    DatabaseStorage.prototype.getTournamentCalcuttas = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTournamentCalcuttas()];
        }); });
    };
    DatabaseStorage.prototype.getTournamentCalcuttasByTournament = function (tournamentId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTournamentCalcuttasByTournament(tournamentId)];
        }); });
    };
    DatabaseStorage.prototype.createTournamentCalcutta = function (calcutta) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createTournamentCalcutta(calcutta)];
        }); });
    };
    DatabaseStorage.prototype.updateTournamentCalcutta = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateTournamentCalcutta(id, updates)];
        }); });
    };
    // Calcutta Bids delegation methods
    DatabaseStorage.prototype.getCalcuttaBid = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getCalcuttaBid(id)];
        }); });
    };
    DatabaseStorage.prototype.getCalcuttaBids = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getCalcuttaBids()];
        }); });
    };
    DatabaseStorage.prototype.getCalcuttaBidsByCalcutta = function (calcuttaId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getCalcuttaBidsByCalcutta(calcuttaId)];
        }); });
    };
    DatabaseStorage.prototype.getCalcuttaBidsByBidder = function (bidderId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getCalcuttaBidsByBidder(bidderId)];
        }); });
    };
    DatabaseStorage.prototype.createCalcuttaBid = function (bid) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createCalcuttaBid(bid)];
        }); });
    };
    DatabaseStorage.prototype.updateCalcuttaBid = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateCalcuttaBid(id, updates)];
        }); });
    };
    // Season Predictions delegation methods
    DatabaseStorage.prototype.getSeasonPrediction = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getSeasonPrediction(id)];
        }); });
    };
    DatabaseStorage.prototype.getSeasonPredictions = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getSeasonPredictions()];
        }); });
    };
    DatabaseStorage.prototype.getSeasonPredictionsByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getSeasonPredictionsByStatus(status)];
        }); });
    };
    DatabaseStorage.prototype.createSeasonPrediction = function (prediction) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createSeasonPrediction(prediction)];
        }); });
    };
    DatabaseStorage.prototype.updateSeasonPrediction = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateSeasonPrediction(id, updates)];
        }); });
    };
    // Prediction Entries delegation methods
    DatabaseStorage.prototype.getPredictionEntry = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPredictionEntry(id)];
        }); });
    };
    DatabaseStorage.prototype.getPredictionEntries = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPredictionEntries()];
        }); });
    };
    DatabaseStorage.prototype.getPredictionEntriesByPrediction = function (predictionId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPredictionEntriesByPrediction(predictionId)];
        }); });
    };
    DatabaseStorage.prototype.getPredictionEntriesByPredictor = function (predictorId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPredictionEntriesByPredictor(predictorId)];
        }); });
    };
    DatabaseStorage.prototype.createPredictionEntry = function (entry) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createPredictionEntry(entry)];
        }); });
    };
    DatabaseStorage.prototype.updatePredictionEntry = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updatePredictionEntry(id, updates)];
        }); });
    };
    // Added Money Fund delegation methods
    DatabaseStorage.prototype.getAddedMoneyFund = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAddedMoneyFund(id)];
        }); });
    };
    DatabaseStorage.prototype.getAddedMoneyFunds = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAddedMoneyFunds()];
        }); });
    };
    DatabaseStorage.prototype.getAddedMoneyFundsBySource = function (sourceType) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAddedMoneyFundsBySource(sourceType)];
        }); });
    };
    DatabaseStorage.prototype.getAddedMoneyFundsByTournament = function (tournamentId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAddedMoneyFundsByTournament(tournamentId)];
        }); });
    };
    DatabaseStorage.prototype.createAddedMoneyFund = function (fund) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createAddedMoneyFund(fund)];
        }); });
    };
    DatabaseStorage.prototype.updateAddedMoneyFund = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateAddedMoneyFund(id, updates)];
        }); });
    };
    // Challenge pools - these are critical for the billing system
    DatabaseStorage.prototype.getChallengePools = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallengePools()];
        }); });
    };
    DatabaseStorage.prototype.getChallengePool = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallengePool(id)];
        }); });
    };
    DatabaseStorage.prototype.createChallengePool = function (pool) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createChallengePool(pool)];
        }); });
    };
    DatabaseStorage.prototype.updateChallengePool = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateChallengePool(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteChallengePool = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteChallengePool(id)];
        }); });
    };
    // Wallets - critical for financial operations
    DatabaseStorage.prototype.getWallets = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getWallets()];
        }); });
    };
    DatabaseStorage.prototype.getWallet = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getWallet(id)];
        }); });
    };
    DatabaseStorage.prototype.getWalletByPlayerId = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getWalletByPlayerId(playerId)];
        }); });
    };
    DatabaseStorage.prototype.createWallet = function (wallet) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createWallet(wallet)];
        }); });
    };
    DatabaseStorage.prototype.updateWallet = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteWallet(id)];
        }); });
    };
    DatabaseStorage.prototype.deleteWallet = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteWallet(id)];
        }); });
    };
    // Side Pots - critical for side betting system
    DatabaseStorage.prototype.getSidePot = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getSidePot(id)];
        }); });
    };
    DatabaseStorage.prototype.getSidePots = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getSidePots()];
        }); });
    };
    DatabaseStorage.prototype.getAllSidePots = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllSidePots()];
        }); });
    };
    DatabaseStorage.prototype.getSidePotsByMatch = function (matchId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getSidePotsByMatch(matchId)];
        }); });
    };
    DatabaseStorage.prototype.getSidePotsByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getSidePotsByStatus(status)];
        }); });
    };
    DatabaseStorage.prototype.createSidePot = function (pot) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createSidePot(pot)];
        }); });
    };
    DatabaseStorage.prototype.updateSidePot = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateSidePot(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.getExpiredDisputePots = function (now) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getExpiredDisputePots(now)];
        }); });
    };
    // Forward all remaining methods to preserve functionality
    DatabaseStorage.prototype.getKellyPools = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getKellyPools()];
        }); });
    };
    DatabaseStorage.prototype.getKellyPool = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getKellyPool(id)];
        }); });
    };
    DatabaseStorage.prototype.createKellyPool = function (kellyPool) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createKellyPool(kellyPool)];
        }); });
    };
    DatabaseStorage.prototype.updateKellyPool = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateKellyPool(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteKellyPool = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteKellyPool(id)];
        }); });
    };
    DatabaseStorage.prototype.getMoneyGames = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getMoneyGames()];
        }); });
    };
    DatabaseStorage.prototype.getMoneyGame = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getMoneyGame(id)];
        }); });
    };
    DatabaseStorage.prototype.getMoneyGamesByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getMoneyGamesByStatus(status)];
        }); });
    };
    DatabaseStorage.prototype.createMoneyGame = function (game) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createMoneyGame(game)];
        }); });
    };
    DatabaseStorage.prototype.updateMoneyGame = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateMoneyGame(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteMoneyGame = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteMoneyGame(id)];
        }); });
    };
    DatabaseStorage.prototype.getBounties = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getBounties()];
        }); });
    };
    DatabaseStorage.prototype.getBounty = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getBounty(id)];
        }); });
    };
    DatabaseStorage.prototype.createBounty = function (bounty) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createBounty(bounty)];
        }); });
    };
    DatabaseStorage.prototype.updateBounty = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateBounty(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteBounty = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteBounty(id)];
        }); });
    };
    DatabaseStorage.prototype.getCharityEvents = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getCharityEvents()];
        }); });
    };
    DatabaseStorage.prototype.getCharityEvent = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getCharityEvent(id)];
        }); });
    };
    DatabaseStorage.prototype.createCharityEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createCharityEvent(event)];
        }); });
    };
    DatabaseStorage.prototype.updateCharityEvent = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateCharityEvent(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteCharityEvent = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteCharityEvent(id)];
        }); });
    };
    DatabaseStorage.prototype.getSupportRequests = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getSupportRequests()];
        }); });
    };
    DatabaseStorage.prototype.getSupportRequest = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getSupportRequest(id)];
        }); });
    };
    DatabaseStorage.prototype.createSupportRequest = function (request) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createSupportRequest(request)];
        }); });
    };
    DatabaseStorage.prototype.updateSupportRequest = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateSupportRequest(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteSupportRequest = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteSupportRequest(id)];
        }); });
    };
    DatabaseStorage.prototype.getLiveStreams = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getLiveStreams()];
        }); });
    };
    DatabaseStorage.prototype.getLiveStream = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getLiveStream(id)];
        }); });
    };
    DatabaseStorage.prototype.createLiveStream = function (stream) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createLiveStream(stream)];
        }); });
    };
    DatabaseStorage.prototype.updateLiveStream = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateLiveStream(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteLiveStream = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteLiveStream(id)];
        }); });
    };
    DatabaseStorage.prototype.getWebhookEvents = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.webhookEvents)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getWebhookEvent = function (stripeEventId) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.webhookEvents).where((0, drizzle_orm_1.eq)(schema_1.webhookEvents.stripeEventId, stripeEventId))];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.createWebhookEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.webhookEvents).values(event).returning()];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateWebhookEvent = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.update(schema_1.webhookEvents).set(updates).where((0, drizzle_orm_1.eq)(schema_1.webhookEvents.id, id)).returning()];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteWebhookEvent = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.webhookEvents).where((0, drizzle_orm_1.eq)(schema_1.webhookEvents.id, id))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rowCount > 0];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPoolHalls = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPoolHalls()];
        }); });
    };
    DatabaseStorage.prototype.getAllPoolHalls = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllPoolHalls()];
        }); });
    };
    DatabaseStorage.prototype.getPoolHall = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPoolHall(id)];
        }); });
    };
    DatabaseStorage.prototype.createPoolHall = function (hall) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createPoolHall(hall)];
        }); });
    };
    DatabaseStorage.prototype.updatePoolHall = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updatePoolHall(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deletePoolHall = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deletePoolHall(id)];
        }); });
    };
    DatabaseStorage.prototype.getHallMatches = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getHallMatches()];
        }); });
    };
    DatabaseStorage.prototype.getHallMatch = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getHallMatch(id)];
        }); });
    };
    DatabaseStorage.prototype.createHallMatch = function (match) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createHallMatch(match)];
        }); });
    };
    DatabaseStorage.prototype.updateHallMatch = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateHallMatch(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteHallMatch = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteHallMatch(id)];
        }); });
    };
    DatabaseStorage.prototype.getHallRosters = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getHallRosters()];
        }); });
    };
    DatabaseStorage.prototype.getHallRoster = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getHallRoster(id)];
        }); });
    };
    DatabaseStorage.prototype.createHallRoster = function (roster) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createHallRoster(roster)];
        }); });
    };
    DatabaseStorage.prototype.updateHallRoster = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateHallRoster(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteHallRoster = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteHallRoster(id)];
        }); });
    };
    DatabaseStorage.prototype.getOperatorSettings = function (operatorUserId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getOperatorSettings(operatorUserId)];
        }); });
    };
    DatabaseStorage.prototype.getAllOperatorSettings = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllOperatorSettings()];
        }); });
    };
    DatabaseStorage.prototype.getOperatorSetting = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getOperatorSetting(id)];
        }); });
    };
    DatabaseStorage.prototype.createOperatorSettings = function (settings) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createOperatorSettings(settings)];
        }); });
    };
    DatabaseStorage.prototype.updateOperatorSettings = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateOperatorSettings(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteOperatorSettings = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteOperatorSettings(id)];
        }); });
    };
    DatabaseStorage.prototype.getRookieMatches = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getRookieMatches()];
        }); });
    };
    DatabaseStorage.prototype.getRookieMatch = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getRookieMatch(id)];
        }); });
    };
    DatabaseStorage.prototype.createRookieMatch = function (match) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createRookieMatch(match)];
        }); });
    };
    DatabaseStorage.prototype.updateRookieMatch = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateRookieMatch(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteRookieMatch = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteRookieMatch(id)];
        }); });
    };
    DatabaseStorage.prototype.getRookieEvents = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getRookieEvents()];
        }); });
    };
    DatabaseStorage.prototype.getRookieEvent = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getRookieEvent(id)];
        }); });
    };
    DatabaseStorage.prototype.createRookieEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createRookieEvent(event)];
        }); });
    };
    DatabaseStorage.prototype.updateRookieEvent = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateRookieEvent(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteRookieEvent = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteRookieEvent(id)];
        }); });
    };
    DatabaseStorage.prototype.getRookieAchievements = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getRookieAchievements()];
        }); });
    };
    DatabaseStorage.prototype.getRookieAchievement = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getRookieAchievement(id)];
        }); });
    };
    DatabaseStorage.prototype.createRookieAchievement = function (achievement) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createRookieAchievement(achievement)];
        }); });
    };
    DatabaseStorage.prototype.updateRookieAchievement = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateRookieAchievement(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteRookieAchievement = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteRookieAchievement(id)];
        }); });
    };
    DatabaseStorage.prototype.getRookieSubscriptions = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getRookieSubscriptions()];
        }); });
    };
    DatabaseStorage.prototype.getRookieSubscription = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getRookieSubscription(id)];
        }); });
    };
    DatabaseStorage.prototype.createRookieSubscription = function (subscription) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createRookieSubscription(subscription)];
        }); });
    };
    DatabaseStorage.prototype.updateRookieSubscription = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateRookieSubscription(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteRookieSubscription = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteRookieSubscription(id)];
        }); });
    };
    DatabaseStorage.prototype.getOperatorSubscriptions = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getOperatorSubscriptions()];
        }); });
    };
    DatabaseStorage.prototype.getOperatorSubscription = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getOperatorSubscription(id)];
        }); });
    };
    DatabaseStorage.prototype.createOperatorSubscription = function (subscription) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createOperatorSubscription(subscription)];
        }); });
    };
    DatabaseStorage.prototype.updateOperatorSubscription = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateOperatorSubscription(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteOperatorSubscription = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteOperatorSubscription(id)];
        }); });
    };
    DatabaseStorage.prototype.getAllOperatorSubscriptions = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllOperatorSubscriptions()];
        }); });
    };
    DatabaseStorage.prototype.createOperatorSubscriptionSplit = function (split) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createOperatorSubscriptionSplit(split)];
        }); });
    };
    DatabaseStorage.prototype.getOperatorSubscriptionSplits = function (operatorId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getOperatorSubscriptionSplits(operatorId)];
        }); });
    };
    DatabaseStorage.prototype.getOperatorSubscriptionSplitsBySubscription = function (subscriptionId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getOperatorSubscriptionSplitsBySubscription(subscriptionId)];
        }); });
    };
    DatabaseStorage.prototype.getTrusteeEarnings = function (trusteeId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTrusteeEarnings(trusteeId)];
        }); });
    };
    DatabaseStorage.prototype.getOperatorSubscriptionSplit = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getOperatorSubscriptionSplit(id)];
        }); });
    };
    DatabaseStorage.prototype.getTeams = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeams()];
        }); });
    };
    DatabaseStorage.prototype.getTeam = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeam(id)];
        }); });
    };
    DatabaseStorage.prototype.createTeam = function (team) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createTeam(team)];
        }); });
    };
    DatabaseStorage.prototype.updateTeam = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateTeam(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteTeam = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteTeam(id)];
        }); });
    };
    DatabaseStorage.prototype.getTeamPlayers = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamPlayers()];
        }); });
    };
    DatabaseStorage.prototype.getTeamPlayer = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamPlayer(id)];
        }); });
    };
    DatabaseStorage.prototype.createTeamPlayer = function (teamPlayer) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createTeamPlayer(teamPlayer)];
        }); });
    };
    DatabaseStorage.prototype.updateTeamPlayer = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateTeamPlayer(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteTeamPlayer = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteTeamPlayer(id)];
        }); });
    };
    DatabaseStorage.prototype.getTeamMatches = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamMatches()];
        }); });
    };
    DatabaseStorage.prototype.getTeamMatch = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamMatch(id)];
        }); });
    };
    DatabaseStorage.prototype.createTeamMatch = function (match) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createTeamMatch(match)];
        }); });
    };
    DatabaseStorage.prototype.updateTeamMatch = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateTeamMatch(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteTeamMatch = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteTeamMatch(id)];
        }); });
    };
    DatabaseStorage.prototype.getTeamSets = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamSets()];
        }); });
    };
    DatabaseStorage.prototype.getTeamSet = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamSet(id)];
        }); });
    };
    DatabaseStorage.prototype.createTeamSet = function (set) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createTeamSet(set)];
        }); });
    };
    DatabaseStorage.prototype.updateTeamSet = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateTeamSet(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteTeamSet = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteTeamSet(id)];
        }); });
    };
    DatabaseStorage.prototype.getTeamChallenges = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamChallenges()];
        }); });
    };
    DatabaseStorage.prototype.getTeamChallenge = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamChallenge(id)];
        }); });
    };
    DatabaseStorage.prototype.createTeamChallenge = function (challenge) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createTeamChallenge(challenge)];
        }); });
    };
    DatabaseStorage.prototype.updateTeamChallenge = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateTeamChallenge(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteTeamChallenge = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteTeamChallenge(id)];
        }); });
    };
    DatabaseStorage.prototype.getTeamChallengeParticipants = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamChallengeParticipants()];
        }); });
    };
    DatabaseStorage.prototype.getTeamChallengeParticipant = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamChallengeParticipant(id)];
        }); });
    };
    DatabaseStorage.prototype.createTeamChallengeParticipant = function (participant) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createTeamChallengeParticipant(participant)];
        }); });
    };
    DatabaseStorage.prototype.updateTeamChallengeParticipant = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateTeamChallengeParticipant(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteTeamChallengeParticipant = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteTeamChallengeParticipant(id)];
        }); });
    };
    DatabaseStorage.prototype.getCheckins = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getCheckins()];
        }); });
    };
    DatabaseStorage.prototype.getCheckin = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getCheckin(id)];
        }); });
    };
    DatabaseStorage.prototype.createCheckin = function (checkin) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createCheckin(checkin)];
        }); });
    };
    DatabaseStorage.prototype.updateCheckin = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateCheckin(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteCheckin = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteCheckin(id)];
        }); });
    };
    DatabaseStorage.prototype.getAttitudeVotes = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAttitudeVotes()];
        }); });
    };
    DatabaseStorage.prototype.getAttitudeVote = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAttitudeVote(id)];
        }); });
    };
    DatabaseStorage.prototype.createAttitudeVote = function (vote) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createAttitudeVote(vote)];
        }); });
    };
    DatabaseStorage.prototype.updateAttitudeVote = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateAttitudeVote(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteAttitudeVote = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteAttitudeVote(id)];
        }); });
    };
    DatabaseStorage.prototype.getAttitudeBallots = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAttitudeBallots()];
        }); });
    };
    DatabaseStorage.prototype.getAttitudeBallot = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAttitudeBallot(id)];
        }); });
    };
    DatabaseStorage.prototype.createAttitudeBallot = function (ballot) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createAttitudeBallot(ballot)];
        }); });
    };
    DatabaseStorage.prototype.updateAttitudeBallot = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateAttitudeBallot(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteAttitudeBallot = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteAttitudeBallot(id)];
        }); });
    };
    DatabaseStorage.prototype.getIncidents = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getIncidents()];
        }); });
    };
    DatabaseStorage.prototype.getIncident = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getIncident(id)];
        }); });
    };
    DatabaseStorage.prototype.createIncident = function (incident) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createIncident(incident)];
        }); });
    };
    DatabaseStorage.prototype.updateIncident = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateIncident(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteIncident = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteIncident(id)];
        }); });
    };
    DatabaseStorage.prototype.getChallengeEntries = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallengeEntries()];
        }); });
    };
    DatabaseStorage.prototype.getChallengeEntry = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallengeEntry(id)];
        }); });
    };
    DatabaseStorage.prototype.createChallengeEntry = function (entry) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createChallengeEntry(entry)];
        }); });
    };
    DatabaseStorage.prototype.updateChallengeEntry = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateChallengeEntry(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteChallengeEntry = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteChallengeEntry(id)];
        }); });
    };
    DatabaseStorage.prototype.getLedgerEntries = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getLedgerEntries()];
        }); });
    };
    DatabaseStorage.prototype.getLedgerEntry = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getLedgerEntry(id)];
        }); });
    };
    DatabaseStorage.prototype.createLedgerEntry = function (entry) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createLedgerEntry(entry)];
        }); });
    };
    DatabaseStorage.prototype.updateLedgerEntry = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateLedgerEntry(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteLedgerEntry = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteLedgerEntry(id)];
        }); });
    };
    DatabaseStorage.prototype.getResolutions = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getResolutions()];
        }); });
    };
    DatabaseStorage.prototype.getResolution = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getResolution(id)];
        }); });
    };
    DatabaseStorage.prototype.createResolution = function (resolution) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createResolution(resolution)];
        }); });
    };
    DatabaseStorage.prototype.updateResolution = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateResolution(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteResolution = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteResolution(id)];
        }); });
    };
    DatabaseStorage.prototype.getMatchDivisions = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getMatchDivisions()];
        }); });
    };
    DatabaseStorage.prototype.getMatchDivision = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getMatchDivision(id)];
        }); });
    };
    DatabaseStorage.prototype.createMatchDivision = function (division) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createMatchDivision(division)];
        }); });
    };
    DatabaseStorage.prototype.updateMatchDivision = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateMatchDivision(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteMatchDivision = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteMatchDivision(id)];
        }); });
    };
    DatabaseStorage.prototype.getOperatorTiers = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getOperatorTiers()];
        }); });
    };
    DatabaseStorage.prototype.getOperatorTier = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getOperatorTier(id)];
        }); });
    };
    DatabaseStorage.prototype.createOperatorTier = function (tier) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createOperatorTier(tier)];
        }); });
    };
    DatabaseStorage.prototype.updateOperatorTier = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateOperatorTier(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteOperatorTier = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteOperatorTier(id)];
        }); });
    };
    DatabaseStorage.prototype.getTeamStripeAccounts = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamStripeAccounts()];
        }); });
    };
    DatabaseStorage.prototype.getTeamStripeAccount = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamStripeAccount(id)];
        }); });
    };
    DatabaseStorage.prototype.createTeamStripeAccount = function (account) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createTeamStripeAccount(account)];
        }); });
    };
    DatabaseStorage.prototype.updateTeamStripeAccount = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateTeamStripeAccount(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteTeamStripeAccount = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteTeamStripeAccount(id)];
        }); });
    };
    DatabaseStorage.prototype.getMatchEntries = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getMatchEntries()];
        }); });
    };
    DatabaseStorage.prototype.getMatchEntry = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getMatchEntry(id)];
        }); });
    };
    DatabaseStorage.prototype.createMatchEntry = function (entry) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createMatchEntry(entry)];
        }); });
    };
    DatabaseStorage.prototype.updateMatchEntry = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateMatchEntry(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteMatchEntry = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteMatchEntry(id)];
        }); });
    };
    DatabaseStorage.prototype.getPayoutDistributions = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPayoutDistributions()];
        }); });
    };
    DatabaseStorage.prototype.getPayoutDistribution = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPayoutDistribution(id)];
        }); });
    };
    DatabaseStorage.prototype.createPayoutDistribution = function (distribution) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createPayoutDistribution(distribution)];
        }); });
    };
    DatabaseStorage.prototype.updatePayoutDistribution = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updatePayoutDistribution(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deletePayoutDistribution = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deletePayoutDistribution(id)];
        }); });
    };
    DatabaseStorage.prototype.getTeamRegistrations = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamRegistrations()];
        }); });
    };
    DatabaseStorage.prototype.getTeamRegistration = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamRegistration(id)];
        }); });
    };
    DatabaseStorage.prototype.createTeamRegistration = function (registration) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createTeamRegistration(registration)];
        }); });
    };
    DatabaseStorage.prototype.updateTeamRegistration = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateTeamRegistration(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteTeamRegistration = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteTeamRegistration(id)];
        }); });
    };
    DatabaseStorage.prototype.getUploadedFiles = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getUploadedFiles()];
        }); });
    };
    DatabaseStorage.prototype.getUploadedFile = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getUploadedFile(id)];
        }); });
    };
    DatabaseStorage.prototype.createUploadedFile = function (file) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createUploadedFile(file)];
        }); });
    };
    DatabaseStorage.prototype.updateUploadedFile = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateUploadedFile(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteUploadedFile = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteUploadedFile(id)];
        }); });
    };
    DatabaseStorage.prototype.getFileShares = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getFileShares()];
        }); });
    };
    DatabaseStorage.prototype.getFileShare = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getFileShare(id)];
        }); });
    };
    DatabaseStorage.prototype.createFileShare = function (share) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createFileShare(share)];
        }); });
    };
    DatabaseStorage.prototype.updateFileShare = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateFileShare(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteFileShare = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteFileShare(id)];
        }); });
    };
    DatabaseStorage.prototype.getWeightRules = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getWeightRules()];
        }); });
    };
    DatabaseStorage.prototype.getWeightRule = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getWeightRule(id)];
        }); });
    };
    DatabaseStorage.prototype.createWeightRule = function (rule) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createWeightRule(rule)];
        }); });
    };
    DatabaseStorage.prototype.updateWeightRule = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateWeightRule(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteWeightRule = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteWeightRule(id)];
        }); });
    };
    DatabaseStorage.prototype.getTutoringSessions = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTutoringSessions()];
        }); });
    };
    DatabaseStorage.prototype.getTutoringSession = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTutoringSession(id)];
        }); });
    };
    DatabaseStorage.prototype.createTutoringSession = function (session) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createTutoringSession(session)];
        }); });
    };
    DatabaseStorage.prototype.updateTutoringSession = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateTutoringSession(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteTutoringSession = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteTutoringSession(id)];
        }); });
    };
    DatabaseStorage.prototype.getTutoringCredits = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTutoringCredits()];
        }); });
    };
    DatabaseStorage.prototype.getTutoringCredit = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTutoringCredit(id)];
        }); });
    };
    DatabaseStorage.prototype.createTutoringCredits = function (credits) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createTutoringCredits(credits)];
        }); });
    };
    DatabaseStorage.prototype.updateTutoringCredits = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateTutoringCredits(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteTutoringCredits = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteTutoringCredits(id)];
        }); });
    };
    DatabaseStorage.prototype.getCommissionRates = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getCommissionRates()];
        }); });
    };
    DatabaseStorage.prototype.getCommissionRate = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getCommissionRate(id)];
        }); });
    };
    DatabaseStorage.prototype.createCommissionRate = function (rate) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createCommissionRate(rate)];
        }); });
    };
    DatabaseStorage.prototype.updateCommissionRate = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateCommissionRate(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteCommissionRate = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteCommissionRate(id)];
        }); });
    };
    DatabaseStorage.prototype.getPlatformEarnings = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPlatformEarnings()];
        }); });
    };
    DatabaseStorage.prototype.getPlatformEarning = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPlatformEarning(id)];
        }); });
    };
    DatabaseStorage.prototype.createPlatformEarnings = function (earnings) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createPlatformEarnings(earnings)];
        }); });
    };
    DatabaseStorage.prototype.updatePlatformEarnings = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updatePlatformEarnings(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deletePlatformEarnings = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deletePlatformEarnings(id)];
        }); });
    };
    DatabaseStorage.prototype.getMembershipEarnings = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getMembershipEarnings()];
        }); });
    };
    DatabaseStorage.prototype.getMembershipEarning = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getMembershipEarning(id)];
        }); });
    };
    DatabaseStorage.prototype.createMembershipEarnings = function (earnings) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createMembershipEarnings(earnings)];
        }); });
    };
    DatabaseStorage.prototype.updateMembershipEarnings = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateMembershipEarnings(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteMembershipEarnings = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteMembershipEarnings(id)];
        }); });
    };
    DatabaseStorage.prototype.getOperatorPayouts = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getOperatorPayouts()];
        }); });
    };
    DatabaseStorage.prototype.getOperatorPayout = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getOperatorPayout(id)];
        }); });
    };
    DatabaseStorage.prototype.createOperatorPayout = function (payout) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createOperatorPayout(payout)];
        }); });
    };
    DatabaseStorage.prototype.updateOperatorPayout = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateOperatorPayout(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteOperatorPayout = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteOperatorPayout(id)];
        }); });
    };
    DatabaseStorage.prototype.getMembershipSubscriptions = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.membershipSubscriptions).orderBy((0, drizzle_orm_1.desc)(schema_1.membershipSubscriptions.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMembershipSubscription = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.membershipSubscriptions).where((0, drizzle_orm_1.eq)(schema_1.membershipSubscriptions.id, id))];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.createMembershipSubscription = function (subscription) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.membershipSubscriptions).values(subscription).returning()];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateMembershipSubscription = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.update(schema_1.membershipSubscriptions).set(__assign(__assign({}, updates), { updatedAt: new Date() })).where((0, drizzle_orm_1.eq)(schema_1.membershipSubscriptions.id, id)).returning()];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.deleteMembershipSubscription = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.delete(schema_1.membershipSubscriptions).where((0, drizzle_orm_1.eq)(schema_1.membershipSubscriptions.id, id))];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rowCount > 0];
                }
            });
        });
    };
    DatabaseStorage.prototype.getChallenges = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallenges()];
        }); });
    };
    DatabaseStorage.prototype.getChallenge = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallenge(id)];
        }); });
    };
    DatabaseStorage.prototype.createChallenge = function (challenge) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createChallenge(challenge)];
        }); });
    };
    DatabaseStorage.prototype.updateChallenge = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateChallenge(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteChallenge = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteChallenge(id)];
        }); });
    };
    DatabaseStorage.prototype.getChallengeFees = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallengeFees()];
        }); });
    };
    DatabaseStorage.prototype.getChallengeFee = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallengeFee(id)];
        }); });
    };
    DatabaseStorage.prototype.createChallengeFee = function (fee) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createChallengeFee(fee)];
        }); });
    };
    DatabaseStorage.prototype.updateChallengeFee = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateChallengeFee(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteChallengeFee = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteChallengeFee(id)];
        }); });
    };
    DatabaseStorage.prototype.getChallengeCheckIns = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallengeCheckIns()];
        }); });
    };
    DatabaseStorage.prototype.getChallengeCheckIn = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallengeCheckIn(id)];
        }); });
    };
    DatabaseStorage.prototype.createChallengeCheckIn = function (checkin) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createChallengeCheckIn(checkin)];
        }); });
    };
    DatabaseStorage.prototype.updateChallengeCheckIn = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateChallengeCheckIn(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteChallengeCheckIn = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteChallengeCheckIn(id)];
        }); });
    };
    DatabaseStorage.prototype.getChallengePolicies = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallengePolicies()];
        }); });
    };
    DatabaseStorage.prototype.getChallengePolicy = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallengePolicy(id)];
        }); });
    };
    DatabaseStorage.prototype.createChallengePolicy = function (policy) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createChallengePolicy(policy)];
        }); });
    };
    DatabaseStorage.prototype.updateChallengePolicy = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateChallengePolicy(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteChallengePolicy = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteChallengePolicy(id)];
        }); });
    };
    DatabaseStorage.prototype.getQrCodeNonces = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getQrCodeNonces()];
        }); });
    };
    DatabaseStorage.prototype.getQrCodeNonce = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getQrCodeNonce(id)];
        }); });
    };
    DatabaseStorage.prototype.createQrCodeNonce = function (nonce) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createQrCodeNonce(nonce)];
        }); });
    };
    DatabaseStorage.prototype.updateQrCodeNonce = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateQrCodeNonce(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteQrCodeNonce = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteQrCodeNonce(id)];
        }); });
    };
    DatabaseStorage.prototype.markNonceAsUsed = function (nonce, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.markNonceAsUsed(nonce, ipAddress, userAgent)];
        }); });
    };
    DatabaseStorage.prototype.isNonceUsed = function (nonce) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.isNonceUsed(nonce)];
        }); });
    };
    DatabaseStorage.prototype.isNonceValid = function (nonce) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.isNonceValid(nonce)];
        }); });
    };
    DatabaseStorage.prototype.cleanupExpiredNonces = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.cleanupExpiredNonces()];
        }); });
    };
    DatabaseStorage.prototype.getIcalFeedTokens = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getIcalFeedTokens()];
        }); });
    };
    DatabaseStorage.prototype.getIcalFeedToken = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getIcalFeedToken(id)];
        }); });
    };
    DatabaseStorage.prototype.createIcalFeedToken = function (token) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createIcalFeedToken(token)];
        }); });
    };
    DatabaseStorage.prototype.updateIcalFeedToken = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateIcalFeedToken(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteIcalFeedToken = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteIcalFeedToken(id)];
        }); });
    };
    DatabaseStorage.prototype.getPaymentMethods = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPaymentMethods()];
        }); });
    };
    DatabaseStorage.prototype.getPaymentMethod = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPaymentMethod(id)];
        }); });
    };
    DatabaseStorage.prototype.createPaymentMethod = function (method) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createPaymentMethod(method)];
        }); });
    };
    DatabaseStorage.prototype.updatePaymentMethod = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updatePaymentMethod(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deletePaymentMethod = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deletePaymentMethod(id)];
        }); });
    };
    DatabaseStorage.prototype.getStakesHolds = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getStakesHolds()];
        }); });
    };
    DatabaseStorage.prototype.getStakesHold = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getStakesHold(id)];
        }); });
    };
    DatabaseStorage.prototype.createStakesHold = function (hold) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createStakesHold(hold)];
        }); });
    };
    DatabaseStorage.prototype.updateStakesHold = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateStakesHold(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteStakesHold = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteStakesHold(id)];
        }); });
    };
    DatabaseStorage.prototype.getNotificationSettings = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getNotificationSettings()];
        }); });
    };
    DatabaseStorage.prototype.getNotificationSetting = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getNotificationSetting(id)];
        }); });
    };
    DatabaseStorage.prototype.createNotificationSettings = function (settings) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createNotificationSettings(settings)];
        }); });
    };
    DatabaseStorage.prototype.updateNotificationSettings = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateNotificationSettings(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteNotificationSettings = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteNotificationSettings(id)];
        }); });
    };
    DatabaseStorage.prototype.getNotificationDeliveries = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getNotificationDeliveries()];
        }); });
    };
    DatabaseStorage.prototype.getNotificationDelivery = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getNotificationDelivery(id)];
        }); });
    };
    DatabaseStorage.prototype.createNotificationDelivery = function (delivery) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createNotificationDelivery(delivery)];
        }); });
    };
    DatabaseStorage.prototype.updateNotificationDelivery = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateNotificationDelivery(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteNotificationDelivery = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteNotificationDelivery(id)];
        }); });
    };
    DatabaseStorage.prototype.getDisputeResolutions = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getDisputeResolutions()];
        }); });
    };
    DatabaseStorage.prototype.getDisputeResolution = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getDisputeResolution(id)];
        }); });
    };
    DatabaseStorage.prototype.createDisputeResolution = function (resolution) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createDisputeResolution(resolution)];
        }); });
    };
    DatabaseStorage.prototype.updateDisputeResolution = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateDisputeResolution(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteDisputeResolution = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteDisputeResolution(id)];
        }); });
    };
    DatabaseStorage.prototype.getPlayerCooldowns = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPlayerCooldowns()];
        }); });
    };
    DatabaseStorage.prototype.getPlayerCooldown = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPlayerCooldown(id)];
        }); });
    };
    DatabaseStorage.prototype.createPlayerCooldown = function (cooldown) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createPlayerCooldown(cooldown)];
        }); });
    };
    DatabaseStorage.prototype.updatePlayerCooldown = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updatePlayerCooldown(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deletePlayerCooldown = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deletePlayerCooldown(id)];
        }); });
    };
    DatabaseStorage.prototype.getDeviceAttestations = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getDeviceAttestations()];
        }); });
    };
    DatabaseStorage.prototype.getDeviceAttestation = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getDeviceAttestation(id)];
        }); });
    };
    DatabaseStorage.prototype.createDeviceAttestation = function (attestation) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createDeviceAttestation(attestation)];
        }); });
    };
    DatabaseStorage.prototype.updateDeviceAttestation = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateDeviceAttestation(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteDeviceAttestation = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteDeviceAttestation(id)];
        }); });
    };
    DatabaseStorage.prototype.getJobQueues = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getJobQueues()];
        }); });
    };
    DatabaseStorage.prototype.getJobQueue = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getJobQueue(id)];
        }); });
    };
    DatabaseStorage.prototype.createJobQueue = function (job) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createJobQueue(job)];
        }); });
    };
    DatabaseStorage.prototype.updateJobQueue = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateJobQueue(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteJobQueue = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteJobQueue(id)];
        }); });
    };
    DatabaseStorage.prototype.getSystemMetrics = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getSystemMetrics()];
        }); });
    };
    DatabaseStorage.prototype.getSystemMetric = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getSystemMetric(id)];
        }); });
    };
    DatabaseStorage.prototype.createSystemMetric = function (metric) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createSystemMetric(metric)];
        }); });
    };
    DatabaseStorage.prototype.updateSystemMetric = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateSystemMetric(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteSystemMetric = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteSystemMetric(id)];
        }); });
    };
    DatabaseStorage.prototype.getSystemAlerts = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getSystemAlerts()];
        }); });
    };
    DatabaseStorage.prototype.getSystemAlert = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getSystemAlert(id)];
        }); });
    };
    DatabaseStorage.prototype.createSystemAlert = function (alert) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createSystemAlert(alert)];
        }); });
    };
    DatabaseStorage.prototype.updateSystemAlert = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateSystemAlert(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.deleteSystemAlert = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deleteSystemAlert(id)];
        }); });
    };
    // Additional query methods
    DatabaseStorage.prototype.getPlayersByRating = function (minRating) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPlayersByRating(minRating)];
        }); });
    };
    DatabaseStorage.prototype.getPlayersByCity = function (city) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPlayersByCity(city)];
        }); });
    };
    DatabaseStorage.prototype.getMemberPlayers = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getMemberPlayers()];
        }); });
    };
    DatabaseStorage.prototype.getTopPlayers = function (limit) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTopPlayers(limit)];
        }); });
    };
    DatabaseStorage.prototype.getPlayersByStreakLength = function (minStreak) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPlayersByStreakLength(minStreak)];
        }); });
    };
    DatabaseStorage.prototype.getActiveMatches = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveMatches()];
        }); });
    };
    DatabaseStorage.prototype.getMatchesByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getMatchesByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getUpcomingTournaments = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getUpcomingTournaments()];
        }); });
    };
    DatabaseStorage.prototype.getActiveTournaments = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveTournaments()];
        }); });
    };
    DatabaseStorage.prototype.getTournamentsByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTournamentsByStatus(status)];
        }); });
    };
    DatabaseStorage.prototype.getKellyPoolsByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getKellyPoolsByStatus(status)];
        }); });
    };
    DatabaseStorage.prototype.getActiveKellyPools = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveKellyPools()];
        }); });
    };
    DatabaseStorage.prototype.getActiveBounties = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveBounties()];
        }); });
    };
    DatabaseStorage.prototype.getBountiesByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getBountiesByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getUpcomingCharityEvents = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getUpcomingCharityEvents()];
        }); });
    };
    DatabaseStorage.prototype.getPendingSupportRequests = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPendingSupportRequests()];
        }); });
    };
    DatabaseStorage.prototype.getSupportRequestsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getSupportRequestsByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getActiveLiveStreams = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveLiveStreams()];
        }); });
    };
    DatabaseStorage.prototype.getLiveStreamsByPlatform = function (platform) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getLiveStreamsByPlatform(platform)];
        }); });
    };
    DatabaseStorage.prototype.getLiveStreamsByCity = function (city) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getLiveStreamsByCity(city)];
        }); });
    };
    DatabaseStorage.prototype.getWebhookEventsByType = function (eventType) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.webhookEvents).where((0, drizzle_orm_1.eq)(schema_1.webhookEvents.eventType, eventType))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getRecentWebhookEvents = function (hours) {
        return __awaiter(this, void 0, void 0, function () {
            var cutoffTime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
                        return [4 /*yield*/, db_1.db.select().from(schema_1.webhookEvents).orderBy((0, drizzle_orm_1.desc)(schema_1.webhookEvents.processedAt)).limit(100)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPoolHallsByCity = function (city) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPoolHallsByCity(city)];
        }); });
    };
    DatabaseStorage.prototype.getActivePoolHalls = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActivePoolHalls()];
        }); });
    };
    DatabaseStorage.prototype.getHallMatchesByHall = function (hallId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getHallMatchesByHall(hallId)];
        }); });
    };
    DatabaseStorage.prototype.getActiveHallMatches = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveHallMatches()];
        }); });
    };
    DatabaseStorage.prototype.getHallRostersByHall = function (hallId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getHallRostersByHall(hallId)];
        }); });
    };
    DatabaseStorage.prototype.getOperatorSettingsByOperator = function (operatorId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getOperatorSettingsByOperator(operatorId)];
        }); });
    };
    DatabaseStorage.prototype.getRookieMatchesByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getRookieMatchesByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getActiveRookieMatches = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveRookieMatches()];
        }); });
    };
    DatabaseStorage.prototype.getUpcomingRookieEvents = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getUpcomingRookieEvents()];
        }); });
    };
    DatabaseStorage.prototype.getRookieAchievementsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getRookieAchievementsByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getActiveRookieSubscriptions = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveRookieSubscriptions()];
        }); });
    };
    DatabaseStorage.prototype.getRookieSubscriptionsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getRookieSubscriptionsByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getActiveOperatorSubscriptions = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveOperatorSubscriptions()];
        }); });
    };
    DatabaseStorage.prototype.getOperatorSubscriptionsByOperator = function (operatorId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getOperatorSubscriptionsByOperator(operatorId)];
        }); });
    };
    DatabaseStorage.prototype.getTeamsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamsByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getActiveTeams = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveTeams()];
        }); });
    };
    DatabaseStorage.prototype.getTeamPlayersByTeam = function (teamId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamPlayersByTeam(teamId)];
        }); });
    };
    DatabaseStorage.prototype.getTeamPlayersByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamPlayersByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getTeamMatchesByTeam = function (teamId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamMatchesByTeam(teamId)];
        }); });
    };
    DatabaseStorage.prototype.getActiveTeamMatches = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveTeamMatches()];
        }); });
    };
    DatabaseStorage.prototype.getTeamSetsByMatch = function (matchId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamSetsByMatch(matchId)];
        }); });
    };
    DatabaseStorage.prototype.getActiveTeamChallenges = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveTeamChallenges()];
        }); });
    };
    DatabaseStorage.prototype.getTeamChallengesByTeam = function (teamId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamChallengesByTeam(teamId)];
        }); });
    };
    DatabaseStorage.prototype.getTeamChallengeParticipantsByChallenge = function (challengeId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamChallengeParticipantsByChallenge(challengeId)];
        }); });
    };
    DatabaseStorage.prototype.getTeamChallengeParticipantsByTeam = function (teamId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamChallengeParticipantsByTeam(teamId)];
        }); });
    };
    DatabaseStorage.prototype.getCheckinsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getCheckinsByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getRecentCheckins = function (hours) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getRecentCheckins(hours)];
        }); });
    };
    DatabaseStorage.prototype.getAttitudeVotesByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAttitudeVotesByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getAttitudeVotesByBallot = function (ballotId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAttitudeVotesByBallot(ballotId)];
        }); });
    };
    DatabaseStorage.prototype.getActiveAttitudeBallots = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveAttitudeBallots()];
        }); });
    };
    DatabaseStorage.prototype.getIncidentsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getIncidentsByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getIncidentsByType = function (incidentType) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getIncidentsByType(incidentType)];
        }); });
    };
    DatabaseStorage.prototype.getOpenIncidents = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getOpenIncidents()];
        }); });
    };
    DatabaseStorage.prototype.getChallengeEntriesByPool = function (poolId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallengeEntriesByPool(poolId)];
        }); });
    };
    DatabaseStorage.prototype.getChallengeEntriesByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallengeEntriesByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getLedgerEntriesByWallet = function (walletId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getLedgerEntriesByWallet(walletId)];
        }); });
    };
    DatabaseStorage.prototype.getLedgerEntriesByType = function (entryType) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getLedgerEntriesByType(entryType)];
        }); });
    };
    DatabaseStorage.prototype.getResolutionsByPool = function (poolId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getResolutionsByPool(poolId)];
        }); });
    };
    DatabaseStorage.prototype.getPendingResolutions = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPendingResolutions()];
        }); });
    };
    DatabaseStorage.prototype.getMatchDivisionsByType = function (divisionType) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getMatchDivisionsByType(divisionType)];
        }); });
    };
    DatabaseStorage.prototype.getActiveMatchDivisions = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveMatchDivisions()];
        }); });
    };
    DatabaseStorage.prototype.getOperatorTiersByLevel = function (level) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getOperatorTiersByLevel(level)];
        }); });
    };
    DatabaseStorage.prototype.getTeamStripeAccountsByTeam = function (teamId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamStripeAccountsByTeam(teamId)];
        }); });
    };
    DatabaseStorage.prototype.getMatchEntryByMatchId = function (matchId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getMatchEntryByMatchId(matchId)];
        }); });
    };
    DatabaseStorage.prototype.getMatchEntriesByMatch = function (matchId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getMatchEntriesByMatch(matchId)];
        }); });
    };
    DatabaseStorage.prototype.getMatchEntriesByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getMatchEntriesByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getPayoutDistributionsByPool = function (poolId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPayoutDistributionsByPool(poolId)];
        }); });
    };
    DatabaseStorage.prototype.getPayoutDistributionsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPayoutDistributionsByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getTeamRegistrationsByTeam = function (teamId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamRegistrationsByTeam(teamId)];
        }); });
    };
    DatabaseStorage.prototype.getActiveTeamRegistrations = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveTeamRegistrations()];
        }); });
    };
    DatabaseStorage.prototype.getUploadedFilesByUploader = function (uploaderId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getUploadedFilesByUploader(uploaderId)];
        }); });
    };
    DatabaseStorage.prototype.getUploadedFilesByType = function (fileType) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getUploadedFilesByType(fileType)];
        }); });
    };
    DatabaseStorage.prototype.getFileSharesByFile = function (fileId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getFileSharesByFile(fileId)];
        }); });
    };
    DatabaseStorage.prototype.getFileSharesBySharedWith = function (sharedWithId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getFileSharesBySharedWith(sharedWithId)];
        }); });
    };
    DatabaseStorage.prototype.getActiveFileShares = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveFileShares()];
        }); });
    };
    DatabaseStorage.prototype.getWeightRulesByDivision = function (divisionId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getWeightRulesByDivision(divisionId)];
        }); });
    };
    DatabaseStorage.prototype.getActiveWeightRules = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveWeightRules()];
        }); });
    };
    DatabaseStorage.prototype.getTutoringSessionsByStudent = function (studentId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTutoringSessionsByStudent(studentId)];
        }); });
    };
    DatabaseStorage.prototype.getTutoringSessionsByTutor = function (tutorId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTutoringSessionsByTutor(tutorId)];
        }); });
    };
    DatabaseStorage.prototype.getUpcomingTutoringSessions = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getUpcomingTutoringSessions()];
        }); });
    };
    DatabaseStorage.prototype.getTutoringCreditsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTutoringCreditsByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getActiveTutoringCredits = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveTutoringCredits()];
        }); });
    };
    DatabaseStorage.prototype.getCommissionRatesByOperator = function (operatorId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getCommissionRatesByOperator(operatorId)];
        }); });
    };
    DatabaseStorage.prototype.getActiveCommissionRates = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveCommissionRates()];
        }); });
    };
    DatabaseStorage.prototype.getPlatformEarningsByPeriod = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPlatformEarningsByPeriod(startDate, endDate)];
        }); });
    };
    DatabaseStorage.prototype.getRecentPlatformEarnings = function (days) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getRecentPlatformEarnings(days)];
        }); });
    };
    DatabaseStorage.prototype.getMembershipEarningsByPeriod = function (startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getMembershipEarningsByPeriod(startDate, endDate)];
        }); });
    };
    DatabaseStorage.prototype.getRecentMembershipEarnings = function (days) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getRecentMembershipEarnings(days)];
        }); });
    };
    DatabaseStorage.prototype.getOperatorPayoutsByOperator = function (operatorId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getOperatorPayoutsByOperator(operatorId)];
        }); });
    };
    DatabaseStorage.prototype.getPendingOperatorPayouts = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPendingOperatorPayouts()];
        }); });
    };
    DatabaseStorage.prototype.getMembershipSubscriptionByPlayerId = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.membershipSubscriptions).where((0, drizzle_orm_1.eq)(schema_1.membershipSubscriptions.playerId, playerId))];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.getMembershipSubscriptionsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.membershipSubscriptions).where((0, drizzle_orm_1.eq)(schema_1.membershipSubscriptions.playerId, playerId)).orderBy((0, drizzle_orm_1.desc)(schema_1.membershipSubscriptions.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getActiveMembershipSubscriptions = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.membershipSubscriptions).where((0, drizzle_orm_1.eq)(schema_1.membershipSubscriptions.status, "active")).orderBy((0, drizzle_orm_1.desc)(schema_1.membershipSubscriptions.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getChallengesByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallengesByStatus(status)];
        }); });
    };
    DatabaseStorage.prototype.getChallengesByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallengesByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getChallengesByHall = function (hallId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallengesByHall(hallId)];
        }); });
    };
    DatabaseStorage.prototype.getUpcomingChallenges = function (limit) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getUpcomingChallenges(limit)];
        }); });
    };
    DatabaseStorage.prototype.getActiveChallenges = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveChallenges()];
        }); });
    };
    DatabaseStorage.prototype.getChallengeFeesByChallenge = function (challengeId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallengeFeesByChallenge(challengeId)];
        }); });
    };
    DatabaseStorage.prototype.getUnpaidChallengeFees = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getUnpaidChallengeFees()];
        }); });
    };
    DatabaseStorage.prototype.getChallengeCheckInsByChallenge = function (challengeId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallengeCheckInsByChallenge(challengeId)];
        }); });
    };
    DatabaseStorage.prototype.getChallengeCheckInsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallengeCheckInsByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getChallengesPolicyByHall = function (hallId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallengesPolicyByHall(hallId)];
        }); });
    };
    DatabaseStorage.prototype.getActiveChallengePolicies = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveChallengePolicies()];
        }); });
    };
    DatabaseStorage.prototype.getChallengePoliciesByType = function (policyType) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getChallengePoliciesByType(policyType)];
        }); });
    };
    DatabaseStorage.prototype.getActiveQrCodeNonces = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveQrCodeNonces()];
        }); });
    };
    DatabaseStorage.prototype.getQrCodeNoncesByType = function (nonceType) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getQrCodeNoncesByType(nonceType)];
        }); });
    };
    DatabaseStorage.prototype.getIcalFeedTokensByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getIcalFeedTokensByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getActiveIcalFeedTokens = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveIcalFeedTokens()];
        }); });
    };
    DatabaseStorage.prototype.getPaymentMethodsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPaymentMethodsByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getActivePaymentMethods = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActivePaymentMethods()];
        }); });
    };
    DatabaseStorage.prototype.getStakesHoldsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getStakesHoldsByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getActiveStakesHolds = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveStakesHolds()];
        }); });
    };
    DatabaseStorage.prototype.getNotificationSettingsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getNotificationSettingsByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getNotificationDeliveriesByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getNotificationDeliveriesByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getPendingNotificationDeliveries = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPendingNotificationDeliveries()];
        }); });
    };
    DatabaseStorage.prototype.getDisputeResolutionsByDispute = function (disputeId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getDisputeResolutionsByDispute(disputeId)];
        }); });
    };
    DatabaseStorage.prototype.getPendingDisputeResolutions = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPendingDisputeResolutions()];
        }); });
    };
    DatabaseStorage.prototype.getPlayerCooldownsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPlayerCooldownsByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getActivePlayerCooldowns = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActivePlayerCooldowns()];
        }); });
    };
    DatabaseStorage.prototype.getDeviceAttestationsByDevice = function (deviceId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getDeviceAttestationsByDevice(deviceId)];
        }); });
    };
    DatabaseStorage.prototype.getValidDeviceAttestations = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getValidDeviceAttestations()];
        }); });
    };
    DatabaseStorage.prototype.getPendingJobQueues = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPendingJobQueues()];
        }); });
    };
    DatabaseStorage.prototype.getJobQueuesByType = function (jobType) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getJobQueuesByType(jobType)];
        }); });
    };
    DatabaseStorage.prototype.getFailedJobQueues = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getFailedJobQueues()];
        }); });
    };
    DatabaseStorage.prototype.getSystemMetricsByType = function (metricType) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getSystemMetricsByType(metricType)];
        }); });
    };
    DatabaseStorage.prototype.getRecentSystemMetrics = function (hours) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getRecentSystemMetrics(hours)];
        }); });
    };
    DatabaseStorage.prototype.getSystemAlertsByType = function (alertType) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getSystemAlertsByType(alertType)];
        }); });
    };
    DatabaseStorage.prototype.getActiveAlerts = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveAlerts()];
        }); });
    };
    DatabaseStorage.prototype.getFiringAlerts = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getFiringAlerts()];
        }); });
    };
    DatabaseStorage.prototype.triggerAlert = function (alertId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.triggerAlert(alertId)];
        }); });
    };
    DatabaseStorage.prototype.resolveAlert = function (alertId, resolvedBy) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.resolveAlert(alertId, resolvedBy)];
        }); });
    };
    // === AI COACH TRAINING ANALYTICS ===
    // Session Management
    DatabaseStorage.prototype.createTrainingSession = function (session) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.sessionAnalytics).values(session).returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.getTrainingSession = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.sessionAnalytics).where((0, drizzle_orm_1.eq)(schema_1.sessionAnalytics.id, sessionId))];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0] || null];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPlayerSessions = function (playerId, limit) {
        return __awaiter(this, void 0, void 0, function () {
            var query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = db_1.db.select().from(schema_1.sessionAnalytics).where((0, drizzle_orm_1.eq)(schema_1.sessionAnalytics.playerId, playerId));
                        if (!limit) return [3 /*break*/, 2];
                        return [4 /*yield*/, query.limit(limit)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, query];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Shot Recording
    DatabaseStorage.prototype.recordShots = function (sessionId, shotsData) {
        return __awaiter(this, void 0, void 0, function () {
            var shotsWithSession, created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        shotsWithSession = shotsData.map(function (shot) { return (__assign(__assign({}, shot), { sessionId: sessionId })); });
                        return [4 /*yield*/, db_1.db.insert(schema_1.shots).values(shotsWithSession).returning()];
                    case 1:
                        created = _a.sent();
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.getSessionShots = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.shots).where((0, drizzle_orm_1.eq)(schema_1.shots.sessionId, sessionId))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // Monthly Scores & Leaderboard
    DatabaseStorage.prototype.calculateMonthlyScores = function (period) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    DatabaseStorage.prototype.getHallLeaderboard = function (hallId, period) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.ladderTrainingScores)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ladderTrainingScores.hallId, hallId), (0, drizzle_orm_1.eq)(schema_1.ladderTrainingScores.period, period)))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.ladderTrainingScores.rank))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getPlayerTrainingScore = function (playerId, period) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.ladderTrainingScores)
                            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ladderTrainingScores.playerId, playerId), (0, drizzle_orm_1.eq)(schema_1.ladderTrainingScores.period, period)))];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0] || null];
                }
            });
        });
    };
    // Reward Management
    DatabaseStorage.prototype.createReward = function (reward) {
        return __awaiter(this, void 0, void 0, function () {
            var created;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.subscriptionRewards).values(reward).returning()];
                    case 1:
                        created = (_a.sent())[0];
                        return [2 /*return*/, created];
                }
            });
        });
    };
    DatabaseStorage.prototype.getRewardsForPeriod = function (period) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.subscriptionRewards).where((0, drizzle_orm_1.eq)(schema_1.subscriptionRewards.period, period))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.markRewardApplied = function (rewardId, stripeCouponId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.update(schema_1.subscriptionRewards)
                            .set({
                            appliedToStripe: true,
                            stripeCouponId: stripeCouponId,
                            appliedDate: new Date()
                        })
                            .where((0, drizzle_orm_1.eq)(schema_1.subscriptionRewards.id, rewardId))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // ── Missing methods delegated to memStorage ──────────────────────────────
    DatabaseStorage.prototype.getOrganization = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getOrganization(id)];
        }); });
    };
    DatabaseStorage.prototype.getAllOrganizations = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllOrganizations()];
        }); });
    };
    DatabaseStorage.prototype.createOrganization = function (org) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createOrganization(org)];
        }); });
    };
    DatabaseStorage.prototype.updateOrganization = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateOrganization(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.getAllPayoutTransfers = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllPayoutTransfers()];
        }); });
    };
    DatabaseStorage.prototype.getPayoutTransfer = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPayoutTransfer(id)];
        }); });
    };
    DatabaseStorage.prototype.createPayoutTransfer = function (transfer) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createPayoutTransfer(transfer)];
        }); });
    };
    DatabaseStorage.prototype.getAllHallMatches = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllHallMatches()];
        }); });
    };
    DatabaseStorage.prototype.getRosterByHall = function (hallId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getRosterByHall(hallId)];
        }); });
    };
    DatabaseStorage.prototype.touchUserActivity = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var db_2, users, eq_1, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("./config/db"); })];
                    case 1:
                        db_2 = (_a.sent()).db;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("@shared/schema"); })];
                    case 2:
                        users = (_a.sent()).users;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("drizzle-orm"); })];
                    case 3:
                        eq_1 = (_a.sent()).eq;
                        return [4 /*yield*/, db_2.update(users).set({ lastActivityAt: new Date() }).where(eq_1(users.id, id))];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        err_1 = _a.sent();
                        console.warn("[DatabaseStorage.touchUserActivity] fallback:", err_1 === null || err_1 === void 0 ? void 0 : err_1.message);
                        return [2 /*return*/, this.memStorage.touchUserActivity(id)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getActivePlayerCountByHall = function (hallId) {
        return __awaiter(this, void 0, void 0, function () {
            var db_3, _a, users, hallRosters, players, _b, and_1, eq_2, gte, lt, sql, ACTIVE_PLAYER_CONFIG, now, windowCutoff, ageCutoff, conditions, result, err_2;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("./config/db"); })];
                    case 1:
                        db_3 = (_d.sent()).db;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("@shared/schema"); })];
                    case 2:
                        _a = _d.sent(), users = _a.users, hallRosters = _a.hallRosters, players = _a.players;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("drizzle-orm"); })];
                    case 3:
                        _b = _d.sent(), and_1 = _b.and, eq_2 = _b.eq, gte = _b.gte, lt = _b.lt, sql = _b.sql;
                        return [4 /*yield*/, Promise.resolve().then(function () { return require("./config/activePlayer"); })];
                    case 4:
                        ACTIVE_PLAYER_CONFIG = (_d.sent()).ACTIVE_PLAYER_CONFIG;
                        now = Date.now();
                        windowCutoff = new Date(now - ACTIVE_PLAYER_CONFIG.ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
                        ageCutoff = new Date(now - ACTIVE_PLAYER_CONFIG.MIN_ACCOUNT_AGE_HOURS * 60 * 60 * 1000);
                        conditions = [
                            eq_2(hallRosters.hallId, hallId),
                            eq_2(hallRosters.isActive, true),
                            gte(users.lastActivityAt, windowCutoff),
                            lt(users.createdAt, ageCutoff),
                        ];
                        if (ACTIVE_PLAYER_CONFIG.EXCLUDE_BANNED) {
                            conditions.push(sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " != 'banned'"], ["", " != 'banned'"])), users.accountStatus));
                        }
                        if (ACTIVE_PLAYER_CONFIG.EXCLUDE_SUSPENDED) {
                            conditions.push(sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " != 'suspended'"], ["", " != 'suspended'"])), users.accountStatus));
                        }
                        if (ACTIVE_PLAYER_CONFIG.REQUIRE_EMAIL_VERIFIED) {
                            conditions.push(eq_2(users.emailVerified, true));
                        }
                        return [4 /*yield*/, db_3
                                .select({ count: sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["count(distinct ", ")::int"], ["count(distinct ", ")::int"])), users.id) })
                                .from(hallRosters)
                                .innerJoin(players, eq_2(players.id, hallRosters.playerId))
                                .innerJoin(users, eq_2(users.id, players.userId))
                                .where(and_1.apply(void 0, conditions))];
                    case 5:
                        result = _d.sent();
                        return [2 /*return*/, Number(((_c = result[0]) === null || _c === void 0 ? void 0 : _c.count) || 0)];
                    case 6:
                        err_2 = _d.sent();
                        console.warn("[DatabaseStorage.getActivePlayerCountByHall] fallback:", err_2 === null || err_2 === void 0 ? void 0 : err_2.message);
                        return [2 /*return*/, this.memStorage.getActivePlayerCountByHall(hallId)];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseStorage.prototype.getRosterByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getRosterByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.unlockHallBattles = function (hallId, unlockedBy) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.unlockHallBattles(hallId, unlockedBy)];
        }); });
    };
    DatabaseStorage.prototype.lockHallBattles = function (hallId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.lockHallBattles(hallId)];
        }); });
    };
    // ── Auto-generated delegation stubs for IStorage compliance ──
    DatabaseStorage.prototype.getPayoutTransfersByInvoice = function (invoiceId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPayoutTransfersByInvoice(invoiceId)];
        }); });
    };
    DatabaseStorage.prototype.getAllMatches = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllMatches()];
        }); });
    };
    DatabaseStorage.prototype.getAllTournaments = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllTournaments()];
        }); });
    };
    DatabaseStorage.prototype.getAllKellyPools = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllKellyPools()];
        }); });
    };
    DatabaseStorage.prototype.getAllBounties = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllBounties()];
        }); });
    };
    DatabaseStorage.prototype.getAllCharityEvents = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllCharityEvents()];
        }); });
    };
    DatabaseStorage.prototype.getAllSupportRequests = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllSupportRequests()];
        }); });
    };
    DatabaseStorage.prototype.getAllLiveStreams = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllLiveStreams()];
        }); });
    };
    DatabaseStorage.prototype.getLiveStreamsByLocation = function (city, state) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getLiveStreamsByLocation(city, state)];
        }); });
    };
    DatabaseStorage.prototype.getLiveStreamStats = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getLiveStreamStats()];
        }); });
    };
    DatabaseStorage.prototype.getAllHallRosters = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllHallRosters()];
        }); });
    };
    DatabaseStorage.prototype.getAllRookieMatches = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllRookieMatches()];
        }); });
    };
    DatabaseStorage.prototype.getAllRookieEvents = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllRookieEvents()];
        }); });
    };
    DatabaseStorage.prototype.getAllRookieSubscriptions = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllRookieSubscriptions()];
        }); });
    };
    DatabaseStorage.prototype.getRookieLeaderboard = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getRookieLeaderboard()];
        }); });
    };
    DatabaseStorage.prototype.promoteRookieToMainLadder = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.promoteRookieToMainLadder(playerId)];
        }); });
    };
    DatabaseStorage.prototype.creditWallet = function (userId, amount) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.creditWallet(userId, amount)];
        }); });
    };
    DatabaseStorage.prototype.lockCredits = function (userId, amount) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.lockCredits(userId, amount)];
        }); });
    };
    DatabaseStorage.prototype.unlockCredits = function (userId, amount) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.unlockCredits(userId, amount)];
        }); });
    };
    DatabaseStorage.prototype.addCredits = function (userId, amount) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.addCredits(userId, amount)];
        }); });
    };
    DatabaseStorage.prototype.processDelayedPayouts = function (potId, winningSide) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.processDelayedPayouts(potId, winningSide)];
        }); });
    };
    DatabaseStorage.prototype.getAllChallengePools = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllChallengePools()];
        }); });
    };
    DatabaseStorage.prototype.getSideBet = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getSideBet(id)];
        }); });
    };
    DatabaseStorage.prototype.getSideBetsByPot = function (challengePoolId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getSideBetsByPot(challengePoolId)];
        }); });
    };
    DatabaseStorage.prototype.getSideBetsByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getSideBetsByUser(userId)];
        }); });
    };
    DatabaseStorage.prototype.createSideBet = function (insertBet) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createSideBet(insertBet)];
        }); });
    };
    DatabaseStorage.prototype.updateSideBet = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateSideBet(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.getLedgerByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getLedgerByUser(userId)];
        }); });
    };
    DatabaseStorage.prototype.getResolutionByPot = function (challengePoolId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getResolutionByPot(challengePoolId)];
        }); });
    };
    DatabaseStorage.prototype.getTeamsByOperator = function (operatorId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamsByOperator(operatorId)];
        }); });
    };
    DatabaseStorage.prototype.getTeamsByHall = function (hallId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamsByHall(hallId)];
        }); });
    };
    DatabaseStorage.prototype.removeTeamPlayer = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.removeTeamPlayer(id)];
        }); });
    };
    DatabaseStorage.prototype.getTeamMatchesByOperator = function (operatorId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamMatchesByOperator(operatorId)];
        }); });
    };
    DatabaseStorage.prototype.getAllTeamChallenges = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllTeamChallenges()];
        }); });
    };
    DatabaseStorage.prototype.getTeamChallengesByOperator = function (operatorId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamChallengesByOperator(operatorId)];
        }); });
    };
    DatabaseStorage.prototype.getTeamChallengesByType = function (challengeType) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamChallengesByType(challengeType)];
        }); });
    };
    DatabaseStorage.prototype.getTeamChallengesByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamChallengesByStatus(status)];
        }); });
    };
    DatabaseStorage.prototype.acceptTeamChallenge = function (challengeId, acceptingTeamId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.acceptTeamChallenge(challengeId, acceptingTeamId)];
        }); });
    };
    DatabaseStorage.prototype.calculateTeamChallengeStake = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).calculateTeamChallengeStake.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.validateProMembership = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.validateProMembership(playerId)];
        }); });
    };
    DatabaseStorage.prototype.createTeamChallengeWithParticipants = function (challengeData, teamPlayers) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.memStorage.createTeamChallengeWithParticipants(challengeData, teamPlayers)];
            });
        });
    };
    DatabaseStorage.prototype.getTeamRegistrationsByDivision = function (divisionId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTeamRegistrationsByDivision(divisionId)];
        }); });
    };
    DatabaseStorage.prototype.checkinUser = function (data) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.checkinUser(data)];
        }); });
    };
    DatabaseStorage.prototype.getCheckinsBySession = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getCheckinsBySession(sessionId)];
        }); });
    };
    DatabaseStorage.prototype.getCheckinsByVenue = function (venueId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getCheckinsByVenue(venueId)];
        }); });
    };
    DatabaseStorage.prototype.getActiveCheckins = function (sessionId, venueId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveCheckins(sessionId, venueId)];
        }); });
    };
    DatabaseStorage.prototype.getActiveVotes = function (sessionId, venueId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveVotes(sessionId, venueId)];
        }); });
    };
    DatabaseStorage.prototype.closeAttitudeVote = function (id, result) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.closeAttitudeVote(id, result)];
        }); });
    };
    DatabaseStorage.prototype.getBallotsByVote = function (voteId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getBallotsByVote(voteId)];
        }); });
    };
    DatabaseStorage.prototype.hasUserVoted = function (voteId, userId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.hasUserVoted(voteId, userId)];
        }); });
    };
    DatabaseStorage.prototype.calculateVoteWeights = function (voteId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.calculateVoteWeights(voteId)];
        }); });
    };
    DatabaseStorage.prototype.checkVoteQuorum = function (voteId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.checkVoteQuorum(voteId)];
        }); });
    };
    DatabaseStorage.prototype.getIncidentsByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getIncidentsByUser(userId)];
        }); });
    };
    DatabaseStorage.prototype.getRecentIncidents = function (venueId, hours) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getRecentIncidents(venueId, hours)];
        }); });
    };
    DatabaseStorage.prototype.canUserBeVotedOn = function (userId, sessionId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.canUserBeVotedOn(userId, sessionId)];
        }); });
    };
    DatabaseStorage.prototype.getLastVoteForUser = function (userId, sessionId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getLastVoteForUser(userId, sessionId)];
        }); });
    };
    DatabaseStorage.prototype.isUserImmune = function (userId, sessionId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.isUserImmune(userId, sessionId)];
        }); });
    };
    DatabaseStorage.prototype.getUploadedFileByPath = function (objectPath) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getUploadedFileByPath(objectPath)];
        }); });
    };
    DatabaseStorage.prototype.getUserUploadedFiles = function (userId, category) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getUserUploadedFiles(userId, category)];
        }); });
    };
    DatabaseStorage.prototype.getAllUploadedFiles = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getAllUploadedFiles()];
        }); });
    };
    DatabaseStorage.prototype.incrementFileDownloadCount = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.incrementFileDownloadCount(id)];
        }); });
    };
    DatabaseStorage.prototype.getUserSharedFiles = function (userId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getUserSharedFiles(userId)];
        }); });
    };
    DatabaseStorage.prototype.getWeightRulesByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getWeightRulesByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getTutoringSessionsByRookie = function (rookieId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTutoringSessionsByRookie(rookieId)];
        }); });
    };
    DatabaseStorage.prototype.getTutoringCreditsByTutor = function (tutorId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getTutoringCreditsByTutor(tutorId)];
        }); });
    };
    DatabaseStorage.prototype.getPlatformEarningsByOperator = function (operatorId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPlatformEarningsByOperator(operatorId)];
        }); });
    };
    DatabaseStorage.prototype.getMembershipEarningsByOperator = function (operatorId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getMembershipEarningsByOperator(operatorId)];
        }); });
    };
    DatabaseStorage.prototype.getIcalFeedTokenByToken = function (token) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getIcalFeedTokenByToken(token)];
        }); });
    };
    DatabaseStorage.prototype.revokeIcalFeedToken = function (id, revokedBy, reason) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.revokeIcalFeedToken(id, revokedBy, reason)];
        }); });
    };
    DatabaseStorage.prototype.markTokenUsed = function (token) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.markTokenUsed(token)];
        }); });
    };
    DatabaseStorage.prototype.cleanupExpiredTokens = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.cleanupExpiredTokens()];
        }); });
    };
    DatabaseStorage.prototype.getPaymentMethodsByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getPaymentMethodsByUser(userId)];
        }); });
    };
    DatabaseStorage.prototype.getDefaultPaymentMethod = function (userId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getDefaultPaymentMethod(userId)];
        }); });
    };
    DatabaseStorage.prototype.setDefaultPaymentMethod = function (userId, paymentMethodId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.setDefaultPaymentMethod(userId, paymentMethodId)];
        }); });
    };
    DatabaseStorage.prototype.deactivatePaymentMethod = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.deactivatePaymentMethod(id)];
        }); });
    };
    DatabaseStorage.prototype.getStakesHoldsByChallenge = function (challengeId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getStakesHoldsByChallenge(challengeId)];
        }); });
    };
    DatabaseStorage.prototype.getStakesHoldsByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getStakesHoldsByStatus(status)];
        }); });
    };
    DatabaseStorage.prototype.getExpiringStakesHolds = function () {
        return __awaiter(this, arguments, void 0, function (hours) {
            if (hours === void 0) { hours = 24; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.memStorage.getExpiringStakesHolds(hours)];
            });
        });
    };
    DatabaseStorage.prototype.captureStakesHold = function (id, reason) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.captureStakesHold(id, reason)];
        }); });
    };
    DatabaseStorage.prototype.releaseStakesHold = function (id, reason) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.releaseStakesHold(id, reason)];
        }); });
    };
    DatabaseStorage.prototype.getNotificationDeliveriesByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getNotificationDeliveriesByUser(userId)];
        }); });
    };
    DatabaseStorage.prototype.getNotificationDeliveriesByChallenge = function (challengeId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getNotificationDeliveriesByChallenge(challengeId)];
        }); });
    };
    DatabaseStorage.prototype.getNotificationDeliveriesByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getNotificationDeliveriesByStatus(status)];
        }); });
    };
    DatabaseStorage.prototype.markNotificationDelivered = function (id, providerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.markNotificationDelivered(id, providerId)];
        }); });
    };
    DatabaseStorage.prototype.markNotificationFailed = function (id, errorMessage) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.markNotificationFailed(id, errorMessage)];
        }); });
    };
    DatabaseStorage.prototype.getDisputeResolutionsByChallenge = function (challengeId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getDisputeResolutionsByChallenge(challengeId)];
        }); });
    };
    DatabaseStorage.prototype.getDisputeResolutionsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getDisputeResolutionsByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getDisputeResolutionsByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getDisputeResolutionsByStatus(status)];
        }); });
    };
    DatabaseStorage.prototype.resolveDispute = function (id, resolution, resolvedBy, action) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.resolveDispute(id, resolution, resolvedBy, action)];
        }); });
    };
    DatabaseStorage.prototype.addDisputeEvidence = function (id, evidenceUrls, evidenceTypes, notes) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.addDisputeEvidence(id, evidenceUrls, evidenceTypes, notes)];
        }); });
    };
    DatabaseStorage.prototype.getActiveCooldowns = function () {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getActiveCooldowns()];
        }); });
    };
    DatabaseStorage.prototype.getExpiringCooldowns = function () {
        return __awaiter(this, arguments, void 0, function (hours) {
            if (hours === void 0) { hours = 24; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.memStorage.getExpiringCooldowns(hours)];
            });
        });
    };
    DatabaseStorage.prototype.liftPlayerCooldown = function (id, liftedBy, reason) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.liftPlayerCooldown(id, liftedBy, reason)];
        }); });
    };
    DatabaseStorage.prototype.checkPlayerEligibility = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.checkPlayerEligibility(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getDeviceAttestationsByPlayer = function (playerId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getDeviceAttestationsByPlayer(playerId)];
        }); });
    };
    DatabaseStorage.prototype.getDeviceAttestationsByChallenge = function (challengeId) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getDeviceAttestationsByChallenge(challengeId)];
        }); });
    };
    DatabaseStorage.prototype.getHighRiskAttestations = function () {
        return __awaiter(this, arguments, void 0, function (threshold) {
            if (threshold === void 0) { threshold = 0.8; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.memStorage.getHighRiskAttestations(threshold)];
            });
        });
    };
    DatabaseStorage.prototype.getJob = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getJob(id)];
        }); });
    };
    DatabaseStorage.prototype.getJobsByType = function (jobType) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getJobsByType(jobType)];
        }); });
    };
    DatabaseStorage.prototype.getJobsByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getJobsByStatus(status)];
        }); });
    };
    DatabaseStorage.prototype.getPendingJobs = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.memStorage.getPendingJobs(limit)];
            });
        });
    };
    DatabaseStorage.prototype.getFailedJobs = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.memStorage.getFailedJobs(limit)];
            });
        });
    };
    DatabaseStorage.prototype.createJob = function (insertJob) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.createJob(insertJob)];
        }); });
    };
    DatabaseStorage.prototype.updateJob = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.updateJob(id, updates)];
        }); });
    };
    DatabaseStorage.prototype.markJobStarted = function (id, processedBy) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.markJobStarted(id, processedBy)];
        }); });
    };
    DatabaseStorage.prototype.markJobCompleted = function (id, result) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.markJobCompleted(id, result)];
        }); });
    };
    DatabaseStorage.prototype.markJobFailed = function (id, errorMessage) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.markJobFailed(id, errorMessage)];
        }); });
    };
    DatabaseStorage.prototype.requeueJob = function (id) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.requeueJob(id)];
        }); });
    };
    DatabaseStorage.prototype.cleanupCompletedJobs = function () {
        return __awaiter(this, arguments, void 0, function (olderThanDays) {
            if (olderThanDays === void 0) { olderThanDays = 7; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.memStorage.cleanupCompletedJobs(olderThanDays)];
            });
        });
    };
    DatabaseStorage.prototype.getSystemMetricsByTimeWindow = function (windowStart, windowEnd, metricType) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.getSystemMetricsByTimeWindow(windowStart, windowEnd, metricType)];
        }); });
    };
    DatabaseStorage.prototype.aggregateMetrics = function (metricType, timeWindow, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, this.memStorage.aggregateMetrics(metricType, timeWindow, startDate, endDate)];
        }); });
    };
    DatabaseStorage.prototype.getPrizePool = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).getPrizePool.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.getPrizePoolByPoolId = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).getPrizePoolByPoolId.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.getPrizePoolsByHall = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).getPrizePoolsByHall.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.getPrizePoolsByPeriod = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).getPrizePoolsByPeriod.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.getPrizePoolsByStatus = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).getPrizePoolsByStatus.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.createPrizePool = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).createPrizePool.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.updatePrizePool = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).updatePrizePool.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.lockPrizePool = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).lockPrizePool.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.getPrizePoolContribution = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).getPrizePoolContribution.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.getPrizePoolContributionsByPoolId = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).getPrizePoolContributionsByPoolId.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.getPrizePoolContributionsByPlayer = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).getPrizePoolContributionsByPlayer.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.createPrizePoolContribution = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).createPrizePoolContribution.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.aggregatePrizePoolContributions = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).aggregatePrizePoolContributions.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.getPrizePoolDistribution = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).getPrizePoolDistribution.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.getPrizePoolDistributionsByPoolId = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).getPrizePoolDistributionsByPoolId.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.getPrizePoolDistributionsByRecipient = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).getPrizePoolDistributionsByRecipient.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.getPrizePoolDistributionsByStatus = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).getPrizePoolDistributionsByStatus.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.createPrizePoolDistribution = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).createPrizePoolDistribution.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.updatePrizePoolDistribution = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).updatePrizePoolDistribution.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.markDistributionCompleted = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).markDistributionCompleted.apply(_a, args)];
            });
        });
    };
    DatabaseStorage.prototype.markDistributionFailed = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                return [2 /*return*/, (_a = this.memStorage).markDistributionFailed.apply(_a, args)];
            });
        });
    };
    // === BAN APPEALS (persisted in database via Drizzle ORM) ===
    DatabaseStorage.prototype.getBanAppeal = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.banAppeals).where((0, drizzle_orm_1.eq)(schema_1.banAppeals.id, id))];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.getBanAppealsByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.banAppeals).where((0, drizzle_orm_1.eq)(schema_1.banAppeals.userId, userId)).orderBy((0, drizzle_orm_1.desc)(schema_1.banAppeals.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getBanAppealsByStatus = function (status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.banAppeals).where((0, drizzle_orm_1.eq)(schema_1.banAppeals.status, status)).orderBy((0, drizzle_orm_1.desc)(schema_1.banAppeals.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.getAllBanAppeals = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.select().from(schema_1.banAppeals).orderBy((0, drizzle_orm_1.desc)(schema_1.banAppeals.createdAt))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    DatabaseStorage.prototype.createBanAppeal = function (appeal) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.insert(schema_1.banAppeals).values(appeal).returning()];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0]];
                }
            });
        });
    };
    DatabaseStorage.prototype.updateBanAppeal = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db_1.db.update(schema_1.banAppeals).set(updates).where((0, drizzle_orm_1.eq)(schema_1.banAppeals.id, id)).returning()];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results[0]];
                }
            });
        });
    };
    return DatabaseStorage;
}());
exports.DatabaseStorage = DatabaseStorage;
exports.storage = new DatabaseStorage();
var templateObject_1, templateObject_2, templateObject_3;
