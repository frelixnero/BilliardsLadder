import type { Express, Request, Response, NextFunction } from "express";
import { requireOwner, requireStaffOrOwner } from "../replitAuth";
import { requireAnyAuth } from "../middleware/auth";
import * as adminController from "../controllers/admin.controller";

const appealRateLimits = new Map<string, { count: number; resetAt: number }>();
const APPEAL_RATE_WINDOW_MS = 15 * 60 * 1000;
const APPEAL_RATE_MAX = 5;

function appealRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const entry = appealRateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    appealRateLimits.set(ip, { count: 1, resetAt: now + APPEAL_RATE_WINDOW_MS });
    return next();
  }
  if (entry.count >= APPEAL_RATE_MAX) {
    return res.status(429).json({ error: "Too many appeal requests. Please try again later." });
  }
  entry.count++;
  return next();
}

export function registerAdminRoutes(app: Express) {
  app.post("/api/admin/staff/invite", requireOwner, adminController.inviteStaff);
  app.post("/api/admin/staff/update-share", requireOwner, adminController.updateStaffShare);
  app.get("/api/admin/payouts", requireOwner, adminController.getPayoutHistory);
  app.get("/api/admin/connect/:userId", requireOwner, adminController.getConnectAccountStatus);
  app.get("/api/admin/organization/seats", requireOwner, adminController.getOrganizationSeats);
  app.post("/api/admin/organization/seats", requireOwner, adminController.updateOrganizationSeats);
  app.get("/api/admin/subscription-details", requireOwner, adminController.getSubscriptionDetails);

  app.post("/api/admin/users/:id/ban", requireStaffOrOwner, adminController.banUser);
  app.post("/api/admin/users/:id/suspend", requireStaffOrOwner, adminController.suspendUser);
  app.post("/api/admin/users/:id/unban", requireStaffOrOwner, adminController.unbanUser);
  app.get("/api/admin/bans", requireStaffOrOwner, adminController.getBannedUsers);
  app.get("/api/admin/users", requireStaffOrOwner, adminController.getAllUsersAdmin);

  // Ban Appeals (submit is public - banned users can't auth, admin review requires auth)
  app.post("/api/appeals", appealRateLimit, adminController.submitAppeal);
  app.get("/api/admin/appeals", requireStaffOrOwner, adminController.getAllAppeals);
  app.get("/api/admin/appeals/user/:userId", requireStaffOrOwner, adminController.getUserAppeals);
  app.post("/api/admin/appeals/:id/review", requireStaffOrOwner, adminController.reviewAppeal);
}

export function registerOperatorRoutes(app: Express) {
  app.get("/api/operator/settings-complete", requireAnyAuth, adminController.checkOperatorSettingsComplete);
  app.get("/api/operator/settings", requireAnyAuth, adminController.getOperatorSettings);
  app.put("/api/operator/settings", requireAnyAuth, adminController.updateOperatorSettings);
  app.post("/api/operator/toggle-free-month", requireStaffOrOwner, adminController.toggleFreeMonth);
  app.post("/api/operator/customization", requireStaffOrOwner, adminController.updateOperatorCustomization);
}

// Re-export the webhook handler
export { payStaffFromInvoice } from "../controllers/admin.controller";
