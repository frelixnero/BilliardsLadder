"use strict";
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOperator = void 0;
exports.generateAppealToken = generateAppealToken;
exports.verifyAppealToken = verifyAppealToken;
exports.login = login;
exports.createOwner = createOwner;
exports.signupOperator = signupOperator;
exports.signupPlayer = signupPlayer;
exports.getCurrentUser = getCurrentUser;
exports.logout = logout;
exports.changePassword = changePassword;
exports.authMe = authMe;
exports.authSuccess = authSuccess;
exports.assignRole = assignRole;
exports.verifyEmail = verifyEmail;
exports.resendVerification = resendVerification;
var crypto_1 = require("crypto");
var storage_1 = require("../storage");
var auth_1 = require("../middleware/auth");
var schema_1 = require("@shared/schema");
var email_service_1 = require("../services/email-service");
var activity_1 = require("../utils/activity");
var rackPointsService_1 = require("../services/rackPointsService");
var APPEAL_TOKEN_SECRET = process.env.SESSION_SECRET || crypto_1.default.randomBytes(32).toString("hex");
var APPEAL_TOKEN_EXPIRY_MS = 30 * 60 * 1000;
function generateAppealToken(userId) {
    var expiresAt = Date.now() + APPEAL_TOKEN_EXPIRY_MS;
    var payload = "".concat(userId, ":").concat(expiresAt);
    var signature = crypto_1.default.createHmac("sha256", APPEAL_TOKEN_SECRET).update(payload).digest("hex");
    return Buffer.from("".concat(payload, ":").concat(signature)).toString("base64");
}
function verifyAppealToken(token) {
    try {
        var decoded = Buffer.from(token, "base64").toString("utf-8");
        var parts = decoded.split(":");
        if (parts.length !== 3)
            return { valid: false };
        var userId = parts[0], expiresAtStr = parts[1], signature = parts[2];
        var expiresAt = parseInt(expiresAtStr, 10);
        if (isNaN(expiresAt) || Date.now() > expiresAt)
            return { valid: false };
        var expectedSig = crypto_1.default.createHmac("sha256", APPEAL_TOKEN_SECRET).update("".concat(userId, ":").concat(expiresAtStr)).digest("hex");
        if (!crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig)))
            return { valid: false };
        return { valid: true, userId: userId };
    }
    catch (_a) {
        return { valid: false };
    }
}
function generateVerificationToken() {
    return crypto_1.default.randomBytes(32).toString("hex");
}
function getAppBaseUrl() {
    var _a, _b, _c;
    var configuredBaseUrl = (_a = process.env.APP_BASE_URL) === null || _a === void 0 ? void 0 : _a.trim();
    if (configuredBaseUrl) {
        return configuredBaseUrl.replace(/\/+$/, "");
    }
    var replitDomain = (_c = (_b = process.env.REPLIT_DOMAINS) === null || _b === void 0 ? void 0 : _b.split(",")[0]) === null || _c === void 0 ? void 0 : _c.trim();
    if (replitDomain) {
        return "https://".concat(replitDomain.replace(/^https?:\/\//, "").replace(/\/+$/, ""));
    }
    return "http://localhost:5000";
}
// Password-based login for all user types
function login(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, email, password, twoFactorCode, user_1, passwordValid, appealToken, appealToken, userSession, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 14, , 15]);
                    _a = schema_1.loginSchema.parse(req.body), email = _a.email, password = _a.password, twoFactorCode = _a.twoFactorCode;
                    return [4 /*yield*/, (0, auth_1.checkAccountLockout)(email)];
                case 1:
                    // Check if account is locked
                    if (_b.sent()) {
                        return [2 /*return*/, res.status(423).json({
                                message: "Account temporarily locked due to multiple failed login attempts"
                            })];
                    }
                    return [4 /*yield*/, storage_1.storage.getUserByEmail(email)];
                case 2:
                    user_1 = _b.sent();
                    if (!(!user_1 || !user_1.passwordHash)) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, auth_1.incrementLoginAttempts)(email)];
                case 3:
                    _b.sent();
                    return [2 /*return*/, res.status(401).json({ message: "Invalid email or password" })];
                case 4: return [4 /*yield*/, (0, auth_1.verifyPassword)(password, user_1.passwordHash)];
                case 5:
                    passwordValid = _b.sent();
                    if (!!passwordValid) return [3 /*break*/, 7];
                    return [4 /*yield*/, (0, auth_1.incrementLoginAttempts)(email)];
                case 6:
                    _b.sent();
                    return [2 /*return*/, res.status(401).json({ message: "Invalid email or password" })];
                case 7:
                    // Check ban/suspension status
                    if (user_1.accountStatus === "banned") {
                        appealToken = generateAppealToken(user_1.id);
                        return [2 /*return*/, res.status(403).json({
                                message: "Your account has been banned.",
                                accountBanned: true,
                                userId: user_1.id,
                                appealToken: appealToken,
                                banReason: user_1.banReason || "No reason provided.",
                            })];
                    }
                    if (!(user_1.accountStatus === "suspended")) return [3 /*break*/, 10];
                    if (!(user_1.banExpiresAt && new Date(user_1.banExpiresAt) < new Date())) return [3 /*break*/, 9];
                    return [4 /*yield*/, storage_1.storage.updateUser(user_1.id, {
                            accountStatus: "active",
                            banReason: null,
                            bannedAt: null,
                            bannedBy: null,
                            banExpiresAt: null,
                        })];
                case 8:
                    _b.sent();
                    return [3 /*break*/, 10];
                case 9:
                    appealToken = generateAppealToken(user_1.id);
                    return [2 /*return*/, res.status(403).json({
                            message: "Your account is suspended.",
                            accountSuspended: true,
                            userId: user_1.id,
                            appealToken: appealToken,
                            banReason: user_1.banReason || "No reason provided.",
                            banExpiresAt: user_1.banExpiresAt,
                        })];
                case 10:
                    // Check email verification (skip for OWNER/STAFF who are created by admins)
                    if (user_1.emailVerified === false && user_1.globalRole !== "OWNER" && user_1.globalRole !== "STAFF") {
                        return [2 /*return*/, res.status(403).json({
                                message: "Please verify your email address before logging in.",
                                emailNotVerified: true,
                                email: user_1.email,
                            })];
                    }
                    if (!(user_1.twoFactorEnabled && user_1.twoFactorSecret)) return [3 /*break*/, 12];
                    if (!twoFactorCode) {
                        return [2 /*return*/, res.status(200).json({ requires2FA: true })];
                    }
                    if (!!(0, auth_1.verifyTwoFactor)(twoFactorCode, user_1.twoFactorSecret)) return [3 /*break*/, 12];
                    return [4 /*yield*/, (0, auth_1.incrementLoginAttempts)(email)];
                case 11:
                    _b.sent();
                    return [2 /*return*/, res.status(401).json({ message: "Invalid two-factor code" })];
                case 12: 
                // Reset login attempts and create session
                return [4 /*yield*/, (0, auth_1.resetLoginAttempts)(email)];
                case 13:
                    // Reset login attempts and create session
                    _b.sent();
                    userSession = (0, auth_1.createUserSession)(user_1);
                    req.login(userSession, function (err) {
                        if (err) {
                            return res.status(500).json({ message: "Login failed" });
                        }
                        (0, activity_1.touchUserActivity)(storage_1.storage, user_1.id);
                        (0, rackPointsService_1.recordLogin)(user_1.id);
                        res.json({
                            user: {
                                id: user_1.id,
                                email: user_1.email,
                                name: user_1.name,
                                globalRole: user_1.globalRole,
                                hallName: user_1.hallName,
                                city: user_1.city,
                                state: user_1.state
                            }
                        });
                    });
                    return [3 /*break*/, 15];
                case 14:
                    error_1 = _b.sent();
                    res.status(400).json({ message: error_1.message });
                    return [3 /*break*/, 15];
                case 15: return [2 /*return*/];
            }
        });
    });
}
// Creator/Owner account creation (admin only)
function createOwner(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var userData, existingUser, passwordHash, twoFactorSecret, newUser, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    userData = schema_1.createOwnerSchema.parse(req.body);
                    return [4 /*yield*/, storage_1.storage.getUserByEmail(userData.email)];
                case 1:
                    existingUser = _a.sent();
                    if (existingUser) {
                        return [2 /*return*/, res.status(409).json({ message: "Email already registered" })];
                    }
                    return [4 /*yield*/, (0, auth_1.hashPassword)(userData.password)];
                case 2:
                    passwordHash = _a.sent();
                    twoFactorSecret = void 0;
                    if (userData.twoFactorEnabled) {
                        twoFactorSecret = (0, auth_1.generateTwoFactorSecret)();
                    }
                    return [4 /*yield*/, storage_1.storage.createUser({
                            email: userData.email,
                            name: userData.name,
                            globalRole: "OWNER",
                            passwordHash: passwordHash,
                            twoFactorEnabled: userData.twoFactorEnabled,
                            twoFactorSecret: twoFactorSecret,
                            phoneNumber: userData.phoneNumber,
                            accountStatus: "active",
                            onboardingComplete: true,
                            profileComplete: true,
                        })];
                case 3:
                    newUser = _a.sent();
                    res.status(201).json(__assign({ user: {
                            id: newUser.id,
                            email: newUser.email,
                            name: newUser.name,
                            globalRole: newUser.globalRole,
                        } }, (twoFactorSecret && { twoFactorSecret: twoFactorSecret })));
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    res.status(400).json({ message: error_2.message });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Operator signup (public)
function signupOperator(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var operatorData, existingUser, passwordHash, verificationToken, verificationTokenExpiry, newUser, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    operatorData = schema_1.createOperatorSchema.parse(req.body);
                    return [4 /*yield*/, storage_1.storage.getUserByEmail(operatorData.email)];
                case 1:
                    existingUser = _a.sent();
                    if (existingUser) {
                        return [2 /*return*/, res.status(409).json({ message: "Email already registered" })];
                    }
                    return [4 /*yield*/, (0, auth_1.hashPassword)(operatorData.password)];
                case 2:
                    passwordHash = _a.sent();
                    verificationToken = generateVerificationToken();
                    verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    return [4 /*yield*/, storage_1.storage.createUser({
                            email: operatorData.email,
                            name: operatorData.name,
                            globalRole: "OPERATOR",
                            passwordHash: passwordHash,
                            hallName: operatorData.hallName,
                            city: operatorData.city,
                            state: operatorData.state,
                            subscriptionTier: operatorData.subscriptionTier,
                            accountStatus: "active",
                            emailVerified: false,
                            verificationToken: verificationToken,
                            verificationTokenExpiry: verificationTokenExpiry,
                            onboardingComplete: false,
                            profileComplete: false,
                        })];
                case 3:
                    newUser = _a.sent();
                    (0, activity_1.touchUserActivity)(storage_1.storage, newUser.id);
                    email_service_1.emailService.sendVerificationEmail(operatorData.email, verificationToken, operatorData.name, getAppBaseUrl()).catch(function (err) { return console.error("Failed to send verification email:", err); });
                    res.status(201).json({
                        user: {
                            id: newUser.id,
                            email: newUser.email,
                            name: newUser.name,
                            globalRole: newUser.globalRole,
                            hallName: newUser.hallName,
                            subscriptionTier: newUser.subscriptionTier,
                        },
                        message: "Account created! Please check your email to verify your address before logging in.",
                        requiresVerification: true,
                    });
                    return [3 /*break*/, 5];
                case 4:
                    error_3 = _a.sent();
                    res.status(400).json({ message: error_3.message });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Player signup (public)
function signupPlayer(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var playerData, existingUser, passwordHash, verificationToken, verificationTokenExpiry, newUser, player, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    playerData = schema_1.createPlayerSchema.parse(req.body);
                    return [4 /*yield*/, storage_1.storage.getUserByEmail(playerData.email)];
                case 1:
                    existingUser = _a.sent();
                    if (existingUser) {
                        return [2 /*return*/, res.status(409).json({ message: "Email already registered" })];
                    }
                    return [4 /*yield*/, (0, auth_1.hashPassword)(playerData.password)];
                case 2:
                    passwordHash = _a.sent();
                    verificationToken = generateVerificationToken();
                    verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    return [4 /*yield*/, storage_1.storage.createUser({
                            email: playerData.email,
                            name: playerData.name,
                            globalRole: "PLAYER",
                            passwordHash: passwordHash,
                            accountStatus: "active",
                            emailVerified: false,
                            verificationToken: verificationToken,
                            verificationTokenExpiry: verificationTokenExpiry,
                            onboardingComplete: false,
                            profileComplete: false,
                        })];
                case 3:
                    newUser = _a.sent();
                    (0, activity_1.touchUserActivity)(storage_1.storage, newUser.id);
                    return [4 /*yield*/, storage_1.storage.createPlayer({
                            name: playerData.name,
                            userId: newUser.id,
                            membershipTier: playerData.membershipTier,
                            isRookie: playerData.tier === "rookie",
                            rookiePassActive: playerData.tier === "rookie",
                        })];
                case 4:
                    player = _a.sent();
                    email_service_1.emailService.sendVerificationEmail(playerData.email, verificationToken, playerData.name, getAppBaseUrl()).catch(function (err) { return console.error("Failed to send verification email:", err); });
                    res.status(201).json({
                        user: {
                            id: newUser.id,
                            email: newUser.email,
                            name: newUser.name,
                            globalRole: newUser.globalRole,
                        },
                        player: {
                            id: player.id,
                            name: player.name,
                            tier: playerData.tier,
                            membershipTier: player.membershipTier,
                        },
                        message: "Account created! Please check your email to verify your address before logging in.",
                        requiresVerification: true,
                    });
                    return [3 /*break*/, 6];
                case 5:
                    error_4 = _a.sent();
                    res.status(400).json({ message: error_4.message });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Get current authenticated user
function getCurrentUser(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var user, dbUser, error_5;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 5, , 6]);
                    if (!req.isAuthenticated()) {
                        return [2 /*return*/, res.status(401).json({ message: "Not authenticated" })];
                    }
                    user = req.user;
                    dbUser = void 0;
                    if (!((_a = user.claims) === null || _a === void 0 ? void 0 : _a.sub)) return [3 /*break*/, 2];
                    return [4 /*yield*/, storage_1.storage.getUser(user.claims.sub)];
                case 1:
                    dbUser = _c.sent();
                    return [3 /*break*/, 4];
                case 2:
                    if (!user.id) return [3 /*break*/, 4];
                    return [4 /*yield*/, storage_1.storage.getUser(user.id)];
                case 3:
                    dbUser = _c.sent();
                    _c.label = 4;
                case 4:
                    if (!dbUser) {
                        return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                    }
                    res.json({
                        id: dbUser.id,
                        email: dbUser.email,
                        name: dbUser.name,
                        globalRole: dbUser.globalRole,
                        hallName: dbUser.hallName,
                        city: dbUser.city,
                        state: dbUser.state,
                        subscriptionTier: dbUser.subscriptionTier,
                        accountStatus: dbUser.accountStatus,
                        onboardingComplete: dbUser.onboardingComplete,
                        emailVerified: (_b = dbUser.emailVerified) !== null && _b !== void 0 ? _b : true,
                    });
                    return [3 /*break*/, 6];
                case 5:
                    error_5 = _c.sent();
                    res.status(500).json({ message: error_5.message });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Logout
function logout(req, res) {
    req.logout(function (err) {
        if (err) {
            return res.status(500).json({ message: "Logout failed" });
        }
        res.json({ message: "Logged out successfully" });
    });
}
// Change password
function changePassword(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, currentPassword, newPassword, user, dbUser, passwordValid, newPasswordHash, error_6;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 8, , 9]);
                    if (!req.isAuthenticated()) {
                        return [2 /*return*/, res.status(401).json({ message: "Not authenticated" })];
                    }
                    _a = req.body, currentPassword = _a.currentPassword, newPassword = _a.newPassword;
                    user = req.user;
                    dbUser = void 0;
                    if (!((_b = user.claims) === null || _b === void 0 ? void 0 : _b.sub)) return [3 /*break*/, 2];
                    return [4 /*yield*/, storage_1.storage.getUser(user.claims.sub)];
                case 1:
                    dbUser = _c.sent();
                    return [3 /*break*/, 4];
                case 2:
                    if (!user.id) return [3 /*break*/, 4];
                    return [4 /*yield*/, storage_1.storage.getUser(user.id)];
                case 3:
                    dbUser = _c.sent();
                    _c.label = 4;
                case 4:
                    if (!dbUser || !dbUser.passwordHash) {
                        return [2 /*return*/, res.status(400).json({ message: "Password change not supported for this account" })];
                    }
                    return [4 /*yield*/, (0, auth_1.verifyPassword)(currentPassword, dbUser.passwordHash)];
                case 5:
                    passwordValid = _c.sent();
                    if (!passwordValid) {
                        return [2 /*return*/, res.status(401).json({ message: "Current password is incorrect" })];
                    }
                    return [4 /*yield*/, (0, auth_1.hashPassword)(newPassword)];
                case 6:
                    newPasswordHash = _c.sent();
                    return [4 /*yield*/, storage_1.storage.updateUser(dbUser.id, {
                            passwordHash: newPasswordHash,
                            loginAttempts: 0,
                            lockedUntil: undefined
                        })];
                case 7:
                    _c.sent();
                    res.json({ message: "Password changed successfully" });
                    return [3 /*break*/, 9];
                case 8:
                    error_6 = _c.sent();
                    res.status(400).json({ message: error_6.message });
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    });
}
// Alias for route naming consistency
exports.createOperator = signupOperator;
function authMe(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var user, dbUser, error_7;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 5, , 6]);
                    if (!req.isAuthenticated()) {
                        return [2 /*return*/, res.status(401).json({ message: "Not authenticated" })];
                    }
                    user = req.user;
                    dbUser = void 0;
                    if (!((_a = user === null || user === void 0 ? void 0 : user.claims) === null || _a === void 0 ? void 0 : _a.sub)) return [3 /*break*/, 2];
                    return [4 /*yield*/, storage_1.storage.getUser(user.claims.sub)];
                case 1:
                    dbUser = _c.sent();
                    return [3 /*break*/, 4];
                case 2:
                    if (!(user === null || user === void 0 ? void 0 : user.id)) return [3 /*break*/, 4];
                    return [4 /*yield*/, storage_1.storage.getUser(user.id)];
                case 3:
                    dbUser = _c.sent();
                    _c.label = 4;
                case 4:
                    if (!dbUser) {
                        return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                    }
                    res.json({
                        id: dbUser.id,
                        email: dbUser.email,
                        name: dbUser.name,
                        globalRole: dbUser.globalRole,
                        hallName: dbUser.hallName,
                        city: dbUser.city,
                        state: dbUser.state,
                        subscriptionTier: dbUser.subscriptionTier,
                        accountStatus: dbUser.accountStatus,
                        onboardingComplete: dbUser.onboardingComplete,
                        emailVerified: (_b = dbUser.emailVerified) !== null && _b !== void 0 ? _b : true,
                    });
                    return [3 /*break*/, 6];
                case 5:
                    error_7 = _c.sent();
                    console.error("Auth me error:", error_7);
                    res.status(500).json({ message: "Server error" });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Replit Auth - Handle auth success callback with role-based routing
function authSuccess(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var session, intendedRole, user, dbUser, globalRole, error_8, error_9;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 9, , 10]);
                    if (!req.isAuthenticated()) {
                        return [2 /*return*/, res.status(401).json({ message: "Not authenticated" })];
                    }
                    session = req.session;
                    intendedRole = session.intendedRole || "player";
                    // Clear the intended role from session
                    delete session.intendedRole;
                    user = req.user;
                    if (!((_a = user === null || user === void 0 ? void 0 : user.claims) === null || _a === void 0 ? void 0 : _a.sub)) return [3 /*break*/, 8];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 7, , 8]);
                    return [4 /*yield*/, storage_1.storage.getUser(user.claims.sub)];
                case 2:
                    dbUser = _b.sent();
                    if (!!dbUser) return [3 /*break*/, 4];
                    return [4 /*yield*/, storage_1.storage.upsertUser({
                            id: user.claims.sub,
                            email: user.claims.email,
                            name: "".concat(user.claims.first_name || "", " ").concat(user.claims.last_name || "").trim() || user.claims.email || "Unknown User",
                        })];
                case 3:
                    // Create user if doesn't exist
                    dbUser = _b.sent();
                    _b.label = 4;
                case 4:
                    globalRole = "PLAYER";
                    if (intendedRole === "admin") {
                        globalRole = "OWNER";
                    }
                    else if (intendedRole === "operator") {
                        globalRole = "STAFF";
                    }
                    if (!(dbUser.globalRole !== globalRole)) return [3 /*break*/, 6];
                    return [4 /*yield*/, storage_1.storage.updateUser(user.claims.sub, { globalRole: globalRole })];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_8 = _b.sent();
                    console.error("Error updating user role:", error_8);
                    return [3 /*break*/, 8];
                case 8:
                    res.json({
                        role: intendedRole,
                        success: true
                    });
                    return [3 /*break*/, 10];
                case 9:
                    error_9 = _b.sent();
                    console.error("Auth success error:", error_9);
                    res.status(500).json({ message: "Authentication error" });
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
// OAuth role assignment
function assignRole(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var user, _a, role, additionalData, dbUser, hallName, city, state, subscriptionTier, city, state, tier, membershipTier, error_10;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 7, , 8]);
                    if (!req.isAuthenticated()) {
                        return [2 /*return*/, res.status(401).json({ message: "Not authenticated" })];
                    }
                    user = req.user;
                    _a = req.body, role = _a.role, additionalData = __rest(_a, ["role"]);
                    if (!["player", "operator"].includes(role)) {
                        return [2 /*return*/, res.status(400).json({ message: "Invalid role" })];
                    }
                    return [4 /*yield*/, storage_1.storage.getUser(user.claims.sub)];
                case 1:
                    dbUser = _b.sent();
                    if (!dbUser) {
                        return [2 /*return*/, res.status(404).json({ message: "User not found" })];
                    }
                    if (!(role === "operator")) return [3 /*break*/, 3];
                    hallName = additionalData.hallName, city = additionalData.city, state = additionalData.state, subscriptionTier = additionalData.subscriptionTier;
                    if (!hallName || !city || !state || !subscriptionTier) {
                        return [2 /*return*/, res.status(400).json({ message: "Missing required operator information" })];
                    }
                    return [4 /*yield*/, storage_1.storage.updateUser(dbUser.id, {
                            globalRole: "OPERATOR",
                            hallName: hallName,
                            city: city,
                            state: state,
                            subscriptionTier: subscriptionTier,
                            accountStatus: "active",
                            onboardingComplete: false,
                            profileComplete: false,
                        })];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 6];
                case 3:
                    city = additionalData.city, state = additionalData.state, tier = additionalData.tier, membershipTier = additionalData.membershipTier;
                    if (!city || !state || !tier) {
                        return [2 /*return*/, res.status(400).json({ message: "Missing required player information" })];
                    }
                    return [4 /*yield*/, storage_1.storage.updateUser(dbUser.id, {
                            globalRole: "PLAYER",
                            city: city,
                            state: state,
                            accountStatus: "active",
                            onboardingComplete: false,
                            profileComplete: false,
                        })];
                case 4:
                    _b.sent();
                    // Create player profile
                    return [4 /*yield*/, storage_1.storage.createPlayer({
                            name: dbUser.name || dbUser.email,
                            userId: dbUser.id,
                            membershipTier: membershipTier || "none",
                            isRookie: tier === "rookie",
                            rookiePassActive: tier === "rookie",
                        })];
                case 5:
                    // Create player profile
                    _b.sent();
                    _b.label = 6;
                case 6:
                    res.json({ success: true, message: "Role assigned successfully" });
                    return [3 /*break*/, 8];
                case 7:
                    error_10 = _b.sent();
                    res.status(500).json({ message: error_10.message });
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function verifyEmail(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var token, user, error_11;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    token = req.query.token;
                    if (!token || typeof token !== "string") {
                        return [2 /*return*/, res.redirect("/verify-email?status=invalid")];
                    }
                    return [4 /*yield*/, storage_1.storage.getUserByVerificationToken(token)];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, res.redirect("/verify-email?status=invalid")];
                    }
                    if (user.verificationTokenExpiry && new Date(user.verificationTokenExpiry) < new Date()) {
                        return [2 /*return*/, res.redirect("/verify-email?status=expired&email=" + encodeURIComponent(user.email))];
                    }
                    return [4 /*yield*/, storage_1.storage.updateUser(user.id, {
                            emailVerified: true,
                            verificationToken: null,
                            verificationTokenExpiry: null,
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, res.redirect("/verify-email?status=success")];
                case 3:
                    error_11 = _a.sent();
                    console.error("Email verification error:", error_11);
                    return [2 /*return*/, res.redirect("/verify-email?status=error")];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function resendVerification(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var email, user, verificationToken, verificationTokenExpiry, error_12;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    email = req.body.email;
                    if (!email) {
                        return [2 /*return*/, res.status(400).json({ message: "Email is required" })];
                    }
                    return [4 /*yield*/, storage_1.storage.getUserByEmail(email)];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        return [2 /*return*/, res.json({ message: "If an account exists with that email, a verification link has been sent." })];
                    }
                    if (user.emailVerified) {
                        return [2 /*return*/, res.json({ message: "Email is already verified. You can log in." })];
                    }
                    verificationToken = generateVerificationToken();
                    verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    return [4 /*yield*/, storage_1.storage.updateUser(user.id, {
                            verificationToken: verificationToken,
                            verificationTokenExpiry: verificationTokenExpiry,
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, email_service_1.emailService.sendVerificationEmail(email, verificationToken, user.name || undefined, getAppBaseUrl())];
                case 3:
                    _a.sent();
                    res.json({ message: "If an account exists with that email, a verification link has been sent." });
                    return [3 /*break*/, 5];
                case 4:
                    error_12 = _a.sent();
                    console.error("Resend verification error:", error_12);
                    res.status(500).json({ message: "Failed to resend verification email" });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
