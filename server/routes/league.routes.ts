import type { Express } from "express";
import { IStorage } from "../storage";
import * as leagueController from "../controllers/league.controller";

export function setupLeagueRoutes(app: Express, storage: IStorage) {
  // League standings/seasons/stats are public read-only — they power the
  // landing page and marketing materials.
  app.get("/api/league/standings",
    leagueController.getLeagueStandings(storage)
  );

  app.get("/api/league/seasons",
    leagueController.getLeagueSeasons(storage)
  );

  app.get("/api/league/stats",
    leagueController.getLeagueStats(storage)
  );

  app.get("/api/league/upcoming-matches",
    leagueController.getUpcomingMatches(storage)
  );
}
