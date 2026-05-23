import type { Express } from "express";
import { IStorage } from "../storage";
import { sanitizeBody } from "../utils/sanitize";
import * as playerController from "../controllers/player.controller";
import { isAuthenticated, requireStaffOrOwner } from "../replitAuth";

export function setupPlayerRoutes(app: Express, storage: IStorage) {
  app.get("/api/players", isAuthenticated, playerController.getPlayers(storage));

  app.post("/api/players",
    requireStaffOrOwner,
    sanitizeBody(["name", "username", "notes", "bio"]),
    playerController.createPlayer(storage)
  );

  app.put("/api/players/:id",
    requireStaffOrOwner,
    sanitizeBody(["name", "username", "notes", "bio"]),
    playerController.updatePlayer(storage)
  );

  app.delete("/api/players/:id", requireStaffOrOwner, playerController.deletePlayer(storage));

  app.post("/api/players/graduate", requireStaffOrOwner, playerController.graduatePlayer(storage));

  app.get("/api/birthday-players", isAuthenticated, playerController.getBirthdayPlayers(storage));
}
