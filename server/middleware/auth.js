"use strict";
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
exports.checkAccountStatus = exports.requireAnyAuth = exports.requireOperator = exports.requireStaffOrOwner = exports.requireOwner = exports.requireRole = void 0;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateTwoFactorSecret = generateTwoFactorSecret;
exports.verifyTwoFactor = verifyTwoFactor;
exports.checkAccountLockout = checkAccountLockout;
exports.incrementLoginAttempts = incrementLoginAttempts;
exports.resetLoginAttempts = resetLoginAttempts;
exports.createUserSession = createUserSession;
var bcryptjs_1 = require("bcryptjs");
var speakeasy_1 = require("speakeasy");
var storage_1 = require("../storage");
// Password hashing utilities
function hashPassword(password) {
    return __awaiter(this, void 0, void 0, function () {
        var saltRounds;
        return __generator(this, function (_a) {
            saltRounds = 12;
            return [2 /*return*/, bcryptjs_1.default.hash(password, saltRounds)];
        });
    });
}
function verifyPassword(password, hash) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, bcryptjs_1.default.compare(password, hash)];
        });
    });
}
// 2FA utilities
function generateTwoFactorSecret() {
    return speakeasy_1.default.generateSecret({ name: "Action Ladder" }).base32;
}
function verifyTwoFactor(token, secret) {
    return speakeasy_1.default.totp.verify({
        secret: secret,
        encoding: "base32",
        token: token,
        window: 1, // Allow 1 step before/after for clock drift
    });
}
// Role-based middleware
var requireRole = function (allowedRoles) {
    return function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
        var user, dbUser, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 8, , 9]);
                    if (!req.isAuthenticated()) {
                        return [2 /*return*/, res.status(401).json({ message: "Authentication required" })];
                    }
                    user = req.user;
                    dbUser = void 0;
                    if (!((_a = user.claims) === null || _a === void 0 ? void 0 : _a.sub)) return [3 /*break*/, 2];
                    return [4 /*yield*/, storage_1.storage.getUser(user.claims.sub)];
                case 1:
                    dbUser = _b.sent();
                    return [3 /*break*/, 4];
                case 2:
                    if (!user.id) return [3 /*break*/, 4];
                    return [4 /*yield*/, storage_1.storage.getUser(user.id)];
                case 3:
                    dbUser = _b.sent();
                    _b.label = 4;
                case 4:
                    if (!dbUser) {
                        return [2 /*return*/, res.status(403).json({ message: "Insufficient permissions" })];
                    }
                    if (dbUser.accountStatus === "banned") {
                        req.logout(function () { });
                        return [2 /*return*/, res.status(403).json({
                                message: "Your account has been banned.",
                                accountBanned: true,
                                banReason: dbUser.banReason || "No reason provided.",
                            })];
                    }
                    if (!(dbUser.accountStatus === "suspended")) return [3 /*break*/, 7];
                    if (!(dbUser.banExpiresAt && new Date(dbUser.banExpiresAt) < new Date())) return [3 /*break*/, 6];
                    return [4 /*yield*/, storage_1.storage.updateUser(dbUser.id, {
                            accountStatus: "active",
                            banReason: null,
                            bannedAt: null,
                            bannedBy: null,
                            banExpiresAt: null,
                        })];
                case 5:
                    _b.sent();
                    return [3 /*break*/, 7];
                case 6:
                    req.logout(function () { });
                    return [2 /*return*/, res.status(403).json({
                            message: "Your account is suspended.",
                            accountSuspended: true,
                            banReason: dbUser.banReason || "No reason provided.",
                            banExpiresAt: dbUser.banExpiresAt,
                        })];
                case 7:
                    if (!allowedRoles.includes(dbUser.globalRole)) {
                        return [2 /*return*/, res.status(403).json({ message: "Insufficient permissions" })];
                    }
                    req.dbUser = dbUser;
                    return [2 /*return*/, next()];
                case 8:
                    error_1 = _b.sent();
                    return [2 /*return*/, res.status(500).json({ message: "Authorization check failed" })];
                case 9: return [2 /*return*/];
            }
        });
    }); };
};
exports.requireRole = requireRole;
exports.requireOwner = (0, exports.requireRole)(["OWNER"]);
exports.requireStaffOrOwner = (0, exports.requireRole)(["STAFF", "OWNER"]);
exports.requireOperator = (0, exports.requireRole)(["OPERATOR"]);
exports.requireAnyAuth = (0, exports.requireRole)(["OWNER", "STAFF", "OPERATOR", "PLAYER"]);
// Account status check middleware — runs AFTER isAuthenticated
var checkAccountStatus = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var user, userId, dbUser, error_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                user = req.user;
                if (!user)
                    return [2 /*return*/, next()];
                userId = ((_a = user.claims) === null || _a === void 0 ? void 0 : _a.sub) || user.id;
                if (!userId)
                    return [2 /*return*/, next()];
                return [4 /*yield*/, storage_1.storage.getUser(userId)];
            case 1:
                dbUser = _b.sent();
                if (!dbUser)
                    return [2 /*return*/, next()];
                if (dbUser.accountStatus === "banned") {
                    req.logout(function () { });
                    return [2 /*return*/, res.status(403).json({
                            message: "Your account has been banned.",
                            accountBanned: true,
                            banReason: dbUser.banReason || "No reason provided.",
                        })];
                }
                if (!(dbUser.accountStatus === "suspended")) return [3 /*break*/, 4];
                if (!(dbUser.banExpiresAt && new Date(dbUser.banExpiresAt) < new Date())) return [3 /*break*/, 3];
                return [4 /*yield*/, storage_1.storage.updateUser(dbUser.id, {
                        accountStatus: "active",
                        banReason: null,
                        bannedAt: null,
                        bannedBy: null,
                        banExpiresAt: null,
                    })];
            case 2:
                _b.sent();
                return [2 /*return*/, next()];
            case 3:
                req.logout(function () { });
                return [2 /*return*/, res.status(403).json({
                        message: "Your account is suspended.",
                        accountSuspended: true,
                        banReason: dbUser.banReason || "No reason provided.",
                        banExpiresAt: dbUser.banExpiresAt,
                    })];
            case 4: return [2 /*return*/, next()];
            case 5:
                error_2 = _b.sent();
                return [2 /*return*/, next()];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.checkAccountStatus = checkAccountStatus;
// Account lockout utilities
var MAX_LOGIN_ATTEMPTS = 5;
var LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
function checkAccountLockout(email) {
    return __awaiter(this, void 0, void 0, function () {
        var user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, storage_1.storage.getUserByEmail(email)];
                case 1:
                    user = _a.sent();
                    if (!user)
                        return [2 /*return*/, false];
                    if (user.lockedUntil && user.lockedUntil > new Date()) {
                        return [2 /*return*/, true]; // Account is locked
                    }
                    return [2 /*return*/, false];
            }
        });
    });
}
function incrementLoginAttempts(email) {
    return __awaiter(this, void 0, void 0, function () {
        var user, attempts, lockUntil;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, storage_1.storage.getUserByEmail(email)];
                case 1:
                    user = _a.sent();
                    if (!user)
                        return [2 /*return*/];
                    attempts = (user.loginAttempts || 0) + 1;
                    lockUntil = attempts >= MAX_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCKOUT_DURATION) : undefined;
                    return [4 /*yield*/, storage_1.storage.updateUser(user.id, {
                            loginAttempts: attempts,
                            lockedUntil: lockUntil,
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function resetLoginAttempts(email) {
    return __awaiter(this, void 0, void 0, function () {
        var user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, storage_1.storage.getUserByEmail(email)];
                case 1:
                    user = _a.sent();
                    if (!user)
                        return [2 /*return*/];
                    return [4 /*yield*/, storage_1.storage.updateUser(user.id, {
                            loginAttempts: 0,
                            lockedUntil: undefined,
                            lastLoginAt: new Date(),
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Session management for password auth
function createUserSession(user) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        globalRole: user.globalRole,
        authType: "password",
    };
}
