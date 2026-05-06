import type { Express } from "express";
import { IStorage } from "../storage";
import Stripe from "stripe";
import { isAuthenticated, requireStaffOrOwner } from "../replitAuth";
import { requireAnyAuth } from "../middleware/auth";
import * as poolController from "../controllers/pool.controller";

export function setupPoolRoutes(app: Express, storage: IStorage, stripe: Stripe) {
  // Kelly pools
  app.get("/api/kelly-pools", isAuthenticated, poolController.getKellyPools(storage));
  app.post("/api/kelly-pools", requireAnyAuth, poolController.createKellyPool(storage));
  app.put("/api/kelly-pools/:id", requireAnyAuth, poolController.updateKellyPool(storage));

  // Money games
  app.get("/api/money-games", isAuthenticated, poolController.getMoneyGames(storage));
  app.get("/api/money-games/:id", isAuthenticated, poolController.getMoneyGame(storage));
  app.post("/api/money-games", requireAnyAuth, poolController.createMoneyGame(storage));
  app.post("/api/money-games/:id/join", requireAnyAuth, poolController.joinMoneyGame(storage));
  app.post("/api/money-games/:id/start", requireAnyAuth, poolController.startMoneyGame(storage));
  app.put("/api/money-games/:id", requireAnyAuth, poolController.updateMoneyGame(storage));
  app.delete("/api/money-games/:id", requireStaffOrOwner, poolController.deleteMoneyGame(storage));

  // Side pots — players create, staff resolve
  app.get("/api/side-pots", isAuthenticated, poolController.getSidePots(storage));
  app.post("/api/side-pots", requireAnyAuth, poolController.createSidePot(storage));
  app.put("/api/side-pots/:id", requireAnyAuth, poolController.updateSidePot(storage));
  app.get("/api/side-pots/:id/details", isAuthenticated, poolController.getSidePotDetails(storage));
  app.post("/api/side-pots/:id/resolve", requireStaffOrOwner, poolController.resolveSidePot(storage));
  app.post("/api/side-pots/check-auto-resolve", requireStaffOrOwner, poolController.checkAutoResolve(storage));
  app.post("/api/side-pots/:id/hold", requireStaffOrOwner, poolController.holdSidePot(storage));
  app.post("/api/side-pots/:id/void", requireStaffOrOwner, poolController.voidSidePot(storage));
  app.post("/api/side-pots/:id/dispute", requireAnyAuth, poolController.disputeSidePot(storage));

  // Side bets
  app.post("/api/side-bets", requireAnyAuth, poolController.createSideBet(storage));
  app.get("/api/side-bets/user/:userId", requireAnyAuth, poolController.getSideBetsByUser(storage));

  // Escrow challenges
  app.get("/api/escrow-challenges", isAuthenticated, poolController.getEscrowChallenges(storage));
  app.post("/api/escrow-challenges", requireAnyAuth, poolController.createEscrowChallenge(storage, stripe));
  app.post("/api/escrow-challenges/:id/accept", requireAnyAuth, poolController.acceptEscrowChallenge(storage));
  app.get("/api/escrow-challenges/stats", isAuthenticated, poolController.getEscrowChallengeStats(storage));
}
