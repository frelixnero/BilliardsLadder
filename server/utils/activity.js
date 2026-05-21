"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.touchUserActivity = touchUserActivity;
/**
 * Fire-and-forget helper that records a user's most recent activity.
 * Call this from login, signup, match create, challenge create/accept,
 * and tournament join paths.
 *
 * Never throws — activity tracking should never block a user's request.
 */
function touchUserActivity(storage, userId) {
    if (!userId)
        return;
    Promise.resolve(storage.touchUserActivity(userId)).catch(function (err) {
        console.warn("[activity] Failed to touch user ".concat(userId, ":"), (err === null || err === void 0 ? void 0 : err.message) || err);
    });
}
