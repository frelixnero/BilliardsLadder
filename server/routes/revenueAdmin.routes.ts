import { Express } from "express";
import { requireRole } from "../middleware/auth";
import * as revenueAdminController from "../controllers/revenueAdmin.controller";

export function registerRevenueAdminRoutes(app: Express) {
  const requireRevenueAdmin = requireRole(["OWNER", "TRUSTEE", "OPERATOR"]);
  
  // Get current active revenue configuration
  app.get("/api/admin/revenue-config", requireRevenueAdmin, revenueAdminController.getActiveRevenueConfig);

  // Get all available revenue configurations
  app.get("/api/admin/revenue-configs", requireRevenueAdmin, revenueAdminController.getAllRevenueConfigs);

  // Set active revenue configuration
  app.post("/api/admin/revenue-config/activate", requireRevenueAdmin, revenueAdminController.activateRevenueConfig);

  // Create and activate custom revenue configuration
  app.post("/api/admin/revenue-config", requireRevenueAdmin, revenueAdminController.createRevenueConfig);

  // Update existing configuration (creates new version)
  app.put("/api/admin/revenue-config", requireRevenueAdmin, revenueAdminController.updateRevenueConfig);

  // Validate a configuration without saving
  app.post("/api/admin/revenue-config/validate", requireRevenueAdmin, revenueAdminController.validateConfig);

  // Get revenue calculation preview with different configurations
  app.post("/api/admin/revenue-config/preview", requireRevenueAdmin, revenueAdminController.previewRevenue);
}
