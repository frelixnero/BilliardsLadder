import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { notifyChallengeReceived } from "../services/notifyService";

const quickChallengeSchema = z.object({
  opponentId: z.string().min(1),
  gameType: z.string().default('8-ball'),
  stakes: z.number().min(1),
  timeSlot: z.string().min(1),
  hallId: z.string().default('hall1'),
});

// Resolve the authenticated user's id regardless of auth type
// (Replit OAuth puts it on user.claims.sub; password sessions put it on user.id).
function getSessionUserId(req: Request): string | null {
  const user = req.user as any;
  if (!user) return null;
  return user.claims?.sub || user.id || null;
}

// Quick Challenge endpoint - simplified challenge creation
export async function createQuickChallenge(req: Request, res: Response) {
  try {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Look up the Player record for the authenticated user.
    const currentPlayer = await storage.getPlayerByUserId(userId);
    if (!currentPlayer) {
      return res.status(400).json({
        error: "No player profile",
        message: "You need a player profile before creating a challenge.",
      });
    }

    const validatedData = quickChallengeSchema.parse(req.body);

    // Don't let a player challenge themselves.
    if (validatedData.opponentId === currentPlayer.id) {
      return res.status(400).json({ error: "You cannot challenge yourself" });
    }

    // Set up quick challenge time
    const challengeTime = new Date();
    const [hours, minutes] = validatedData.timeSlot.split(':').map(Number);
    challengeTime.setHours(hours, minutes, 0, 0);

    // If time is in the past, assume it's for tomorrow
    if (challengeTime < new Date()) {
      challengeTime.setDate(challengeTime.getDate() + 1);
    }

    // Get opponent player info
    const opponent = await storage.getPlayer(validatedData.opponentId);
    if (!opponent) {
      return res.status(400).json({ error: "Opponent not found" });
    }

    // Resolve hall name when possible (falls back gracefully if not found)
    let hallName = "Default Hall";
    try {
      const hall = await (storage as any).getHall?.(validatedData.hallId);
      if (hall?.name) hallName = hall.name;
    } catch {
      // ignore — non-fatal
    }

    // Create challenge data matching the schema
    const challengeData = {
      aPlayerId: currentPlayer.id,
      bPlayerId: validatedData.opponentId,
      aPlayerName: currentPlayer.name,
      bPlayerName: opponent.name,
      gameType: validatedData.gameType,
      tableType: '9ft' as const,
      stakes: validatedData.stakes * 100, // Convert to cents
      hallId: validatedData.hallId,
      hallName,
      scheduledAt: challengeTime,
      title: `Quick ${validatedData.gameType} Challenge`,
      format: 'race-to-7',
      status: 'pending' as const,
      description: 'Quick challenge created from dashboard',
      autoApproved: true,
      durationMinutes: 90,
      posterImageUrl: null,
      entryFee: Math.floor(validatedData.stakes * 0.05),
      operatorFee: Math.floor(validatedData.stakes * 0.02),
      isPublic: true,
      requiresApproval: false,
      maxSpectators: 20,
    };

    const challenge = await storage.createChallenge(challengeData);

    // Fire-and-forget: notify the opponent. Failure here must never block
    // the challenge from being created.
    notifyChallengeReceived({
      challengeId: challenge.id,
      challengerName: currentPlayer.name,
      opponentUserId: opponent.userId,
      stakesCents: challengeData.stakes,
      gameType: validatedData.gameType,
    });

    res.status(201).json({
      success: true,
      challenge,
      message: "Quick challenge created successfully!"
    });

  } catch (error: any) {
    console.error("Quick challenge creation error:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request data",
        details: error.errors
      });
    }

    res.status(500).json({
      error: "Failed to create quick challenge",
      message: error.message
    });
  }
}

// Get quick challenge suggestions (nearby players, similar skill level)
export async function getQuickChallengeSuggestions(req: Request, res: Response) {
  try {
    const userId = getSessionUserId(req);
    const currentPlayer = userId ? await storage.getPlayerByUserId(userId) : null;
    const currentPlayerId = currentPlayer?.id;

    const allPlayers = await storage.getPlayers();

    const suggestions = allPlayers
      .filter(player =>
        player.id !== currentPlayerId &&
        player.rating >= 400 &&
        player.rating <= 800
      )
      .sort((a, b) => {
        const avgRating = currentPlayer?.rating ?? 500;
        const aDistance = Math.abs(a.rating - avgRating);
        const bDistance = Math.abs(b.rating - avgRating);
        return aDistance - bDistance;
      })
      .slice(0, 6);

    res.json({
      suggestions,
      message: "Quick challenge suggestions ready"
    });

  } catch (error: any) {
    console.error("Quick challenge suggestions error:", error);
    res.status(500).json({
      error: "Failed to get suggestions",
      message: error.message
    });
  }
}
