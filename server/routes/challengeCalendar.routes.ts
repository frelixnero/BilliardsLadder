import { Router, Request, Response } from "express";
import { IStorage } from "../storage";
import stripe from "stripe";
import { QRCodeService } from "../services/qrCodeService";
import { isAuthenticated, requireStaffOrOwner } from "../replitAuth";
import { requireAnyAuth } from "../middleware/auth";
import * as challengeController from "../controllers/challengeCalendar.controller";

const router = Router();

export function setupChallengeCalendarRoutes(app: any, storage: IStorage, stripeClient: stripe) {

  const qrCodeService = new QRCodeService(storage);

  // Reads — auth required (challenge data is league-internal)
  app.get("/api/challenges", isAuthenticated, challengeController.getChallenges(storage));
  app.get("/api/challenges/:id", isAuthenticated, challengeController.getChallenge(storage));
  app.get("/api/challenges/:id/qr", isAuthenticated, challengeController.getQRCode(storage));
  app.get("/api/halls/:hallId/challenge-policy", isAuthenticated, challengeController.getChallengePolicy(storage));
  app.get("/api/challenges/:id/fees", isAuthenticated, challengeController.getChallengeFees(storage));
  app.get("/api/challenges/:challengeId/qr-code", isAuthenticated, challengeController.generateQRCode(storage));
  app.get("/api/challenges/check-in", isAuthenticated, challengeController.legacyCheckIn);
  app.get("/api/challenges/:challengeId/check-in-status", isAuthenticated, challengeController.getCheckInStatus(storage));

  // Writes — players can create/cancel/check-in their own challenges
  app.post("/api/challenges", requireAnyAuth, challengeController.createChallenge(storage));
  app.patch("/api/challenges/:id", requireAnyAuth, challengeController.updateChallenge(storage));
  app.post("/api/challenges/:id/cancel", requireAnyAuth, challengeController.cancelChallenge(storage, stripeClient));
  app.post("/api/challenges/:id/checkin", requireAnyAuth, challengeController.checkInToChallenge(storage));
  app.post("/api/challenges/secure-check-in", requireAnyAuth, challengeController.secureCheckIn(storage));
  app.post("/api/challenges/:challengeId/check-in", requireAnyAuth, challengeController.manualCheckIn(storage));

  // Hall policy update + fee waiver are staff/operator actions
  app.put("/api/halls/:hallId/challenge-policy", requireStaffOrOwner, challengeController.updateChallengePolicy(storage));
  app.post("/api/challenge-fees/:feeId/waive", requireStaffOrOwner, challengeController.waiveFee(storage));

  // Existing staff guards (already correct)
  app.post("/api/challenge-fees/evaluate-all", requireStaffOrOwner, challengeController.evaluateAllFees);
  app.post("/api/challenges/:challengeId/evaluate-fees", requireStaffOrOwner, challengeController.evaluateChallengeFees);
  app.get("/api/admin/fee-scheduler/status", requireStaffOrOwner, challengeController.getFeeSchedulerStatus);

  app.options("/api/challenges/*", challengeController.handleCORS);
}

export default router;
