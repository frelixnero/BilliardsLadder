import type { Request, Response } from "express";
import { storage } from "../storage";
import type { Match } from "@shared/schema";

/**
 * Pull the canonical user id off the session for either auth path:
 *  - Replit OAuth stores it under `req.user.claims.sub`
 *  - Password login stores it under `req.user.id`
 */
function getSessionUserId(req: Request): string | null {
  if (!req.isAuthenticated || !req.isAuthenticated()) return null;
  const u: any = req.user;
  const raw = u?.claims?.sub ?? u?.id;
  return raw == null ? null : String(raw);
}

/**
 * The matches table stores `challenger` and `opponent` as plain text — depending
 * on call site they may hold a player id or a player name. To get an honest
 * win/loss tally we match against either.
 */
function isPlayerInMatch(m: Match, playerId: string, playerName: string): boolean {
  return (
    m.challenger === playerId ||
    m.opponent === playerId ||
    m.challenger === playerName ||
    m.opponent === playerName
  );
}

function isWinner(m: Match, playerId: string, playerName: string): boolean {
  return m.winner === playerId || m.winner === playerName;
}

// ── GET /api/player/stats ─────────────────────────────────────────────────────
//
// Aggregated stats panel for the player dashboard. Returns nullable fields
// for anything we don't yet track (e.g. avgGameScore, breakAndRuns) so the
// client can render `—` rather than fabricate a value.
export async function getPlayerStats(req: Request, res: Response) {
  const userId = getSessionUserId(req);
  if (!userId) return res.status(401).json({ message: "Not authenticated" });

  try {
    const player = await storage.getPlayerByUserId(userId);
    if (!player) {
      // Authenticated, but no player profile linked yet. Return an empty
      // stats object rather than a 404 so the dashboard renders all `—`s.
      return res.json({
        playerName: null,
        tier: null,
        division: null,
        fargoRating: null,
        ratingChange: null,
        ladderRank: null,
        winStreak: null,
        recordStreak: null,
        respectPoints: null,
        wins: 0,
        losses: 0,
        winRate: null,
        walletBalance: 0,
        voteExpiry: null,
        avgGameScore: null,
        breakAndRuns: null,
        comebackWins: null,
        perfectGames: null,
        nextOpponent: null,
        nextGameDate: null,
        nextGameStake: null,
        tournamentDate: null,
        tournamentEntry: null,
        teamMatchDate: null,
      });
    }

    // Win/loss tally from completed matches.
    const allMatches: Match[] = await storage.getAllMatches();
    const myMatches = allMatches.filter((m: Match) =>
      isPlayerInMatch(m, player.id, player.name),
    );
    const completed = myMatches.filter((m: Match) => m.status === "reported" && m.winner);
    const wins = completed.filter((m: Match) => isWinner(m, player.id, player.name)).length;
    const losses = completed.length - wins;
    const winRate = completed.length > 0 ? Math.round((wins / completed.length) * 100) : null;

    // Ladder rank = 1 + number of players with strictly more points.
    const allPlayers = await storage.getAllPlayers();
    const myPoints = player.points ?? 0;
    const ladderRank =
      allPlayers.filter((p) => (p.points ?? 0) > myPoints).length + 1;

    // Wallet balance (credits stored as cents).
    let walletBalance = 0;
    try {
      const wallet = await storage.getWallet(userId);
      if (wallet?.balanceCredits != null) {
        walletBalance = Math.floor(wallet.balanceCredits / 100);
      }
    } catch {
      walletBalance = 0;
    }

    // Next scheduled challenge for this player → drives the "Upcoming" panel.
    const playerChallenges = await storage.getChallengesByPlayer(player.id);
    const now = Date.now();
    const upcoming = playerChallenges
      .filter(
        (c) =>
          (c.status === "scheduled" ||
            c.status === "pending" ||
            c.status === "accepted") &&
          new Date(c.scheduledAt).getTime() > now,
      )
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
    const next = upcoming[0];

    let nextOpponent: string | null = null;
    let nextGameDate: string | null = null;
    let nextGameStake: number | null = null;
    if (next) {
      const opponentId =
        next.aPlayerId === player.id ? next.bPlayerId : next.aPlayerId;
      const opponent = allPlayers.find((p) => p.id === opponentId);
      nextOpponent = opponent?.name ?? null;
      nextGameDate = new Date(next.scheduledAt).toISOString();
      // Challenge schema doesn't carry a stake column — leave null.
      nextGameStake = null;
    }

    // Tier / division come straight off the player record.
    const tier = player.membershipTier ?? null;
    const division = player.isRookie ? "Rookie" : "Open";

    res.json({
      playerName: player.name,
      tier,
      division,
      fargoRating: player.rating ?? null,
      ratingChange: null, // not tracked yet
      ladderRank,
      winStreak: player.streak ?? null,
      recordStreak: null, // not tracked yet
      respectPoints: player.respectPoints ?? null,
      wins,
      losses,
      winRate,
      walletBalance,
      voteExpiry: null, // not tracked yet
      avgGameScore: null, // not tracked yet
      breakAndRuns: null, // not tracked yet
      comebackWins: null, // not tracked yet
      perfectGames: null, // not tracked yet
      nextOpponent,
      nextGameDate,
      nextGameStake,
      tournamentDate: null, // not tracked yet
      tournamentEntry: null, // not tracked yet
      teamMatchDate: null, // not tracked yet
    });
  } catch (err: any) {
    console.error("[GET /api/player/stats] failed:", err?.message);
    res.status(500).json({ message: "Failed to load player stats" });
  }
}

// ── GET /api/player/challenges ────────────────────────────────────────────────
//
// Lightweight summary used by the dashboard's "Active Challenges" tile.
export async function getPlayerChallengesSummary(req: Request, res: Response) {
  const userId = getSessionUserId(req);
  if (!userId) return res.status(401).json({ message: "Not authenticated" });

  try {
    const player = await storage.getPlayerByUserId(userId);
    if (!player) {
      return res.json({ pending: 0, availablePools: null });
    }
    const mine = await storage.getChallengesByPlayer(player.id);
    const pending = mine.filter(
      (c) => c.status === "pending" || c.status === "scheduled",
    ).length;

    // Available pools = open challenge pools the player could join.
    let availablePools: number | null = null;
    try {
      const pools = await (storage as any).getOpenChallengePools?.();
      if (Array.isArray(pools)) availablePools = pools.length;
    } catch {
      availablePools = null;
    }

    res.json({ pending, availablePools });
  } catch (err: any) {
    console.error("[GET /api/player/challenges] failed:", err?.message);
    res.status(500).json({ message: "Failed to load challenges summary" });
  }
}

// ── GET /api/player/leaderboard ───────────────────────────────────────────────
//
// Returns the top players sorted by points (desc) then by rating. Trimmed to
// 25 — the dashboard only renders the top 5 but operators may want more.
export async function getPlayerLeaderboard(req: Request, res: Response) {
  const userId = getSessionUserId(req);
  if (!userId) return res.status(401).json({ message: "Not authenticated" });

  try {
    const players = await storage.getAllPlayers();
    const allMatches: Match[] = await storage.getAllMatches();

    const ranked = players
      .map((p) => {
        const mine = allMatches.filter((m: Match) => isPlayerInMatch(m, p.id, p.name));
        const completed = mine.filter((m: Match) => m.status === "reported" && m.winner);
        const wins = completed.filter((m: Match) => isWinner(m, p.id, p.name)).length;
        const losses = completed.length - wins;
        return {
          id: p.id,
          name: p.name,
          rating: p.rating ?? 0,
          points: p.points ?? 0,
          wins,
          losses,
        };
      })
      .sort((a, b) => b.points - a.points || b.rating - a.rating)
      .slice(0, 25);

    res.json(ranked);
  } catch (err: any) {
    console.error("[GET /api/player/leaderboard] failed:", err?.message);
    res.status(500).json({ message: "Failed to load leaderboard" });
  }
}
