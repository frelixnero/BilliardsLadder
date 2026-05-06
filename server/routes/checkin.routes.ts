import type { Express } from "express";
import { IStorage } from "../storage";
import * as checkinController from "../controllers/checkin.controller";
import { sanitizeBody } from "../utils/sanitize";
import { isAuthenticated, requireStaffOrOwner } from "../replitAuth";
import { requireAnyAuth } from "../middleware/auth";

export function setupCheckinRoutes(app: Express, storage: IStorage) {
  app.post("/api/checkins",
    requireAnyAuth,
    sanitizeBody(["details"]),
    checkinController.createCheckin(storage)
  );

  app.get("/api/checkins/session/:sessionId",
    isAuthenticated,
    checkinController.getCheckinsBySession(storage)
  );

  app.get("/api/checkins/venue/:venueId",
    isAuthenticated,
    checkinController.getCheckinsByVenue(storage)
  );

  app.post("/api/attitude-votes",
    requireAnyAuth,
    sanitizeBody(["details"]),
    checkinController.createAttitudeVote(storage)
  );

  app.get("/api/attitude-votes/:id",
    isAuthenticated,
    checkinController.getAttitudeVote(storage)
  );

  app.post("/api/attitude-votes/:id/vote",
    requireAnyAuth,
    sanitizeBody(["note"]),
    checkinController.castVote(storage)
  );

  app.post("/api/attitude-votes/:id/close",
    requireStaffOrOwner,
    checkinController.closeAttitudeVote(storage)
  );

  app.get("/api/attitude-votes/active/:sessionId/:venueId",
    isAuthenticated,
    checkinController.getActiveVotes(storage)
  );

  // Incident reports — sensitive, auth required
  app.get("/api/incidents/user/:userId",
    requireAnyAuth,
    checkinController.getIncidentsByUser(storage)
  );

  app.get("/api/incidents/recent/:venueId",
    requireStaffOrOwner,
    checkinController.getRecentIncidents(storage)
  );
}
