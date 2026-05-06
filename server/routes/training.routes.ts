import type { Express } from "express";
import { IStorage } from "../storage";
import { isAuthenticated, requireOwner } from "../replitAuth";
import { requireAnyAuth } from "../middleware/auth";
import * as trainingController from "../controllers/training.controller";

export function setupTrainingRoutes(app: Express, storage: IStorage) {
  app.post("/api/training/sessions",
    requireAnyAuth,
    trainingController.createTrainingSession(storage)
  );

  app.post("/api/training/sessions/:id/shots",
    requireAnyAuth,
    trainingController.recordShots(storage)
  );

  app.get("/api/training/sessions/:id/insights",
    requireAnyAuth,
    trainingController.getSessionInsights(storage)
  );

  app.get("/api/training/player/:playerId/sessions",
    requireAnyAuth,
    trainingController.getPlayerSessions(storage)
  );

  app.get("/api/training/hall/:hallId/leaderboard",
    isAuthenticated,
    trainingController.getHallLeaderboard(storage)
  );

  // Reward calculation/trigger — owner only (writes Stripe coupons + emails)
  app.post("/api/training/rewards/monthly",
    requireOwner,
    trainingController.calculateMonthlyRewards(storage)
  );

  app.get("/api/training/rewards/history",
    requireOwner,
    trainingController.getRewardHistory(storage)
  );

  app.post("/api/admin/trigger-monthly-rewards",
    requireOwner,
    trainingController.triggerMonthlyRewards(storage)
  );
}
