import { Request, Response } from "express";
import { IStorage } from "../storage";
import { 
  insertChallengeSchema, 
  insertChallengeFeeSchema, 
  insertChallengeCheckInSchema, 
  insertChallengePolicySchema,
  Challenge
} from "@shared/schema";
import dayjs from "dayjs";
import stripe from "stripe";
import { sanitizeResponse } from "../middleware/sanitizeMiddleware";
import { getFeeScheduler } from "../services/feeScheduler";
import { QRCodeService } from "../services/qrCodeService";
import { touchUserActivity } from "../utils/activity";

export function getChallenges(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { playerId, hallId, startDate, endDate, status } = req.query;
      
      let challenges: Challenge[] = [];
      
      if (playerId) {
        challenges = await storage.getChallengesByPlayer(playerId as string);
      } else if (hallId) {
        challenges = await storage.getChallengesByHall(hallId as string);
      } else if (startDate && endDate) {
        challenges = await storage.getChallengesByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        challenges = await storage.getUpcomingChallenges(50);
      }
      
      if (status) {
        challenges = challenges.filter(c => c.status === status);
      }
      
      res.json(challenges);
    } catch (error: any) {
      console.error("Get challenges error:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

export function getChallenge(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const challenge = await storage.getChallenge(id);
      
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      const checkIns = await storage.getChallengeCheckInsByChallenge(id);
      const fees = await storage.getChallengeFeesByChallenge(id);
      
      res.json({
        challenge,
        checkIns,
        fees
      });
    } catch (error: any) {
      console.error("Get challenge error:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

export function createChallenge(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const validatedData = insertChallengeSchema.parse(req.body);
      
      const scheduledAt = new Date(validatedData.scheduledAt);
      const now = new Date();
      
      if (scheduledAt <= now) {
        return res.status(400).json({ error: "Challenge must be scheduled in the future" });
      }
      
      const playerA = await storage.getPlayer(validatedData.aPlayerId);
      const playerB = await storage.getPlayer(validatedData.bPlayerId);
      
      if (!playerA || !playerB) {
        return res.status(400).json({ error: "One or both players not found" });
      }
      
      const existingChallenges = await storage.getChallengesByDateRange(
        dayjs(scheduledAt).subtract(2, 'hours').toDate(),
        dayjs(scheduledAt).add(2, 'hours').toDate()
      );
      
      const conflicts = existingChallenges.filter(c => 
        (c.aPlayerId === validatedData.aPlayerId || c.bPlayerId === validatedData.aPlayerId ||
         c.aPlayerId === validatedData.bPlayerId || c.bPlayerId === validatedData.bPlayerId) &&
        c.status !== 'cancelled'
      );
      
      if (conflicts.length > 0) {
        return res.status(400).json({ error: "Player has conflicting challenge scheduled within 2 hours" });
      }
      
      const challenge = await storage.createChallenge(validatedData);

      const userId = (req as any).user?.id || (req as any).user?.claims?.sub;
      touchUserActivity(storage, userId);
      for (const playerId of [validatedData.aPlayerId, validatedData.bPlayerId]) {
        const player = await storage.getPlayer(playerId);
        if (player?.userId) touchUserActivity(storage, player.userId);
      }

      // Fire-and-forget: notify the opponent that they've been challenged.
      try {
        const { notifyChallengeReceived } = await import("../services/notifyService");
        notifyChallengeReceived({
          challengeId: challenge.id,
          challengerName: playerA.name,
          opponentUserId: playerB.userId,
          stakesCents: challenge.stakes ?? 0,
          gameType: challenge.gameType ?? "8-ball",
        });
      } catch (notifyErr: any) {
        console.warn("[challenges] notify failed:", notifyErr?.message);
      }

      res.status(201).json(challenge);
    } catch (error: any) {
      console.error("Create challenge error:", error);
      res.status(400).json({ error: error.message });
    }
  };
}

export function updateChallenge(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const challenge = await storage.getChallenge(id);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      if (challenge.status === 'completed') {
        return res.status(400).json({ error: "Cannot update completed challenge" });
      }
      
      const updatedChallenge = await storage.updateChallenge(id, updates);

      // Phase 1 Rack Points: award win + (optional) upset bonus when a challenge
      // transitions to "completed" with a valid winnerId.
      // Idempotency is double-guarded:
      //   1) Pre-update status check rejects re-completion at the controller layer.
      //   2) The ledger has a UNIQUE(user_id, reason, ref_id) partial index so even
      //      under concurrent PATCHes only one award per (user, reason, challengeId)
      //      will land — see rackPointsService.award().
      if (
        updatedChallenge &&
        updatedChallenge.status === "completed" &&
        updatedChallenge.winnerId &&
        challenge.status !== "completed" &&
        // Reject impossible winners — only the two participants can win.
        (updatedChallenge.winnerId === updatedChallenge.aPlayerId ||
          updatedChallenge.winnerId === updatedChallenge.bPlayerId)
      ) {
        try {
          const winnerPlayerId = updatedChallenge.winnerId;
          const loserPlayerId =
            winnerPlayerId === updatedChallenge.aPlayerId
              ? updatedChallenge.bPlayerId
              : updatedChallenge.aPlayerId;
          const [winnerPlayer, loserPlayer] = await Promise.all([
            storage.getPlayer(winnerPlayerId),
            storage.getPlayer(loserPlayerId),
          ]);
          if (winnerPlayer?.userId) {
            const { recordMatchWin } = await import("../services/rackPointsService");
            recordMatchWin({
              winnerUserId: winnerPlayer.userId,
              winnerRating: winnerPlayer.rating,
              loserRating: loserPlayer?.rating,
              matchId: updatedChallenge.id,
            });
          }
        } catch (rewardErr: any) {
          console.warn("[challenges] rack points award failed:", rewardErr?.message);
        }

        // Fire-and-forget: notify both players of the result.
        try {
          const { notifyMatchResult } = await import("../services/notifyService");
          const winnerPlayerId = updatedChallenge.winnerId!;
          const loserPlayerId =
            winnerPlayerId === updatedChallenge.aPlayerId
              ? updatedChallenge.bPlayerId
              : updatedChallenge.aPlayerId;
          const [winnerPlayer, loserPlayer] = await Promise.all([
            storage.getPlayer(winnerPlayerId),
            storage.getPlayer(loserPlayerId),
          ]);
          if (winnerPlayer?.userId) {
            notifyMatchResult({
              challengeId: updatedChallenge.id,
              recipientUserId: winnerPlayer.userId,
              won: true,
              opponentName: loserPlayer?.name ?? "your opponent",
            });
          }
          if (loserPlayer?.userId) {
            notifyMatchResult({
              challengeId: updatedChallenge.id,
              recipientUserId: loserPlayer.userId,
              won: false,
              opponentName: winnerPlayer?.name ?? "your opponent",
            });
          }
        } catch (notifyErr: any) {
          console.warn("[challenges] notify match result failed:", notifyErr?.message);
        }
      }

      // Detect status transition to "accepted" and notify the challenger.
      if (
        updatedChallenge &&
        updatedChallenge.status === "accepted" &&
        challenge.status !== "accepted"
      ) {
        try {
          const { notifyChallengeAccepted } = await import("../services/notifyService");
          const [aPlayer, bPlayer] = await Promise.all([
            storage.getPlayer(updatedChallenge.aPlayerId),
            storage.getPlayer(updatedChallenge.bPlayerId),
          ]);
          if (aPlayer?.userId) {
            notifyChallengeAccepted({
              challengeId: updatedChallenge.id,
              recipientUserId: aPlayer.userId,
              otherPlayerName: bPlayer?.name ?? "Your opponent",
            });
          }
        } catch (notifyErr: any) {
          console.warn("[challenges] notify accept failed:", notifyErr?.message);
        }
      }

      res.json(updatedChallenge);
    } catch (error: any) {
      console.error("Update challenge error:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

export function cancelChallenge(storage: IStorage, stripeClient: stripe) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason, cancelledBy } = req.body;
      
      const challenge = await storage.getChallenge(id);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      if (challenge.status !== 'scheduled') {
        return res.status(400).json({ error: "Only scheduled challenges can be cancelled" });
      }
      
      await storage.updateChallenge(id, {
        status: 'cancelled'
      });
      
      const policy = await storage.getChallengesPolicyByHall(challenge.hallId);
      if (policy && policy.cancellationFeeEnabled) {
        const hoursUntilChallenge = dayjs(challenge.scheduledAt).diff(dayjs(), 'hours');
        
        if (hoursUntilChallenge < (policy.cancellationThresholdHours ?? 24)) {
          const playerId = cancelledBy || challenge.aPlayerId;
          const feeAmount = policy.cancellationFeeAmount ?? 1000;
          
          try {
            const player = await storage.getPlayer(playerId);
            if (!player || !player.stripeCustomerId) {
              console.error('Cannot charge cancellation fee: Player not found or no Stripe customer ID');
            } else {
              const customer = await stripeClient.customers.retrieve(player.stripeCustomerId);
              const defaultPaymentMethodId = (customer as any).invoice_settings?.default_payment_method;
              
              let feeStatus = 'pending';
              let stripeChargeId;
              
              if (defaultPaymentMethodId) {
                const idempotencyKey = `cancellation_${id}_${playerId}`;
                
                try {
                  const paymentIntent = await stripeClient.paymentIntents.create({
                    amount: feeAmount,
                    currency: 'usd',
                    customer: player.stripeCustomerId,
                    payment_method: defaultPaymentMethodId,
                    description: `Challenge cancellation fee: ${hoursUntilChallenge}h notice`,
                    metadata: {
                      type: 'challenge_fee',
                      challengeId: id,
                      playerId,
                      feeType: 'cancellation'
                    },
                    confirmation_method: 'automatic',
                    confirm: true,
                    off_session: true
                  }, {
                    idempotencyKey
                  });
                  
                  feeStatus = paymentIntent.status === 'succeeded' ? 'charged' : 'pending';
                  stripeChargeId = paymentIntent.id;
                } catch (stripeError: any) {
                  console.error('Stripe payment failed for cancellation fee:', stripeError);
                  feeStatus = 'failed';
                }
              }
              
              await storage.createChallengeFee({
                challengeId: id,
                playerId,
                feeType: 'cancellation',
                amount: feeAmount,
                scheduledAt: challenge.scheduledAt,
                actualAt: new Date(),
                minutesLate: 0,
                stripeChargeId,
                status: feeStatus
              });
            }
          } catch (error) {
            console.error('Error processing cancellation fee:', error);
          }
        }
      }
      
      res.json({ message: "Challenge cancelled", reason });
    } catch (error: any) {
      console.error("Cancel challenge error:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

export function checkInToChallenge(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { playerId, checkedInBy = 'player', location = 'mobile_app' } = req.body;
      
      const challenge = await storage.getChallenge(id);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      if (challenge.status !== 'scheduled') {
        return res.status(400).json({ error: "Challenge is not available for check-in" });
      }
      
      if (playerId !== challenge.aPlayerId && playerId !== challenge.bPlayerId) {
        return res.status(403).json({ error: "Player not part of this challenge" });
      }
      
      const existingCheckIns = await storage.getChallengeCheckInsByChallenge(id);
      const alreadyCheckedIn = existingCheckIns.find(ci => ci.playerId === playerId);
      
      if (alreadyCheckedIn) {
        return res.status(400).json({ error: "Player already checked in" });
      }
      
      const checkIn = await storage.createChallengeCheckIn({
        challengeId: id,
        playerId,
        checkedInAt: new Date(),
        checkedInBy,
        location
      });

      const checkInPlayer = await storage.getPlayer(playerId);
      if (checkInPlayer?.userId) touchUserActivity(storage, checkInPlayer.userId);
      
      const allCheckIns = await storage.getChallengeCheckInsByChallenge(id);
      if (allCheckIns.length === 2) {
        await storage.updateChallenge(id, {
          status: 'in_progress',
          checkedInAt: new Date()
        });
      }
      
      res.json(checkIn);
    } catch (error: any) {
      console.error("Check-in error:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

export function getQRCode(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const challenge = await storage.getChallenge(id);
      
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      const qrData = {
        type: 'challenge_checkin',
        challengeId: id,
        challengeName: `${challenge.aPlayerName} vs ${challenge.bPlayerName}`,
        scheduledAt: challenge.scheduledAt,
        hallName: challenge.hallName
      };
      
      res.json({ qrData: JSON.stringify(qrData) });
    } catch (error: any) {
      console.error("QR code generation error:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

export function getChallengePolicy(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { hallId } = req.params;
      const policy = await storage.getChallengesPolicyByHall(hallId);
      
      if (!policy) {
        return res.json({
          hallId,
          lateFeeEnabled: true,
          lateFeeAmount: 500,
          lateFeeThresholdMinutes: 15,
          noShowFeeEnabled: true,
          noShowFeeAmount: 1500,
          noShowThresholdMinutes: 45,
          cancellationFeeEnabled: true,
          cancellationFeeAmount: 1000,
          cancellationThresholdHours: 24,
          gracePeriodMinutes: 5,
          autoChargeEnabled: true,
          requireConfirmation: false
        });
      }
      
      res.json(policy);
    } catch (error: any) {
      console.error("Get challenge policy error:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

export function updateChallengePolicy(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { hallId } = req.params;
      const { updatedBy } = req.body;
      
      if (!updatedBy) {
        return res.status(400).json({ error: "updatedBy field required" });
      }
      
      const validatedData = insertChallengePolicySchema.parse({
        ...req.body,
        hallId,
        updatedBy
      });
      
      const existingPolicy = await storage.getChallengesPolicyByHall(hallId);
      
      let policy;
      if (existingPolicy) {
        policy = await storage.updateChallengePolicy(existingPolicy.id, validatedData);
      } else {
        policy = await storage.createChallengePolicy(validatedData);
      }
      
      res.json(policy);
    } catch (error: any) {
      console.error("Update challenge policy error:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

export function getChallengeFees(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const fees = await storage.getChallengeFeesByChallenge(id);
      res.json(fees);
    } catch (error: any) {
      console.error("Get challenge fees error:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

export function waiveFee(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { feeId } = req.params;
      const { waivedBy, reason } = req.body;
      
      if (!waivedBy || !reason) {
        return res.status(400).json({ error: "waivedBy and reason required" });
      }
      
      const fee = await storage.getChallengeFee(feeId);
      if (!fee) {
        return res.status(404).json({ error: "Fee not found" });
      }
      
      if (fee.status !== 'pending') {
        return res.status(400).json({ error: "Only pending fees can be waived" });
      }
      
      const updatedFee = await storage.updateChallengeFee(feeId, {
        status: 'waived',
        waivedAt: new Date(),
        waivedBy,
        waiverReason: reason
      });
      
      res.json(updatedFee);
    } catch (error: any) {
      console.error("Waive fee error:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

export async function evaluateAllFees(req: Request, res: Response) {
  try {
    const scheduler = getFeeScheduler();
    if (!scheduler) {
      return res.status(500).json({ error: "Fee scheduler not initialized" });
    }
    
    const result = await scheduler.runEvaluation();
    res.json(result);
  } catch (error: any) {
    console.error("Manual fee evaluation error:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function evaluateChallengeFees(req: Request, res: Response) {
  try {
    const { challengeId } = req.params;
    const scheduler = getFeeScheduler();
    if (!scheduler) {
      return res.status(500).json({ error: "Fee scheduler not initialized" });
    }
    
    const result = await scheduler.evaluateChallenge(challengeId);
    res.json(result);
  } catch (error: any) {
    console.error("Challenge fee evaluation error:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function getFeeSchedulerStatus(req: Request, res: Response) {
  try {
    const scheduler = getFeeScheduler();
    if (!scheduler) {
      return res.status(500).json({ error: "Fee scheduler not initialized" });
    }
    
    const status = scheduler.getStatus();
    res.json(status);
  } catch (error: any) {
    console.error("Fee scheduler status error:", error);
    res.status(500).json({ error: error.message });
  }
}

export function generateQRCode(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { challengeId } = req.params;
      const qrCodeService = new QRCodeService(storage);
      
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      const protocol = req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const host = req.get('host') || 'localhost:5000';
      const requestContext = {
        protocol,
        host,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      };
      
      const qrResult = await qrCodeService.generateChallengeQRCode(challengeId, requestContext);
      
      res.json({
        challengeId,
        qrCodeDataUrl: qrResult.qrCodeDataUrl,
        checkInUrl: qrResult.checkInUrl,
        token: qrResult.token,
        expiresIn: qrResult.expiresIn,
        instructions: "Scan this QR code or tap the link to check in. Valid for 15 minutes."
      });
    } catch (error: any) {
      console.error("QR code generation error:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

export function secureCheckIn(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      const qrCodeService = new QRCodeService(storage);
      
      if (!token) {
        return res.status(400).json({ error: "Check-in token required" });
      }
      
      const user = req.user as any;
      const authenticatedUserId = user.claims?.sub || user.id;
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Invalid authentication session" });
      }
      
      const requestContext = {
        protocol: req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http',
        host: req.get('host') || 'localhost:5000',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      };
      
      const result = await qrCodeService.processSecureCheckIn(token, authenticatedUserId, requestContext);
      
      res.json(result);
    } catch (error: any) {
      console.error("Secure check-in processing error:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

export function legacyCheckIn(req: Request, res: Response) {
  res.status(400).json({ 
    error: "This endpoint is deprecated for security reasons",
    message: "Please use POST /api/challenges/secure-check-in with authentication",
    migration: "Update your app to use the secure check-in endpoint"
  });
}

export function manualCheckIn(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { challengeId } = req.params;
      const qrCodeService = new QRCodeService(storage);
      
      const user = req.user as any;
      const authenticatedUserId = user.claims?.sub || user.id;
      
      if (!authenticatedUserId) {
        return res.status(401).json({ error: "Invalid authentication session" });
      }
      
      const player = await storage.getPlayerByUserId(authenticatedUserId);
      if (!player) {
        return res.status(400).json({ error: "Player profile not found" });
      }
      
      const challenge = await storage.getChallenge(challengeId);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found" });
      }
      
      if (challenge.aPlayerId !== player.id && challenge.bPlayerId !== player.id) {
        return res.status(403).json({ error: "Not authorized for this challenge" });
      }
      
      const secureQRData = {
        challengeId,
        nonce: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        signature: "manual-checkin"
      };
      
      const result = await (qrCodeService as any).processPlayerCheckIn(secureQRData as any, player.id);
      
      res.json(result);
    } catch (error: any) {
      console.error("Manual check-in error:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

export function getCheckInStatus(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { challengeId } = req.params;
      const qrCodeService = new QRCodeService(storage);
      
      const status = await qrCodeService.getChallengeCheckInStatus(challengeId);
      
      res.json(status);
    } catch (error: any) {
      console.error("Check-in status error:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

export function handleCORS(req: Request, res: Response) {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.header("Access-Control-Allow-Credentials", "true");
  res.status(200).end();
}
