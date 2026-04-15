import type { Express } from "express";
import { requireOwner, requireStaffOrOwner } from "../middleware/auth";
import * as authController from "../controllers/auth.controller";

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/login", authController.login);
  app.post("/api/auth/logout", authController.logout);
  app.get("/api/auth/me", authController.authMe);
  app.get("/api/auth/success", authController.authSuccess);
  app.post("/api/auth/create-owner", requireStaffOrOwner, authController.createOwner);
  app.post("/api/auth/create-operator", requireOwner, authController.createOperator);
  app.post("/api/auth/signup-player", authController.signupPlayer);
  app.post("/api/auth/signup-operator", authController.signupOperator);
  app.post("/api/auth/change-password", authController.changePassword);
  app.get("/api/auth/user", authController.getCurrentUser);
  app.post("/api/auth/assign-role", requireStaffOrOwner, authController.assignRole);
  app.get("/api/auth/verify-email", authController.verifyEmail);
  app.post("/api/auth/resend-verification", authController.resendVerification);
}