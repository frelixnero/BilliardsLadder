import type { Express } from "express";
import { IStorage } from "../storage";
import { requireStaffOrOwner } from "../replitAuth";
import { requireAnyAuth } from "../middleware/auth";
import * as streamController from "../controllers/stream.controller";

export function setupStreamRoutes(app: Express, storage: IStorage) {
  // Public reads — viewers can browse live streams without an account
  app.get("/api/live-streams",
    streamController.getLiveStreams(storage)
  );

  app.get("/api/live-streams/by-location",
    streamController.getLiveStreamsByLocation(storage)
  );

  app.get("/api/live-streams/stats",
    streamController.getLiveStreamStats(storage)
  );

  // Streamers (any authed user) can announce their stream;
  // admins can update/delete any stream entry.
  app.post("/api/live-streams",
    requireAnyAuth,
    streamController.createLiveStream(storage)
  );

  app.put("/api/live-streams/:id",
    requireAnyAuth,
    streamController.updateLiveStream(storage)
  );

  app.delete("/api/live-streams/:id",
    requireStaffOrOwner,
    streamController.deleteLiveStream(storage)
  );
}
