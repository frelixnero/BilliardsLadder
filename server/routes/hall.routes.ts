import type { Express } from "express";
import { isAuthenticated, requireOwner, requireStaffOrOwner } from "../replitAuth";
import { requireAnyAuth } from "../middleware/auth";
import * as hallController from "../controllers/hall.controller";

export function registerHallRoutes(app: Express) {

  // Public reads — needed by landing/marketing pages
  app.get("/api/halls", hallController.getAllHalls);
  app.get("/api/halls/:hallId", hallController.getHallDetails);
  app.get("/api/hall-matches", hallController.getAllHallMatches);
  app.get("/api/halls/:hallId/stats", hallController.getHallStats);

  // Roster reads require auth
  app.get("/api/halls/:hallId/roster", isAuthenticated, hallController.getHallRoster);

  // Match writes — players record their matches
  app.post("/api/hall-matches", requireAnyAuth, hallController.createHallMatch);
  app.patch("/api/hall-matches/:matchId", requireAnyAuth, hallController.updateHallMatch);

  // Roster management — staff/operator level
  app.post("/api/halls/:hallId/roster", requireStaffOrOwner, hallController.addPlayerToRoster);
  app.delete("/api/halls/:hallId/roster/:rosterId", requireStaffOrOwner, hallController.removePlayerFromRoster);

  // Admin endpoints — owner only
  app.post("/api/admin/halls/:hallId/unlock-battles", requireOwner, hallController.unlockHallBattles);
  app.post("/api/admin/halls/:hallId/lock-battles", requireOwner, hallController.lockHallBattles);
  app.get("/api/admin/halls/battles-status", requireStaffOrOwner, hallController.getBattlesStatus);
}
