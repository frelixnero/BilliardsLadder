"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
exports.REWARDS = void 0;
exports.award = award;
exports.deduct = deduct;
exports.extendStreak = extendStreak;
exports.recordLogin = recordLogin;
exports.recordMatchWin = recordMatchWin;
exports.getRackPointsState = getRackPointsState;
exports.getLedger = getLedger;
var db_1 = require("../config/db");
var schema_1 = require("@shared/schema");
var drizzle_orm_1 = require("drizzle-orm");
/**
 * Returns today's date in UTC as a YYYY-MM-DD string.
 * Used as the streak day key — chosen so streaks behave identically
 * for every user regardless of their local timezone.
 */
function utcDateString(d) {
    if (d === void 0) { d = new Date(); }
    return d.toISOString().slice(0, 10);
}
/**
 * Difference in calendar days between two YYYY-MM-DD strings (UTC).
 * Returns positive if `b` is after `a`.
 */
function daysBetween(a, b) {
    var ms = Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z");
    return Math.round(ms / 86400000);
}
/**
 * Award points to a user. Atomic: balance + ledger update together.
 * Returns the new state, or null if the userId was missing or the user doesn't exist.
 */
function award(userId_1, amount_1, reason_1) {
    return __awaiter(this, arguments, void 0, function (userId, amount, reason, opts) {
        var delta, err_1;
        var _this = this;
        if (opts === void 0) { opts = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!userId || !Number.isFinite(amount) || amount === 0)
                        return [2 /*return*/, null];
                    delta = Math.trunc(amount);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, db_1.db.transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var current, newBalance, inserted, updated;
                            var _a, _b, _c;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0: return [4 /*yield*/, tx
                                            .select({
                                            rackPoints: schema_1.users.rackPoints,
                                            streakDays: schema_1.users.streakDays,
                                            streakLastDay: schema_1.users.streakLastDay,
                                        })
                                            .from(schema_1.users)
                                            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
                                            .for("update")];
                                    case 1:
                                        current = (_d.sent())[0];
                                        if (!current)
                                            return [2 /*return*/, null];
                                        newBalance = current.rackPoints + delta;
                                        return [4 /*yield*/, tx
                                                .insert(schema_1.rackPointsLedger)
                                                .values({
                                                userId: userId,
                                                delta: delta,
                                                balanceAfter: newBalance,
                                                reason: reason,
                                                refType: (_a = opts.refType) !== null && _a !== void 0 ? _a : null,
                                                refId: (_b = opts.refId) !== null && _b !== void 0 ? _b : null,
                                                metadata: (_c = opts.metadata) !== null && _c !== void 0 ? _c : null,
                                            })
                                                .onConflictDoNothing()
                                                .returning({ id: schema_1.rackPointsLedger.id })];
                                    case 2:
                                        inserted = _d.sent();
                                        if (inserted.length === 0) {
                                            // Already awarded for this event — return current state, no balance change.
                                            return [2 /*return*/, {
                                                    rackPoints: current.rackPoints,
                                                    streakDays: current.streakDays,
                                                    streakLastDay: current.streakLastDay,
                                                }];
                                        }
                                        return [4 /*yield*/, tx
                                                .update(schema_1.users)
                                                .set({ rackPoints: newBalance })
                                                .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
                                                .returning({
                                                rackPoints: schema_1.users.rackPoints,
                                                streakDays: schema_1.users.streakDays,
                                                streakLastDay: schema_1.users.streakLastDay,
                                            })];
                                    case 3:
                                        updated = (_d.sent())[0];
                                        return [2 /*return*/, updated
                                                ? {
                                                    rackPoints: updated.rackPoints,
                                                    streakDays: updated.streakDays,
                                                    streakLastDay: updated.streakLastDay,
                                                }
                                                : null];
                                }
                            });
                        }); })];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    err_1 = _a.sent();
                    console.warn("[rackPoints.award] failed for user ".concat(userId, ":"), err_1 === null || err_1 === void 0 ? void 0 : err_1.message);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Deduct points from a user. Reserved for the future spending menu.
 * Returns the new state, or null if balance is insufficient or user is missing.
 *
 * Phase 1: stubbed but unused — the redemption store comes in Phase 2.
 */
function deduct(userId_1, amount_1, reason_1) {
    return __awaiter(this, arguments, void 0, function (userId, amount, reason, opts) {
        var cost, err_2;
        var _this = this;
        if (opts === void 0) { opts = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!userId || !Number.isFinite(amount) || amount <= 0)
                        return [2 /*return*/, null];
                    cost = Math.trunc(amount);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, db_1.db.transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var current, updated;
                            var _a, _b, _c;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0: return [4 /*yield*/, tx
                                            .select({ rackPoints: schema_1.users.rackPoints })
                                            .from(schema_1.users)
                                            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
                                            .for("update")];
                                    case 1:
                                        current = (_d.sent())[0];
                                        if (!current || current.rackPoints < cost)
                                            return [2 /*return*/, null];
                                        return [4 /*yield*/, tx
                                                .update(schema_1.users)
                                                .set({ rackPoints: (0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " - ", ""], ["", " - ", ""])), schema_1.users.rackPoints, cost) })
                                                .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
                                                .returning({
                                                rackPoints: schema_1.users.rackPoints,
                                                streakDays: schema_1.users.streakDays,
                                                streakLastDay: schema_1.users.streakLastDay,
                                            })];
                                    case 2:
                                        updated = (_d.sent())[0];
                                        if (!updated)
                                            return [2 /*return*/, null];
                                        return [4 /*yield*/, tx.insert(schema_1.rackPointsLedger).values({
                                                userId: userId,
                                                delta: -cost,
                                                balanceAfter: updated.rackPoints,
                                                reason: reason,
                                                refType: (_a = opts.refType) !== null && _a !== void 0 ? _a : null,
                                                refId: (_b = opts.refId) !== null && _b !== void 0 ? _b : null,
                                                metadata: (_c = opts.metadata) !== null && _c !== void 0 ? _c : null,
                                            })];
                                    case 3:
                                        _d.sent();
                                        return [2 /*return*/, {
                                                rackPoints: updated.rackPoints,
                                                streakDays: updated.streakDays,
                                                streakLastDay: updated.streakLastDay,
                                            }];
                                }
                            });
                        }); })];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    err_2 = _a.sent();
                    console.warn("[rackPoints.deduct] failed for user ".concat(userId, ":"), err_2 === null || err_2 === void 0 ? void 0 : err_2.message);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Extend (or hold or reset) the user's daily login streak.
 *
 *   - "started": user had no prior streak — set to 1
 *   - "extended": last extension was yesterday — increment to N+1
 *   - "held": last extension was already today — no change
 *   - "reset": gap of 2+ days — restart at 1
 *
 * Returns { result, streakDays } so the caller knows whether to award the
 * login bonus (only on "started" or "extended").
 */
function extendStreak(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var today, err_3;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!userId)
                        return [2 /*return*/, null];
                    today = utcDateString();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, db_1.db.transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                            var user, result, newDays, gap;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, tx
                                            .select({
                                            streakDays: schema_1.users.streakDays,
                                            streakLastDay: schema_1.users.streakLastDay,
                                        })
                                            .from(schema_1.users)
                                            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
                                            .for("update")];
                                    case 1:
                                        user = (_a.sent())[0];
                                        if (!user)
                                            return [2 /*return*/, null];
                                        if (!user.streakLastDay) {
                                            result = "started";
                                            newDays = 1;
                                        }
                                        else if (user.streakLastDay === today) {
                                            return [2 /*return*/, { result: "held", streakDays: user.streakDays }];
                                        }
                                        else {
                                            gap = daysBetween(user.streakLastDay, today);
                                            if (gap === 1) {
                                                result = "extended";
                                                newDays = user.streakDays + 1;
                                            }
                                            else {
                                                result = "reset";
                                                newDays = 1;
                                            }
                                        }
                                        return [4 /*yield*/, tx
                                                .update(schema_1.users)
                                                .set({ streakDays: newDays, streakLastDay: today })
                                                .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/, { result: result, streakDays: newDays }];
                                }
                            });
                        }); })];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    err_3 = _a.sent();
                    console.warn("[rackPoints.extendStreak] failed for user ".concat(userId, ":"), err_3 === null || err_3 === void 0 ? void 0 : err_3.message);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Phase 1 reward amounts. Centralized here so future tuning is one-line.
 */
exports.REWARDS = {
    loginStreakBonus: 10,
    matchWin: 50,
    upsetBonus: 50,
};
/**
 * Convenience wrapper called from login flows.
 *
 * Extends the streak (if it's a new day) and awards the login bonus when the
 * streak actually moved forward. Same-day re-logins do nothing.
 *
 * Fire-and-forget — never blocks login.
 */
function recordLogin(userId) {
    var _this = this;
    if (!userId)
        return;
    (function () { return __awaiter(_this, void 0, void 0, function () {
        var streak;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, extendStreak(userId)];
                case 1:
                    streak = _a.sent();
                    if (!streak)
                        return [2 /*return*/];
                    if (!(streak.result === "started" || streak.result === "extended")) return [3 /*break*/, 3];
                    return [4 /*yield*/, award(userId, exports.REWARDS.loginStreakBonus, "login_streak", {
                            metadata: { streakDays: streak.streakDays, result: streak.result },
                        })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); })().catch(function (err) {
        console.warn("[rackPoints.recordLogin] failed for user ".concat(userId, ":"), err === null || err === void 0 ? void 0 : err.message);
    });
}
/**
 * Convenience wrapper called from match completion flows.
 *
 * Awards the win and (if the loser was higher-rated) the upset bonus.
 * Fire-and-forget — never blocks the match-completion request.
 */
function recordMatchWin(opts) {
    var _this = this;
    if (!opts.winnerUserId)
        return;
    (function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, award(opts.winnerUserId, exports.REWARDS.matchWin, "match_win", {
                        refType: "match",
                        refId: (_a = opts.matchId) !== null && _a !== void 0 ? _a : null,
                    })];
                case 1:
                    _c.sent();
                    if (!(typeof opts.winnerRating === "number" &&
                        typeof opts.loserRating === "number" &&
                        opts.loserRating > opts.winnerRating)) return [3 /*break*/, 3];
                    return [4 /*yield*/, award(opts.winnerUserId, exports.REWARDS.upsetBonus, "upset_bonus", {
                            refType: "match",
                            refId: (_b = opts.matchId) !== null && _b !== void 0 ? _b : null,
                            metadata: { winnerRating: opts.winnerRating, loserRating: opts.loserRating },
                        })];
                case 2:
                    _c.sent();
                    _c.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); })().catch(function (err) {
        console.warn("[rackPoints.recordMatchWin] failed:", err === null || err === void 0 ? void 0 : err.message);
    });
}
/**
 * Read-only state fetcher for the UI badge.
 */
function getRackPointsState(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var row, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db_1.db
                            .select({
                            rackPoints: schema_1.users.rackPoints,
                            streakDays: schema_1.users.streakDays,
                            streakLastDay: schema_1.users.streakLastDay,
                        })
                            .from(schema_1.users)
                            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
                            .limit(1)];
                case 1:
                    row = (_a.sent())[0];
                    return [2 /*return*/, row !== null && row !== void 0 ? row : null];
                case 2:
                    err_4 = _a.sent();
                    console.warn("[rackPoints.getRackPointsState] failed for user ".concat(userId, ":"), err_4 === null || err_4 === void 0 ? void 0 : err_4.message);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Recent ledger entries for a user — used by the admin tools and (later) the
 * player's own activity feed.
 */
function getLedger(userId_1) {
    return __awaiter(this, arguments, void 0, function (userId, limit) {
        var err_5;
        if (limit === void 0) { limit = 50; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, db_1.db
                            .select()
                            .from(schema_1.rackPointsLedger)
                            .where((0, drizzle_orm_1.eq)(schema_1.rackPointsLedger.userId, userId))
                            .orderBy((0, drizzle_orm_1.desc)(schema_1.rackPointsLedger.createdAt))
                            .limit(limit)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    err_5 = _a.sent();
                    console.warn("[rackPoints.getLedger] failed for user ".concat(userId, ":"), err_5 === null || err_5 === void 0 ? void 0 : err_5.message);
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
var templateObject_1;
