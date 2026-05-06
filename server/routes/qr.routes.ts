import type { Express } from "express";
import { requireStaffOrOwner } from "../replitAuth";
import { requireAnyAuth } from "../middleware/auth";
import * as qrController from "../controllers/qr.controller";

export function setupQRRoutes(app: Express) {
  // Static QR image — used by marketing materials, kept public
  app.get("/api/qr-code",
    qrController.getQRCode()
  );

  // Operators/staff generate session-bound QR codes
  app.post("/api/qr-registration/generate",
    requireAnyAuth,
    qrController.generateQRRegistration()
  );

  // The actual signup-via-QR endpoint must be public — the user has no account yet
  app.post("/api/qr-registration/:sessionId/register",
    qrController.registerViaQR()
  );

  app.get("/api/qr-registration/stats",
    requireStaffOrOwner,
    qrController.getQRStats()
  );

  app.get("/api/qr-registration/recent",
    requireStaffOrOwner,
    qrController.getRecentQRRegistrations()
  );
}
