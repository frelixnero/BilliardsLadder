import type { Express } from "express";
import { IStorage } from "../storage";
import { isAuthenticated, requireStaffOrOwner } from "../replitAuth";
import { requireAnyAuth } from "../middleware/auth";
import * as rookieController from "../controllers/rookie.controller";

export function setupRookieRoutes(app: Express, storage: IStorage) {
  app.get("/api/rookie/matches",
    isAuthenticated,
    rookieController.getAllRookieMatches(storage)
  );

  app.get("/api/rookie/matches/player/:playerId",
    requireAnyAuth,
    rookieController.getRookieMatchesByPlayer(storage)
  );

  app.post("/api/rookie/matches",
    requireAnyAuth,
    rookieController.createRookieMatch(storage)
  );

  app.put("/api/rookie/matches/:id/complete",
    requireStaffOrOwner,
    rookieController.completeRookieMatch(storage)
  );

  app.get("/api/rookie/events",
    isAuthenticated,
    rookieController.getAllRookieEvents(storage)
  );

  app.post("/api/rookie/events",
    requireStaffOrOwner,
    rookieController.createRookieEvent(storage)
  );

  // Public leaderboard
  app.get("/api/rookie/leaderboard",
    rookieController.getRookieLeaderboard(storage)
  );

  app.get("/api/rookie/achievements/:playerId",
    isAuthenticated,
    rookieController.getRookieAchievements(storage)
  );

  app.get("/api/rookie/subscription/:playerId",
    requireAnyAuth,
    rookieController.getRookieSubscription(storage)
  );

  app.post("/api/rookie/subscription",
    requireAnyAuth,
    rookieController.createRookieSubscription(storage)
  );
}
