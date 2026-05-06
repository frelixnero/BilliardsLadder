import type { Express } from "express";
import { IStorage } from "../storage";
import Stripe from "stripe";
import { sanitizeBody } from "../utils/sanitize";
import { isAuthenticated, requireStaffOrOwner } from "../replitAuth";
import { requireAnyAuth } from "../middleware/auth";
import * as tournamentController from "../controllers/tournament.controller";

export function setupTournamentRoutes(app: Express, storage: IStorage, stripe: Stripe) {
  // Reads — public tournament info (kept open so landing pages work)
  app.get("/api/matches", tournamentController.getMatches(storage));
  app.get("/api/tournaments", tournamentController.getTournaments(storage));
  app.get("/api/tournament-calcuttas", isAuthenticated, tournamentController.getTournamentCalcuttas(storage));
  app.get("/api/tournaments/:tournamentId/calcuttas",
    isAuthenticated,
    tournamentController.getTournamentCalcuttasByTournament(storage)
  );
  app.get("/api/calcutta-bids", isAuthenticated, tournamentController.getCalcuttaBids(storage));
  app.get("/api/tournament-calcuttas/:calcuttaId/bids",
    isAuthenticated,
    tournamentController.getCalcuttaBidsByCalcutta(storage)
  );
  app.get("/api/match-divisions", tournamentController.getMatchDivisions(storage));
  app.get("/api/match-divisions/:id", tournamentController.getMatchDivision(storage));
  app.get("/api/match-entries/:id", isAuthenticated, tournamentController.getMatchEntry(storage));

  // Writes — staff/operator create matches and tournaments; players enter matches
  app.post("/api/matches",
    requireStaffOrOwner,
    sanitizeBody(["notes", "description", "title"]),
    tournamentController.createMatch(storage)
  );

  app.put("/api/matches/:id",
    requireStaffOrOwner,
    sanitizeBody(["notes", "description", "title"]),
    tournamentController.updateMatch(storage)
  );

  app.post("/api/tournaments",
    requireStaffOrOwner,
    sanitizeBody(["title", "description", "name", "rules"]),
    tournamentController.createTournament(storage)
  );

  app.put("/api/tournaments/:id",
    requireStaffOrOwner,
    sanitizeBody(["title", "description", "name", "rules"]),
    tournamentController.updateTournament(storage)
  );

  app.post("/api/tournament-calcuttas",
    requireStaffOrOwner,
    sanitizeBody(["description"]),
    tournamentController.createTournamentCalcutta(storage)
  );

  app.put("/api/tournament-calcuttas/:id",
    requireStaffOrOwner,
    sanitizeBody(["description"]),
    tournamentController.updateTournamentCalcutta(storage)
  );

  app.post("/api/calcutta-bids", requireAnyAuth, tournamentController.createCalcuttaBid(storage));

  app.post("/api/match-entries",
    requireAnyAuth,
    sanitizeBody(["description"]),
    tournamentController.createMatchEntry(storage, stripe)
  );

  app.patch("/api/match-entries/:id",
    requireAnyAuth,
    sanitizeBody(["description"]),
    tournamentController.updateMatchEntry(storage)
  );

  app.post("/api/match-entries/:id/complete",
    requireStaffOrOwner,
    tournamentController.completeMatchEntry(storage, stripe)
  );
}
