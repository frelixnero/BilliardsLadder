import { storage } from "../storage";
import type { InsertNotification } from "@shared/schema";

/**
 * Notify Service
 *
 * Single chokepoint for creating in-app notifications (the user's notification
 * bell). All helpers are fire-and-forget: they swallow errors so they never
 * break the caller's primary action (creating a challenge, completing a match,
 * etc.). Notifications are promotional UX, not business-critical state.
 *
 * Pattern mirrors rackPointsService — call from inside a controller after the
 * primary write succeeds, do not await unless the caller needs the row back.
 */

async function safeCreate(insert: InsertNotification): Promise<void> {
  try {
    await storage.createNotification(insert);
  } catch (err: any) {
    console.warn("[notifyService] createNotification failed:", err?.message ?? err);
  }
}

export interface ChallengeNotifyContext {
  challengeId: string;
  challengerName: string;
  opponentUserId: string | null | undefined;
  stakesCents: number;
  gameType: string;
}

/** Notify the opponent that a new challenge has been issued to them. */
export function notifyChallengeReceived(ctx: ChallengeNotifyContext): void {
  if (!ctx.opponentUserId) return;
  const dollars = (ctx.stakesCents / 100).toFixed(0);
  void safeCreate({
    userId: ctx.opponentUserId,
    type: "challenge",
    title: "New Challenge!",
    message: `${ctx.challengerName} challenged you to a $${dollars} ${ctx.gameType} match`,
    urgent: true,
    actionUrl: `/challenges/${ctx.challengeId}`,
    refType: "challenge",
    refId: ctx.challengeId,
  });
}

export interface ChallengeStatusContext {
  challengeId: string;
  recipientUserId: string | null | undefined;
  otherPlayerName: string;
}

/** Notify a player that their challenge was accepted. */
export function notifyChallengeAccepted(ctx: ChallengeStatusContext): void {
  if (!ctx.recipientUserId) return;
  void safeCreate({
    userId: ctx.recipientUserId,
    type: "challenge",
    title: "Challenge Accepted",
    message: `${ctx.otherPlayerName} accepted your challenge — game on.`,
    urgent: false,
    actionUrl: `/challenges/${ctx.challengeId}`,
    refType: "challenge",
    refId: ctx.challengeId,
  });
}

/** Notify a player that their challenge was cancelled. */
export function notifyChallengeCancelled(ctx: ChallengeStatusContext & { reason?: string }): void {
  if (!ctx.recipientUserId) return;
  const tail = ctx.reason ? ` Reason: ${ctx.reason}` : "";
  void safeCreate({
    userId: ctx.recipientUserId,
    type: "challenge",
    title: "Challenge Cancelled",
    message: `${ctx.otherPlayerName} cancelled the match.${tail}`,
    urgent: false,
    actionUrl: `/challenges/${ctx.challengeId}`,
    refType: "challenge",
    refId: ctx.challengeId,
  });
}

export interface MatchResultContext {
  challengeId: string;
  recipientUserId: string | null | undefined;
  won: boolean;
  opponentName: string;
}

/** Notify a player of their match result. */
export function notifyMatchResult(ctx: MatchResultContext): void {
  if (!ctx.recipientUserId) return;
  void safeCreate({
    userId: ctx.recipientUserId,
    type: "match_result",
    title: ctx.won ? "Match Won" : "Match Result Recorded",
    message: ctx.won
      ? `You beat ${ctx.opponentName}. Nice rack.`
      : `Match against ${ctx.opponentName} has been recorded.`,
    urgent: false,
    actionUrl: `/challenges/${ctx.challengeId}`,
    refType: "match",
    refId: ctx.challengeId,
  });
}

export interface AccountStatusContext {
  recipientUserId: string;
  reason?: string;
}

/** Notify a user their account has been banned. */
export function notifyAccountBanned(ctx: AccountStatusContext): void {
  void safeCreate({
    userId: ctx.recipientUserId,
    type: "ban",
    title: "Account Banned",
    message: ctx.reason
      ? `Your account has been banned: ${ctx.reason}`
      : "Your account has been banned. Visit appeals to learn more.",
    urgent: true,
    actionUrl: "/appeals",
    refType: "appeal",
    refId: null,
  });
}

/** Notify a user their account has been suspended. */
export function notifyAccountSuspended(ctx: AccountStatusContext): void {
  void safeCreate({
    userId: ctx.recipientUserId,
    type: "ban",
    title: "Account Suspended",
    message: ctx.reason
      ? `Your account has been suspended: ${ctx.reason}`
      : "Your account has been suspended.",
    urgent: true,
    actionUrl: "/appeals",
    refType: "appeal",
    refId: null,
  });
}

/** Generic system notification, used for one-offs. */
export function notifySystem(args: {
  userId: string;
  title: string;
  message: string;
  urgent?: boolean;
  actionUrl?: string | null;
}): void {
  void safeCreate({
    userId: args.userId,
    type: "system",
    title: args.title,
    message: args.message,
    urgent: args.urgent ?? false,
    actionUrl: args.actionUrl ?? null,
    refType: null,
    refId: null,
  });
}
