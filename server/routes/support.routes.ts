import type { Express } from "express";
import { IStorage } from "../storage";
import { requireStaffOrOwner } from "../replitAuth";
import { requireAnyAuth } from "../middleware/auth";
import * as supportController from "../controllers/support.controller";

export function setupSupportRoutes(app: Express, storage: IStorage) {
  // Listing all support requests is staff-only (privacy)
  app.get("/api/support-requests",
    requireStaffOrOwner,
    supportController.getSupportRequests(storage)
  );

  // Any authenticated user can file a support request
  app.post("/api/support-requests",
    requireAnyAuth,
    supportController.createSupportRequest(storage)
  );

  // Only staff can update/respond to support requests
  app.put("/api/support-requests/:id",
    requireStaffOrOwner,
    supportController.updateSupportRequest(storage)
  );
}
