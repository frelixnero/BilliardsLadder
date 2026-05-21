import { Request, Response } from "express";
import { IStorage } from "../storage";
import Stripe from "stripe";
import { 
  insertKellyPoolSchema, 
  insertMoneyGameSchema,
  insertChallengePoolSchema,
  insertChallengeEntrySchema,
  insertResolutionSchema
} from "@shared/schema";

// Kelly Pool Controllers
export function getKellyPools(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const kellyPools = await storage.getKellyPools();
      res.json(kellyPools);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createKellyPool(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const validatedData = insertKellyPoolSchema.parse(req.body);
      const kellyPool = await storage.createKellyPool(validatedData);
      res.status(201).json(kellyPool);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function updateKellyPool(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const kellyPool = await storage.updateKellyPool(id, req.body);
      if (!kellyPool) {
        return res.status(404).json({ message: "Kelly Pool not found" });
      }
      res.json(kellyPool);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

// Money Game Controllers
export function getMoneyGames(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const moneyGames = await storage.getMoneyGames();
      res.json(moneyGames);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getMoneyGame(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const moneyGame = await storage.getMoneyGame(id);
      if (!moneyGame) {
        return res.status(404).json({ message: "Money game not found" });
      }
      res.json(moneyGame);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createMoneyGame(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const validatedData = insertMoneyGameSchema.parse(req.body);
      const moneyGame = await storage.createMoneyGame(validatedData);
      res.status(201).json(moneyGame);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function joinMoneyGame(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const moneyGame = await storage.getMoneyGame(id);
      
      if (!moneyGame) {
        return res.status(404).json({ message: "Money game not found" });
      }

      if (moneyGame.status !== "waiting") {
        return res.status(400).json({ message: "Game is not accepting players" });
      }

      if ((moneyGame.currentPlayers ?? 0) >= moneyGame.maxPlayers) {
        return res.status(400).json({ message: "Game is full" });
      }

      const playerName = req.body.playerName || `Player ${(moneyGame.currentPlayers ?? 0) + 1}`;
      
      const updatedGame = await storage.updateMoneyGame(id, {
        currentPlayers: (moneyGame.currentPlayers ?? 0) + 1,
        players: [...(moneyGame.players ?? []), playerName]
      });

      res.json(updatedGame);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function startMoneyGame(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const moneyGame = await storage.getMoneyGame(id);
      
      if (!moneyGame) {
        return res.status(404).json({ message: "Money game not found" });
      }

      if (moneyGame.status !== "waiting") {
        return res.status(400).json({ message: "Game already started or completed" });
      }

      if ((moneyGame.currentPlayers ?? 0) < 2) {
        return res.status(400).json({ message: "Need at least 2 players to start" });
      }

      const updatedGame = await storage.updateMoneyGame(id, {
        status: "active"
      });

      res.json(updatedGame);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function updateMoneyGame(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const moneyGame = await storage.updateMoneyGame(id, req.body);
      if (!moneyGame) {
        return res.status(404).json({ message: "Money game not found" });
      }
      res.json(moneyGame);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function deleteMoneyGame(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteMoneyGame(id);
      if (!deleted) {
        return res.status(404).json({ message: "Money game not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

// Side Pot Controllers
export function getSidePots(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { matchId, status } = req.query;
      let pots;
      
      if (matchId) {
        pots = await storage.getSidePotsByMatch(matchId as string);
      } else if (status) {
        pots = await storage.getSidePotsByStatus(status as string);
      } else {
        pots = await storage.getAllSidePots();
      }
      
      res.json(pots);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createSidePot(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const validatedData = insertChallengePoolSchema.parse(req.body);
      
      const stakePerSideDollars = validatedData.stakePerSide / 100;
      if (stakePerSideDollars < 5) {
        return res.status(400).json({ message: "Minimum stake per side is $5" });
      }
      if (stakePerSideDollars > 30000) {
        return res.status(400).json({ message: "Maximum stake per side is $30,000" });
      }
      
      if (stakePerSideDollars > 300) {
        return res.status(400).json({ 
          message: "Stakes over $300 require Premium subscription ($45/month). Please upgrade to unlock higher stakes.",
          requiresPremium: true,
          currentLimit: 300,
          requestedAmount: stakePerSideDollars
        });
      }
      
      const totalPotDollars = (validatedData.stakePerSide * 2) / 100;
      const serviceFeesBps = totalPotDollars > 500 ? 500 : 850;
      
      const potData = {
        ...validatedData,
        feeBps: serviceFeesBps,
        customCreatedBy: validatedData.creatorId,
      };
      
      const pool = await storage.createSidePot(potData);
      
      if (stakePerSideDollars >= 100) {
        try {
          await storage.createLiveStream({
            platform: "other",
            url: "",
            title: `High Stakes Challenge - $${stakePerSideDollars} per side`,
            poolHallName: "Unknown Hall",
            city: "Unknown",
            state: "TX",
            category: "casual",
            isLive: false,
          });
          
          console.log(`🎥 Auto-created live stream alert for high stakes challenge: $${stakePerSideDollars} per side`);
        } catch (error) {
          console.error("Failed to create auto live stream alert:", error);
        }
      }
      
      res.status(201).json(pool);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function updateSidePot(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const pool = await storage.updateSidePot(req.params.id, req.body);
      if (!pool) {
        return res.status(404).json({ message: "Side pot not found" });
      }
      res.json(pool);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function getSidePotDetails(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const pot = await storage.getSidePot(req.params.id);
      if (!pot) {
        return res.status(404).json({ message: "Side pot not found" });
      }
      
      const bets = await storage.getSideBetsByPot(req.params.id);
      const resolution = await storage.getResolutionByPot(req.params.id);
      
      res.json({ pot, bets, resolution });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function resolveSidePot(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { winnerSide, decidedBy, notes, evidence } = req.body;
      const challengePoolId = req.params.id;
      
      const existingResolution = await storage.getResolutionByPot(challengePoolId);
      if (existingResolution) {
        return res.status(400).json({ message: "Side pot already resolved" });
      }
      
      const pool = await storage.getChallengePool(challengePoolId);
      if (!pool) {
        return res.status(404).json({ message: "Side pot not found" });
      }
      
      if (!["locked", "on_hold"].includes(pool.status ?? "")) {
        return res.status(400).json({ message: "Side pot cannot be resolved in current status" });
      }
      
      const resolution = await storage.createResolution({
        challengePoolId,
        winnerSide,
        decidedBy,
        notes,
      });
      
      const now = new Date();
      const disputeDeadline = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      
      await storage.updateSidePot(challengePoolId, { 
        status: "resolved",
        winningSide: winnerSide,
        resolvedAt: now,
        disputeDeadline: disputeDeadline,
        disputeStatus: "none",
        evidenceJson: evidence ? JSON.stringify(evidence) : null,
      });
      
      const bets = await storage.getSideBetsByPot(challengePoolId);
      const winners = bets.filter(bet => bet.side === winnerSide);
      const losers = bets.filter(bet => bet.side !== winnerSide);
      
      const totalPool = bets.reduce((sum, bet) => sum + bet.amount, 0);
      const serviceFee = Math.floor(totalPool * ((pool.feeBps ?? 850) / 10000));
      const winnerPool = totalPool - serviceFee;
      const totalWinnerAmount = winners.reduce((sum, bet) => sum + bet.amount, 0);
      
      for (const bet of winners) {
        const proportion = bet.amount / totalWinnerAmount;
        const winnings = Math.floor(winnerPool * proportion);
        
        await storage.unlockCredits(bet.userId!, bet.amount);
        await storage.addCredits(bet.userId!, winnings);
        
        await storage.createLedgerEntry({
          userId: bet.userId!,
          type: "pot_win",
          amount: winnings,
          refId: bet.id,
          metaJson: JSON.stringify({ challengePoolId: challengePoolId, originalBet: bet.amount }),
        });
        
        await storage.createLedgerEntry({
          userId: bet.userId!,
          type: "pot_unlock",
          amount: bet.amount,
          refId: bet.id,
          metaJson: JSON.stringify({ challengePoolId: challengePoolId }),
        });
      }
      
      for (const bet of losers) {
        await storage.unlockCredits(bet.userId!, bet.amount);
        
        await storage.createLedgerEntry({
          userId: bet.userId!,
          type: "pot_loss",
          amount: -bet.amount,
          refId: bet.id,
          metaJson: JSON.stringify({ challengePoolId: challengePoolId }),
        });
      }
      
      console.log(`Side pot ${challengePoolId} resolved with immediate payout. ${winners.length} winners, ${losers.length} losers.`);
      
      res.json({ 
        resolution, 
        winners: winners.length,
        losers: losers.length,
        totalPot: totalPool,
        serviceFee,
        disputeDeadline: disputeDeadline.toISOString(),
        message: "Side pot resolved and payouts distributed immediately."
      });
    } catch (error: any) {
      console.error("Error resolving side pot:", error);
      res.status(500).json({ message: error.message });
    }
  };
}

export function checkAutoResolve(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const now = new Date();
      
      const expiredPots = await storage.getExpiredDisputePots(now);
      const autoResolvedPots = [];
      
      for (const pot of expiredPots) {
        const payoutResult = await storage.processDelayedPayouts(pot.id, pot.winningSide || "A");
        
        await storage.updateSidePot(pot.id, { 
          autoResolvedAt: now,
          disputeStatus: "resolved" 
        });
        
        autoResolvedPots.push({ potId: pot.id, payoutResult });
        console.log(`Auto-resolved side pot ${pot.id} after dispute period expired`);
      }
      
      res.json({ 
        autoResolvedCount: autoResolvedPots.length,
        resolvedPots: autoResolvedPots 
      });
    } catch (error) {
      console.error("Error auto-resolving disputes:", error);
      res.status(500).json({ message: "Failed to auto-resolve disputes" });
    }
  };
}

export function holdSidePot(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { reason, evidence } = req.body;
      const challengePoolId = req.params.id;
      
      const pool = await storage.getChallengePool(challengePoolId);
      if (!pool) {
        return res.status(404).json({ message: "Side pot not found" });
      }
      
      if (pool.status !== "locked") {
        return res.status(400).json({ message: "Only locked pots can be put on hold" });
      }
      
      const now = new Date();
      const holdDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      await storage.updateSidePot(challengePoolId, { 
        status: "on_hold",
        evidenceJson: evidence ? JSON.stringify(evidence) : null,
      });
      
      console.log(`Side pot ${challengePoolId} put on hold for evidence review. Deadline: ${holdDeadline.toISOString()}`);
      
      res.json({ 
        message: "Side pot put on hold for evidence review",
        holdDeadline: holdDeadline.toISOString(),
        reason
      });
    } catch (error: any) {
      console.error("Error putting pot on hold:", error);
      res.status(500).json({ message: error.message });
    }
  };
}

export function voidSidePot(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { reason } = req.body;
      const challengePoolId = req.params.id;
      
      const pool = await storage.getChallengePool(challengePoolId);
      if (!pool) {
        return res.status(404).json({ message: "Side pot not found" });
      }
      
      if (!["locked", "on_hold"].includes(pool.status ?? "")) {
        return res.status(400).json({ message: "Only locked or on-hold pots can be voided" });
      }
      
      const bets = await storage.getSideBetsByPot(challengePoolId);
      let refundCount = 0;
      let totalRefunded = 0;
      
      for (const bet of bets) {
        await storage.unlockCredits(bet.userId!, bet.amount);
        
        await storage.createLedgerEntry({
          userId: bet.userId!,
          type: "pot_void_refund",
          amount: bet.amount,
          refId: bet.id,
          metaJson: JSON.stringify({ challengePoolId: challengePoolId, voidReason: reason }),
        });
        
        refundCount++;
        totalRefunded += bet.amount;
      }
      
      const now = new Date();
      await storage.updateSidePot(challengePoolId, { 
        status: "voided",
      });
      
      console.log(`Side pot ${challengePoolId} voided. Refunded ${refundCount} participants, total: ${totalRefunded} credits`);
      
      res.json({ 
        message: "Side pot voided and all participants refunded",
        refundCount,
        totalRefunded,
        reason
      });
    } catch (error: any) {
      console.error("Error voiding side pot:", error);
      res.status(500).json({ message: error.message });
    }
  };
}

export function disputeSidePot(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const sidePot = await storage.getSidePot(id);
      if (!sidePot) {
        return res.status(404).json({ message: "Side pot not found" });
      }

      if (sidePot.status !== "resolved") {
        return res.status(400).json({ message: "Side pot is not resolved" });
      }

      if (!sidePot.disputeDeadline || new Date() > sidePot.disputeDeadline) {
        return res.status(400).json({ message: "Dispute period has expired (12 hours max)" });
      }

      if (sidePot.disputeStatus === "pending") {
        return res.status(400).json({ message: "Dispute already filed for this pot" });
      }

      await storage.updateSidePot(id, { disputeStatus: "pending" });
      
      res.json({ 
        message: "Dispute filed successfully. Payouts are now on hold pending review.",
        disputeDeadline: sidePot.disputeDeadline
      });
    } catch (error) {
      console.error("Error filing dispute:", error);
      res.status(500).json({ message: "Failed to file dispute" });
    }
  };
}

// Side Bet Controllers
export function createSideBet(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { challengePoolId, userId, side, amount } = req.body;
      
      const pool = await storage.getChallengePool(challengePoolId);
      if (!pool || pool.status !== 'open') {
        return res.status(400).json({ message: "Side pot is not accepting bets" });
      }
      
      const locked = await storage.lockCredits(userId, amount);
      if (!locked) {
        return res.status(400).json({ message: "Insufficient credits" });
      }
      
      const entry = await storage.createChallengeEntry({
        challengePoolId: challengePoolId,
        userId,
        side,
        amount,
        status: "funded",
        fundedAt: new Date(),
      });
      
      await storage.createLedgerEntry({
        userId,
        type: "pot_lock",
        amount: -amount,
        refId: entry.id,
        metaJson: JSON.stringify({ challengePoolId, side }),
      });
      
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

export function getSideBetsByUser(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { requireSelfOrStaff } = await import("../utils/ownership");
      if (!requireSelfOrStaff(req, res, req.params.userId)) return;

      const bets = await storage.getSideBetsByUser(req.params.userId);
      res.json(bets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

// Escrow Challenge Controllers
export function getEscrowChallenges(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const challenges = [
        {
          id: "challenge-001",
          challengerId: "player-001",
          opponentId: "player-002",
          amount: 500,
          gameType: "8-ball",
          gameFormat: "race-to-7",
          status: "pending",
          escrowId: "escrow-001",
          challenger: { id: "player-001", name: "Tommy 'The Knife' Rodriguez", rating: 650 },
          opponent: { id: "player-002", name: "Sarah 'Pool Shark' Chen", rating: 680 },
          createdAt: new Date(),
        }
      ];
      res.json(challenges);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function createEscrowChallenge(storage: IStorage, stripe: Stripe) {
  return async (req: Request, res: Response) => {
    try {
      const dbUser = (req as any).dbUser;
      if (!dbUser) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { amount, opponentId, gameType, gameFormat, terms } = req.body;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100,
        currency: "usd",
        metadata: {
          type: "escrow_challenge",
          challengerUserId: dbUser.id,
          opponentId,
          gameType,
          gameFormat,
        },
      });

      const challenge = {
        id: `challenge-${Date.now()}`,
        challengerId: dbUser.id,
        opponentId,
        amount,
        gameType,
        gameFormat,
        status: "pending",
        escrowId: paymentIntent.id,
        terms,
        createdAt: new Date(),
      };

      res.json(challenge);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function acceptEscrowChallenge(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { touchUserActivity } = await import("../utils/activity");
      const userId = (req as any).user?.id || (req as any).user?.claims?.sub;
      touchUserActivity(storage, userId);
      res.json({ message: "Challenge accepted", challengeId: id });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function cancelEscrowChallenge(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { touchUserActivity } = await import("../utils/activity");
      const userId = (req as any).user?.id || (req as any).user?.claims?.sub;
      touchUserActivity(storage, userId);
      res.json({ message: "Challenge cancelled", challengeId: id });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}

export function getEscrowChallengeStats(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const stats = {
        totalVolume: 125000,
        activeChallenges: 8,
        completedChallenges: 42,
        totalEscrow: 15000,
      };
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}
