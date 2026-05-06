import { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import * as quickChallengeController from "../controllers/quickChallenge.controller";

export function registerQuickChallengeRoutes(app: Express) {

  // Quick Challenge endpoint - simplified challenge creation (auth required)
  app.post(
    "/api/quick-challenge",
    isAuthenticated,
    quickChallengeController.createQuickChallenge,
  );

  // Get quick challenge suggestions - auth required so we can exclude the
  // requesting player from the suggestion list using their real id.
  app.get(
    "/api/quick-challenge/suggestions",
    isAuthenticated,
    quickChallengeController.getQuickChallengeSuggestions,
  );

}
