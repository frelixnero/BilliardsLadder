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
exports.emailService = void 0;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
var mail_1 = require("@sendgrid/mail");
var DEFAULT_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@actionladder.com';
var DEFAULT_FROM_NAME = 'BilliardsLadder';
var EmailService = /** @class */ (function () {
    function EmailService() {
        this.initialized = false;
        var apiKey = process.env.SENDGRID_API_KEY;
        if (apiKey) {
            mail_1.default.setApiKey(apiKey);
            this.initialized = true;
            console.log('[EmailService] SendGrid configured successfully');
            if (!process.env.SENDGRID_FROM_EMAIL && !process.env.EMAIL_FROM) {
                console.warn('[EmailService] SENDGRID_FROM_EMAIL not set — using fallback sender noreply@actionladder.com');
            }
        }
        else {
            console.warn('[EmailService] SENDGRID_API_KEY not set — emails will not be sent');
        }
    }
    EmailService.prototype.sendEmail = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var msg, error_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.initialized) {
                            console.warn('[EmailService] Skipping email send — SendGrid not configured');
                            return [2 /*return*/];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        msg = {
                            to: options.to,
                            from: {
                                email: options.from || DEFAULT_FROM_EMAIL,
                                name: DEFAULT_FROM_NAME,
                            },
                            subject: options.subject,
                            html: options.html,
                        };
                        return [4 /*yield*/, mail_1.default.send(msg)];
                    case 2:
                        _b.sent();
                        console.log("[EmailService] Email sent to ".concat(options.to));
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _b.sent();
                        console.error('[EmailService] Email sending failed:', ((_a = error_1 === null || error_1 === void 0 ? void 0 : error_1.response) === null || _a === void 0 ? void 0 : _a.body) || error_1.message || error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    EmailService.prototype.generatePayoutEmail = function (data) {
        var formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(data.amount / 100);
        return "\n      <!DOCTYPE html>\n      <html>\n      <head>\n        <meta charset=\"utf-8\">\n        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n        <title>You Just Got Paid! \uD83D\uDCB8</title>\n        <style>\n          body {\n            margin: 0;\n            padding: 0;\n            background-color: #000000;\n            color: #ffffff;\n            font-family: 'Courier New', monospace;\n            line-height: 1.6;\n          }\n          .container {\n            max-width: 600px;\n            margin: 0 auto;\n            padding: 20px;\n            background-color: #111111;\n          }\n          .header {\n            text-align: center;\n            padding: 30px 0;\n            border-bottom: 2px solid #00ff00;\n            margin-bottom: 30px;\n          }\n          .logo {\n            font-size: 32px;\n            font-weight: bold;\n            color: #00ff00;\n            margin-bottom: 10px;\n          }\n          .tagline {\n            color: #888888;\n            font-size: 14px;\n            font-style: italic;\n          }\n          .payout-amount {\n            text-align: center;\n            background: linear-gradient(45deg, #00ff00, #00cc00);\n            color: #000000;\n            font-size: 48px;\n            font-weight: bold;\n            padding: 30px;\n            margin: 30px 0;\n            border-radius: 10px;\n            text-shadow: none;\n          }\n          .match-details {\n            background-color: #1a1a1a;\n            padding: 20px;\n            border-left: 4px solid #00ff00;\n            margin: 20px 0;\n          }\n          .detail-row {\n            display: flex;\n            justify-content: space-between;\n            padding: 5px 0;\n            border-bottom: 1px solid #333333;\n          }\n          .detail-row:last-child {\n            border-bottom: none;\n          }\n          .detail-label {\n            color: #888888;\n            font-weight: bold;\n          }\n          .detail-value {\n            color: #00ff00;\n          }\n          .celebration {\n            text-align: center;\n            font-size: 24px;\n            margin: 30px 0;\n            color: #00ff00;\n          }\n          .footer {\n            text-align: center;\n            padding: 30px 0;\n            border-top: 2px solid #00ff00;\n            margin-top: 30px;\n            color: #888888;\n            font-size: 12px;\n          }\n          .respect-earned {\n            background-color: #1a1a1a;\n            padding: 20px;\n            border: 2px solid #00ff00;\n            border-radius: 10px;\n            margin: 20px 0;\n            text-align: center;\n          }\n          .transfer-id {\n            font-family: monospace;\n            background-color: #222222;\n            padding: 10px;\n            border-radius: 5px;\n            color: #00ff00;\n            word-break: break-all;\n          }\n        </style>\n      </head>\n      <body>\n        <div class=\"container\">\n          <div class=\"header\">\n            <div class=\"logo\">\uD83C\uDFB1 ACTION LADDER</div>\n            <div class=\"tagline\">\"In here, respect is earned in racks, not words\"</div>\n          </div>\n\n          <div class=\"celebration\">\n            \uD83C\uDFC6 YOU JUST GOT PAID! \uD83D\uDCB8\n          </div>\n\n          <div class=\"payout-amount\">\n            ".concat(formattedAmount, "\n          </div>\n\n          <div class=\"respect-earned\">\n            <h2 style=\"color: #00ff00; margin-top: 0;\">RESPECT EARNED \uD83D\uDD25</h2>\n            <p>You put in the work and showed up when it mattered. That's what separates the real players from the pretenders.</p>\n          </div>\n\n          <div class=\"match-details\">\n            <h3 style=\"color: #00ff00; margin-top: 0;\">Match Details</h3>\n            <div class=\"detail-row\">\n              <span class=\"detail-label\">Team:</span>\n              <span class=\"detail-value\">").concat(data.teamName, "</span>\n            </div>\n            <div class=\"detail-row\">\n              <span class=\"detail-label\">Division:</span>\n              <span class=\"detail-value\">").concat(data.division, "</span>\n            </div>\n            <div class=\"detail-row\">\n              <span class=\"detail-label\">Match ID:</span>\n              <span class=\"detail-value\">").concat(data.matchId, "</span>\n            </div>\n            ").concat(data.opponentTeam ? "\n            <div class=\"detail-row\">\n              <span class=\"detail-label\">Defeated:</span>\n              <span class=\"detail-value\">".concat(data.opponentTeam, "</span>\n            </div>\n            ") : '', "\n            <div class=\"detail-row\">\n              <span class=\"detail-label\">Payout Amount:</span>\n              <span class=\"detail-value\">").concat(formattedAmount, "</span>\n            </div>\n          </div>\n\n          <div style=\"background-color: #1a1a1a; padding: 20px; border-radius: 10px; margin: 20px 0;\">\n            <h4 style=\"color: #00ff00; margin-top: 0;\">Transfer Details</h4>\n            <p style=\"color: #888888; margin-bottom: 10px;\">Transfer ID:</p>\n            <div class=\"transfer-id\">").concat(data.transferId, "</div>\n            <p style=\"color: #888888; font-size: 14px; margin-top: 15px;\">\n              \uD83D\uDCB3 Funds will appear in your connected bank account within 1-2 business days.\n            </p>\n          </div>\n\n          <div style=\"text-align: center; margin: 30px 0;\">\n            <p style=\"color: #888888;\">Ready for the next challenge?</p>\n            <a href=\"https://actionladder.net/app\" style=\"background-color: #00ff00; color: #000000; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;\">\n              FIND YOUR NEXT MATCH \uD83C\uDFAF\n            </a>\n          </div>\n\n          <div class=\"footer\">\n            <p><strong>Powered by Action Ladder</strong></p>\n            <p>The premier billiards competition platform where legends are made.</p>\n            <p>Questions? Contact support@actionladder.net</p>\n          </div>\n        </div>\n      </body>\n      </html>\n    ");
    };
    EmailService.prototype.generateOnboardingCompleteEmail = function (data) {
        return "\n      <!DOCTYPE html>\n      <html>\n      <head>\n        <meta charset=\"utf-8\">\n        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n        <title>Welcome to Action Ladder! \uD83C\uDFB1</title>\n        <style>\n          body {\n            margin: 0;\n            padding: 0;\n            background-color: #000000;\n            color: #ffffff;\n            font-family: 'Courier New', monospace;\n            line-height: 1.6;\n          }\n          .container {\n            max-width: 600px;\n            margin: 0 auto;\n            padding: 20px;\n            background-color: #111111;\n          }\n          .header {\n            text-align: center;\n            padding: 30px 0;\n            border-bottom: 2px solid #00ff00;\n            margin-bottom: 30px;\n          }\n          .logo {\n            font-size: 32px;\n            font-weight: bold;\n            color: #00ff00;\n            margin-bottom: 10px;\n          }\n          .tagline {\n            color: #888888;\n            font-size: 14px;\n            font-style: italic;\n          }\n          .welcome-message {\n            background: linear-gradient(45deg, #00ff00, #00cc00);\n            color: #000000;\n            padding: 30px;\n            border-radius: 10px;\n            text-align: center;\n            margin: 30px 0;\n          }\n          .setup-complete {\n            background-color: #1a1a1a;\n            padding: 20px;\n            border-left: 4px solid #00ff00;\n            margin: 20px 0;\n          }\n          .footer {\n            text-align: center;\n            padding: 30px 0;\n            border-top: 2px solid #00ff00;\n            margin-top: 30px;\n            color: #888888;\n            font-size: 12px;\n          }\n        </style>\n      </head>\n      <body>\n        <div class=\"container\">\n          <div class=\"header\">\n            <div class=\"logo\">\uD83C\uDFB1 ACTION LADDER</div>\n            <div class=\"tagline\">\"In here, respect is earned in racks, not words\"</div>\n          </div>\n\n          <div class=\"welcome-message\">\n            <h1 style=\"margin-top: 0; color: #000000;\">WELCOME TO THE LADDER! \uD83C\uDFC6</h1>\n            <p style=\"font-size: 18px; margin-bottom: 0; color: #000000;\">Your team is now ready to compete and earn.</p>\n          </div>\n\n          <div class=\"setup-complete\">\n            <h2 style=\"color: #00ff00; margin-top: 0;\">\u2705 Setup Complete</h2>\n            <p><strong>".concat(data.teamName, "</strong> is now fully connected to Action Ladder's payout system.</p>\n            <ul style=\"color: #888888;\">\n              <li>\u2705 Stripe account verified and active</li>\n              <li>\u2705 Bank account connected for payouts</li>\n              <li>\u2705 Ready to receive winnings instantly</li>\n              <li>\u2705 Tax information submitted</li>\n            </ul>\n          </div>\n\n          <div style=\"background-color: #1a1a1a; padding: 20px; border-radius: 10px; margin: 20px 0;\">\n            <h3 style=\"color: #00ff00; margin-top: 0;\">What's Next?</h3>\n            <ol style=\"color: #888888;\">\n              <li><strong style=\"color: #00ff00;\">Find Matches:</strong> Browse available challenges in your division</li>\n              <li><strong style=\"color: #00ff00;\">Pay Entry Fees:</strong> Secure your spot with instant payment</li>\n              <li><strong style=\"color: #00ff00;\">Compete:</strong> Show up and put in the work</li>\n              <li><strong style=\"color: #00ff00;\">Get Paid:</strong> Winners receive payouts within 1-2 business days</li>\n            </ol>\n          </div>\n\n          <div style=\"text-align: center; margin: 30px 0;\">\n            <p style=\"color: #888888;\">Ready to earn your respect?</p>\n            <a href=\"").concat(data.platformUrl, "/app?tab=match-divisions\" style=\"background-color: #00ff00; color: #000000; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;\">\n              START COMPETING \uD83C\uDFAF\n            </a>\n          </div>\n\n          <div style=\"background-color: #1a1a1a; padding: 20px; border: 2px solid #00ff00; border-radius: 10px; margin: 20px 0; text-align: center;\">\n            <h4 style=\"color: #00ff00; margin-top: 0;\">Remember the Code \uD83D\uDCAF</h4>\n            <p style=\"margin-bottom: 0;\">In here, respect is earned in racks, not words. Show up, play hard, and let your game do the talking.</p>\n          </div>\n\n          <div class=\"footer\">\n            <p><strong>Powered by Action Ladder</strong></p>\n            <p>The premier billiards competition platform where legends are made.</p>\n            <p>Questions? Contact support@actionladder.net</p>\n          </div>\n        </div>\n      </body>\n      </html>\n    ");
    };
    EmailService.prototype.sendPayoutNotification = function (data, recipientEmail) {
        return __awaiter(this, void 0, void 0, function () {
            var html;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        html = this.generatePayoutEmail(data);
                        return [4 /*yield*/, this.sendEmail({
                                to: recipientEmail,
                                subject: "\uD83C\uDFB1 You Just Got Paid! ".concat(new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.amount / 100), " from Action Ladder \uD83D\uDCB8"),
                                html: html,
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    EmailService.prototype.sendOnboardingComplete = function (data, recipientEmail) {
        return __awaiter(this, void 0, void 0, function () {
            var html;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        html = this.generateOnboardingCompleteEmail(data);
                        return [4 /*yield*/, this.sendEmail({
                                to: recipientEmail,
                                subject: "\uD83C\uDFC6 Welcome to Action Ladder! Your team ".concat(data.teamName, " is ready to compete"),
                                html: html,
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    EmailService.prototype.sendMatchEntryConfirmation = function (teamName, division, entryFee, matchId, recipientEmail) {
        return __awaiter(this, void 0, void 0, function () {
            var formattedAmount, html;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        formattedAmount = new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                        }).format(entryFee / 100);
                        html = "\n      <!DOCTYPE html>\n      <html>\n      <head>\n        <meta charset=\"utf-8\">\n        <title>Match Entry Confirmed! \uD83C\uDFB1</title>\n        <style>\n          body { margin: 0; padding: 0; background-color: #000000; color: #ffffff; font-family: 'Courier New', monospace; }\n          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #111111; }\n          .header { text-align: center; padding: 30px 0; border-bottom: 2px solid #00ff00; margin-bottom: 30px; }\n          .logo { font-size: 32px; font-weight: bold; color: #00ff00; margin-bottom: 10px; }\n          .confirmation { background: linear-gradient(45deg, #00ff00, #00cc00); color: #000000; padding: 30px; border-radius: 10px; text-align: center; margin: 30px 0; }\n          .details { background-color: #1a1a1a; padding: 20px; border-left: 4px solid #00ff00; margin: 20px 0; }\n          .footer { text-align: center; padding: 30px 0; border-top: 2px solid #00ff00; margin-top: 30px; color: #888888; font-size: 12px; }\n        </style>\n      </head>\n      <body>\n        <div class=\"container\">\n          <div class=\"header\">\n            <div class=\"logo\">\uD83C\uDFB1 ACTION LADDER</div>\n          </div>\n          <div class=\"confirmation\">\n            <h1 style=\"margin-top: 0; color: #000000;\">ENTRY CONFIRMED! \uD83D\uDD25</h1>\n            <p style=\"font-size: 18px; margin-bottom: 0; color: #000000;\">You're locked in. Time to show what you're made of.</p>\n          </div>\n          <div class=\"details\">\n            <h3 style=\"color: #00ff00; margin-top: 0;\">Match Details</h3>\n            <p><strong>Team:</strong> ".concat(teamName, "</p>\n            <p><strong>Division:</strong> ").concat(division, "</p>\n            <p><strong>Entry Fee:</strong> ").concat(formattedAmount, "</p>\n            <p><strong>Match ID:</strong> ").concat(matchId, "</p>\n          </div>\n          <div style=\"text-align: center; margin: 30px 0;\">\n            <p style=\"color: #888888;\">Get ready to earn your respect on the table.</p>\n            <a href=\"https://actionladder.net/app?tab=escrow-challenges\" style=\"background-color: #00ff00; color: #000000; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;\">\n              VIEW MY MATCHES \uD83C\uDFAF\n            </a>\n          </div>\n          <div class=\"footer\">\n            <p><strong>Powered by Action Ladder</strong></p>\n          </div>\n        </div>\n      </body>\n      </html>\n    ");
                        return [4 /*yield*/, this.sendEmail({
                                to: recipientEmail,
                                subject: "\uD83C\uDFB1 Match Entry Confirmed: ".concat(division, " - ").concat(formattedAmount, " entry fee paid"),
                                html: html,
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    EmailService.prototype.sendPasswordResetEmail = function (email_1, resetToken_1) {
        return __awaiter(this, arguments, void 0, function (email, resetToken, appBaseUrl) {
            var resetUrl, html, error_2;
            if (appBaseUrl === void 0) { appBaseUrl = process.env.APP_BASE_URL || "http://localhost:5000"; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        resetUrl = "".concat(appBaseUrl, "/reset-password?token=").concat(resetToken);
                        html = "\n      <div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">\n        <div style=\"background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: white; padding: 20px; text-align: center;\">\n          <h1 style=\"margin: 0;\">ActionLadder</h1>\n          <p style=\"margin: 10px 0 0 0; opacity: 0.9;\">Pool \u2022 Points \u2022 Pride</p>\n        </div>\n        \n        <div style=\"padding: 30px; background: #f9fafb;\">\n          <h2 style=\"color: #374151; margin-bottom: 20px;\">Password Reset Request</h2>\n          \n          <p style=\"color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 25px;\">\n            We received a request to reset your password for your ActionLadder account. \n            Click the button below to reset your password:\n          </p>\n          \n          <div style=\"text-align: center; margin: 30px 0;\">\n            <a href=\"".concat(resetUrl, "\" \n               style=\"background: #059669; color: white; padding: 12px 30px; text-decoration: none; \n                      border-radius: 6px; font-weight: bold; display: inline-block;\">\n              Reset Password\n            </a>\n          </div>\n          \n          <p style=\"color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 20px;\">\n            Or copy and paste this link into your browser:\n          </p>\n          <p style=\"color: #059669; font-size: 14px; word-break: break-all; background: #f3f4f6; \n                    padding: 10px; border-radius: 4px;\">\n            ").concat(resetUrl, "\n          </p>\n          \n          <div style=\"margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;\">\n            <p style=\"color: #9ca3af; font-size: 12px; margin: 0;\">\n              This link will expire in 1 hour. If you didn't request this reset, please ignore this email.\n            </p>\n          </div>\n        </div>\n        \n        <div style=\"background: #374151; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;\">\n          <p style=\"margin: 0;\">\u00A9 2025 ActionLadder - In here, respect is earned in racks, not words</p>\n        </div>\n      </div>\n    ");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sendEmail({
                                to: email,
                                subject: "ActionLadder - Password Reset Request",
                                html: html,
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Failed to send password reset email:', error_2);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    EmailService.prototype.sendVerificationEmail = function (email, verificationToken, userName, appBaseUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var baseUrl, verifyUrl, html, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        baseUrl = appBaseUrl || process.env.APP_BASE_URL || "http://localhost:5000";
                        verifyUrl = "".concat(baseUrl, "/api/auth/verify-email?token=").concat(verificationToken);
                        html = "\n      <!DOCTYPE html>\n      <html>\n      <head>\n        <meta charset=\"utf-8\">\n        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n        <title>Verify Your Email</title>\n      </head>\n      <body style=\"margin:0;padding:0;background-color:#000000;color:#ffffff;font-family:'Courier New',monospace;line-height:1.6;\">\n        <div style=\"max-width:600px;margin:0 auto;padding:20px;background-color:#111111;\">\n          <div style=\"text-align:center;padding:30px 0;border-bottom:2px solid #00ff00;margin-bottom:30px;\">\n            <div style=\"font-size:32px;font-weight:bold;color:#00ff00;margin-bottom:10px;\">BILLIARDS LADDER</div>\n            <div style=\"color:#888888;font-size:14px;font-style:italic;\">In here, respect is earned in racks, not words</div>\n          </div>\n\n          <div style=\"padding:20px 0;\">\n            <h2 style=\"color:#00ff00;margin-bottom:20px;\">Verify Your Email".concat(userName ? ", ".concat(userName) : "", "</h2>\n            <p style=\"color:#cccccc;font-size:16px;margin-bottom:25px;\">\n              Welcome to the ladder. Before you can step up to the table, we need to confirm your email address.\n            </p>\n\n            <div style=\"text-align:center;margin:30px 0;\">\n              <a href=\"").concat(verifyUrl, "\"\n                 style=\"background:#059669;color:white;padding:14px 40px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;font-size:16px;letter-spacing:1px;\">\n                VERIFY EMAIL\n              </a>\n            </div>\n\n            <p style=\"color:#888888;font-size:14px;margin-bottom:10px;\">\n              Or copy and paste this link into your browser:\n            </p>\n            <p style=\"color:#00ff00;font-size:13px;word-break:break-all;background:#1a1a1a;padding:12px;border-radius:4px;border:1px solid #333333;\">\n              ").concat(verifyUrl, "\n            </p>\n\n            <div style=\"margin-top:30px;padding-top:20px;border-top:1px solid #333333;\">\n              <p style=\"color:#666666;font-size:12px;margin:0;\">\n                This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.\n              </p>\n            </div>\n          </div>\n\n          <div style=\"background:#0a0a0a;color:#555555;padding:20px;text-align:center;font-size:12px;border-top:1px solid #222222;\">\n            <p style=\"margin:0;\">BilliardsLadder &mdash; Pool &bull; Points &bull; Pride</p>\n          </div>\n        </div>\n      </body>\n      </html>\n    ");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sendEmail({
                                to: email,
                                subject: "BilliardsLadder - Verify Your Email Address",
                                html: html,
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_3 = _a.sent();
                        console.error("Failed to send verification email:", error_3);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return EmailService;
}());
exports.emailService = new EmailService();
function sendPasswordResetEmail(email, resetToken, appBaseUrl) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, exports.emailService.sendPasswordResetEmail(email, resetToken, appBaseUrl)];
        });
    });
}
