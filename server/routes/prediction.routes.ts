import type { Express } from "express";
import { IStorage } from "../storage";
import { sanitizeBody } from "../utils/sanitize";
import { isAuthenticated, requireStaffOrOwner } from "../replitAuth";
import { requireAnyAuth } from "../middleware/auth";
import * as predictionController from "../controllers/prediction.controller";

export function setupPredictionRoutes(app: Express, storage: IStorage) {
  // ==================== SEASON PREDICTION ROUTES ====================
  app.get("/api/season-predictions",
    isAuthenticated,
    predictionController.getSeasonPredictions(storage)
  );

  app.get("/api/season-predictions/status/:status",
    isAuthenticated,
    predictionController.getSeasonPredictionsByStatus(storage)
  );

  app.post("/api/season-predictions",
    requireStaffOrOwner,
    sanitizeBody(["name", "description"]),
    predictionController.createSeasonPrediction(storage)
  );

  app.put("/api/season-predictions/:id",
    requireStaffOrOwner,
    sanitizeBody(["name", "description"]),
    predictionController.updateSeasonPrediction(storage)
  );

  // ==================== PREDICTION ENTRY ROUTES ====================
  app.get("/api/prediction-entries",
    isAuthenticated,
    predictionController.getPredictionEntries(storage)
  );

  app.get("/api/season-predictions/:predictionId/entries",
    isAuthenticated,
    predictionController.getPredictionEntriesByPrediction(storage)
  );

  app.post("/api/prediction-entries",
    requireAnyAuth,
    predictionController.createPredictionEntry(storage)
  );
}
