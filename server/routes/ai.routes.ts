import type { Express } from "express";
import { isAuthenticated } from "../replitAuth";
import * as aiController from "../controllers/ai.controller";

export function setupAIRoutes(app: Express) {
  // All AI endpoints require auth — they hit paid third-party APIs
  // and were previously open to anyone (quota-abuse risk).
  app.post("/api/ai/coaching", isAuthenticated, aiController.coaching());
  app.post("/api/ai/community-chat", isAuthenticated, aiController.communityChat());
  app.post("/api/ai/match-commentary", isAuthenticated, aiController.matchCommentary());
  app.post("/api/ai/match-prediction", isAuthenticated, aiController.matchPrediction());
  app.get("/api/ai/opponent-suggestions/:playerId", isAuthenticated, aiController.opponentSuggestions());
  app.get("/api/ai/performance-analysis/:playerId", isAuthenticated, aiController.performanceAnalysis());
}
