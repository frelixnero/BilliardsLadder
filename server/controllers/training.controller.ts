import { Request, Response } from "express";
import { IStorage } from "../storage";
import { generateCoachInsights } from '../services/coachService';
import type { SessionData } from '../services/coachService';

export function createTrainingSession(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { playerId, ladderId, focusArea, durationMinutes } = req.body;
      
      if (!playerId || !ladderId || !focusArea || !durationMinutes) {
        return res.status(400).json({ 
          error: "playerId, ladderId, focusArea, and durationMinutes are required" 
        });
      }

      const sessionData = {
        playerId,
        hallId: ladderId,
        ladderId,
        sessionType: "practice",
        focusArea,
        date: new Date(),
        coachScore: 0,
        hours: durationMinutes / 60,
      };

      const session = await storage.createTrainingSession(sessionData);
      
      res.json({
        id: session.id,
        playerId: session.playerId,
        ladderId: session.ladderId,
        focusArea: session.focusArea,
        durationMinutes,
        sessionDate: session.date,
        shots: []
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

export function recordShots(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { shots } = req.body;

      if (!shots || !Array.isArray(shots)) {
        return res.status(400).json({ error: "Shots array is required" });
      }

      const validatedShots = shots.map((shot, index) => ({
        sessionId: id,
        timestamp: index * 1000,
        result: shot.success ? "MAKE" : "MISS",
        shotType: shot.shotType,
        distanceIn: shot.distance || 0,
        spinType: shot.spinUsed || "center ball",
        positionalErrorIn: shot.positionalError || 0,
      }));

      const recordedShots = await storage.recordShots(id, validatedShots);
      res.json({ message: "Shots recorded", count: recordedShots.length });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}

export function getSessionInsights(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const session = await storage.getTrainingSession(id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const shots = await storage.getSessionShots(id);
      
      const sessionData: SessionData = {
        shots: shots.map(s => ({
          timestamp: s.timestamp,
          result: s.result as 'MAKE' | 'MISS',
          distanceIn: s.distanceIn,
          cutAngleDeg: s.cutAngleDeg || 0,
          spinType: s.spinType as any,
          shotType: s.shotType as any,
          cueSpeed: s.cueSpeed ?? undefined,
          positionalErrorIn: s.positionalErrorIn ?? undefined,
          difficultyScore: s.difficultyScore ?? undefined
        })),
        makePercentage: session.makePercentage ?? undefined,
        breakSuccess: session.breakSuccess ?? undefined,
        avgBallsRun: session.avgBallsRun ?? undefined,
        safetyWinPct: session.safetyWinPct ?? undefined
      };

      const tips = generateCoachInsights(sessionData);
      
      let coachScore = 100;
      tips.forEach(tip => {
        if (tip.severity === 'fix') coachScore -= 15;
        else if (tip.severity === 'focus') coachScore -= 10;
        else if (tip.severity === 'info') coachScore -= 5;
      });
      coachScore = Math.max(0, coachScore);
      
      const insights = tips.map(tip => `${tip.title}: ${tip.body}`);
      
      res.json({ tips, insights, coachScore, sessionStats: sessionData });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}

export function getPlayerSessions(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      const { requireSelfPlayerOrStaff } = await import("../utils/ownership");
      if (!(await requireSelfPlayerOrStaff(req, res, playerId, storage))) return;

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const sessions = await storage.getPlayerSessions(playerId, limit);
      res.json(sessions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}

export function getHallLeaderboard(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      const { hallId } = req.params;
      const period = req.query.period as string || new Date().toISOString().slice(0, 7);

      const leaderboard = await storage.getHallLeaderboard(hallId, period);
      res.json(leaderboard);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}

export function calculateMonthlyRewards(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = req.user as any;
      const dbUser = await storage.getUser(user.claims.sub);
      
      if (!dbUser || (dbUser.globalRole !== "OWNER" && dbUser.globalRole !== "STAFF" && dbUser.globalRole !== "OPERATOR")) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { period, hallId } = req.body;
      
      if (!period || !/^\d{4}-\d{2}$/.test(period)) {
        return res.status(400).json({ error: "Valid period (YYYY-MM) is required" });
      }

      await storage.calculateMonthlyScores(period);
      
      const leaderboard = await storage.getHallLeaderboard(hallId || "all", period);
      const winners = leaderboard.filter(score => score.isWinner);

      const winnersData = winners.map(winner => ({
        playerId: winner.playerId,
        hallId: winner.hallId,
        ladderId: winner.ladderId,
        discountPercent: winner.rank === 1 ? 100 : 50,
        period
      }));

      const { generateMonthlyRewardCoupons } = await import('../services/rewardService');
      const results = await generateMonthlyRewardCoupons(winnersData as any);

      const appliedCount = results.filter((r: any) => r.applied).length;
      const failedCount = results.filter((r: any) => !r.applied).length;

      res.json({
        message: "Monthly rewards processed successfully",
        applied: appliedCount,
        failed: failedCount,
        rewards: results,
        period
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}

export function getRewardHistory(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = req.user as any;
      const dbUser = await storage.getUser(user.claims.sub);
      
      if (!dbUser || (dbUser.globalRole !== "OWNER" && dbUser.globalRole !== "STAFF" && dbUser.globalRole !== "OPERATOR")) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const period = req.query.period as string;
      const hallId = req.query.hallId as string;
      const status = req.query.status as string;

      let rewards = await storage.getRewardsForPeriod(period || new Date().toISOString().slice(0, 7));

      if (hallId && hallId !== "all") {
        rewards = rewards.filter(r => r.hallId === hallId);
      }

      if (status === "applied") {
        rewards = rewards.filter(r => r.appliedToStripe);
      } else if (status === "pending") {
        rewards = rewards.filter(r => !r.appliedToStripe);
      }

      const players = await storage.getAllPlayers();
      const halls = await storage.getAllPoolHalls();

      const enrichedRewards = rewards.map(reward => {
        const player = players.find(p => p.id === reward.playerId);
        const hall = halls.find(h => h.id === reward.hallId);
        return {
          ...reward,
          playerName: player?.name,
          hallName: hall?.name
        };
      });

      res.json(enrichedRewards);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}

export function triggerMonthlyRewards(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = req.user as any;
      const dbUser = await storage.getUser(user.claims.sub);
      
      if (!dbUser || (dbUser.globalRole !== "OWNER" && dbUser.globalRole !== "STAFF")) {
        return res.status(403).json({ error: "Owner or Staff access required" });
      }

      const { period } = req.body;

      const { getTrainingRewardsScheduler } = await import('../trainingRewardsScheduler');
      const scheduler = getTrainingRewardsScheduler();

      if (!scheduler) {
        return res.status(500).json({ error: "Training rewards scheduler not initialized" });
      }

      const result = await scheduler.processMonthlyRewards(period);

      res.json({
        message: "Monthly rewards processing completed",
        ...result
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
