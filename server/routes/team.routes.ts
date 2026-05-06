import type { Express } from "express";
import { IStorage } from "../storage";
import Stripe from "stripe";
import { sanitizeBody } from "../utils/sanitize";
import { isAuthenticated, requireStaffOrOwner } from "../replitAuth";
import { requireAnyAuth } from "../middleware/auth";
import * as teamController from "../controllers/team.controller";

export function setupTeamRoutes(app: Express, storage: IStorage, stripe: Stripe) {
  // Reads — league members
  app.get("/api/teams", isAuthenticated, teamController.getTeams(storage));
  app.get("/api/teams/:id", isAuthenticated, teamController.getTeam(storage));
  app.get("/api/team-players", isAuthenticated, teamController.getTeamPlayers(storage));
  app.get("/api/team-matches", isAuthenticated, teamController.getTeamMatches(storage));
  app.get("/api/team-matches/:id", isAuthenticated, teamController.getTeamMatch(storage));
  app.get("/api/team-sets", isAuthenticated, teamController.getTeamSets(storage));
  app.get("/api/team-challenges", isAuthenticated, teamController.getTeamChallenges(storage));
  app.get("/api/team-registrations/:id", isAuthenticated, teamController.getTeamRegistration(storage));
  app.get("/api/team-registrations/division/:divisionId",
    isAuthenticated,
    teamController.getTeamRegistrationsByDivision(storage)
  );

  // Writes — players + captains
  app.post("/api/teams", requireAnyAuth, teamController.createTeam(storage));
  app.put("/api/teams/:id", requireAnyAuth, teamController.updateTeam(storage));
  app.delete("/api/teams/:id", requireStaffOrOwner, teamController.deleteTeam(storage));

  app.post("/api/team-players", requireAnyAuth, teamController.createTeamPlayer(storage));
  app.delete("/api/team-players/:id", requireAnyAuth, teamController.deleteTeamPlayer(storage));

  app.post("/api/team-matches", requireAnyAuth, teamController.createTeamMatch(storage));
  app.put("/api/team-matches/:id", requireAnyAuth, teamController.updateTeamMatch(storage));
  app.post("/api/team-matches/:id/reveal-lineup", requireAnyAuth, teamController.revealTeamMatchLineup(storage));
  app.post("/api/team-matches/:id/trigger-captain-burden", requireAnyAuth, teamController.triggerCaptainBurden(storage));

  app.post("/api/team-sets", requireAnyAuth, teamController.createTeamSet(storage));
  app.put("/api/team-sets/:id", requireAnyAuth, teamController.updateTeamSet(storage));

  app.post("/api/team-challenges", requireAnyAuth, teamController.createTeamChallenge(storage));
  app.post("/api/team-challenges/:id/accept", requireAnyAuth, teamController.acceptTeamChallenge(storage));

  // Stripe onboarding for teams — captains/owners only
  app.post("/api/teams/:teamId/stripe-onboarding",
    requireAnyAuth,
    teamController.createTeamStripeOnboarding(storage, stripe)
  );

  app.get("/api/teams/:teamId/stripe-onboarding/refresh",
    requireAnyAuth,
    teamController.refreshTeamStripeOnboarding(storage, stripe)
  );

  app.get("/api/teams/:teamId/stripe-onboarding/complete",
    requireAnyAuth,
    teamController.completeTeamStripeOnboarding(storage, stripe)
  );

  app.get("/api/teams/:teamId/stripe-account",
    requireAnyAuth,
    teamController.getTeamStripeAccount(storage, stripe)
  );

  app.post("/api/team-registrations",
    requireAnyAuth,
    sanitizeBody(["teamName", "description"]),
    teamController.createTeamRegistration(storage)
  );
}
