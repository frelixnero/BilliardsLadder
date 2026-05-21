"use strict";
/**
 * Active Player Definition — Central Configuration
 *
 * This file defines who counts as an "active player" toward operator subscription
 * tier eligibility. All knobs live here so the definition is easy to tune without
 * hunting through controllers.
 *
 * Definition (as of April 2026):
 * A roster member of a hall is an "active player" if ALL are true:
 *   - They are on the hall's active roster
 *   - Their account is in good standing (not banned, not suspended)
 *   - Their email is verified (prevents placeholder/bot accounts)
 *   - Their account is older than MIN_ACCOUNT_AGE_HOURS (prevents last-minute stuffing)
 *   - They have a recorded activity timestamp within ACTIVITY_WINDOW_DAYS
 *
 * Qualifying activities that update `users.lastActivityAt`:
 *   - Successful login (password or OAuth)
 *   - Signup (bootstrapped to now)
 *   - Creating or accepting a challenge
 *   - Creating or submitting a match
 *   - Joining a tournament
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTIVE_PLAYER_CONFIG = void 0;
exports.ACTIVE_PLAYER_CONFIG = {
    /** Activity must have occurred within this many days to count as active. */
    ACTIVITY_WINDOW_DAYS: 30,
    /** Accounts younger than this many hours do not count toward tier eligibility. */
    MIN_ACCOUNT_AGE_HOURS: 24,
    /** Require verified email for a roster member to count. */
    REQUIRE_EMAIL_VERIFIED: true,
    /** Exclude banned accounts. */
    EXCLUDE_BANNED: true,
    /** Exclude suspended accounts. */
    EXCLUDE_SUSPENDED: true,
};
