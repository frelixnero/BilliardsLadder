import type { Express } from "express";
import { IStorage } from "../storage";
import { isAuthenticated, requireStaffOrOwner } from "../replitAuth";
import { requireAnyAuth } from "../middleware/auth";
import * as charityController from "../controllers/charity.controller";

export function setupCharityRoutes(app: Express, storage: IStorage) {
  // ==================== CHARITY EVENT ROUTES ====================
  // Public list — used on marketing/landing
  app.get("/api/charity-events",
    charityController.getCharityEvents(storage)
  );

  app.post("/api/charity-events",
    requireStaffOrOwner,
    charityController.createCharityEvent(storage)
  );

  app.put("/api/charity-events/:id",
    requireStaffOrOwner,
    charityController.updateCharityEvent(storage)
  );

  // Anyone authenticated can donate
  app.post("/api/charity/donate",
    requireAnyAuth,
    charityController.createCharityDonation(storage)
  );

  // ==================== BOUNTY ROUTES ====================
  app.get("/api/bounties",
    isAuthenticated,
    charityController.getBounties(storage)
  );

  app.post("/api/bounties",
    requireAnyAuth,
    charityController.createBounty(storage)
  );

  app.put("/api/bounties/:id",
    requireStaffOrOwner,
    charityController.updateBounty(storage)
  );

  // ==================== ADDED MONEY FUND ROUTES (money — staff only for writes) ====================
  app.get("/api/added-money-funds",
    isAuthenticated,
    charityController.getAddedMoneyFunds(storage)
  );

  app.get("/api/added-money-funds/source/:sourceType",
    isAuthenticated,
    charityController.getAddedMoneyFundsBySource(storage)
  );

  app.post("/api/added-money-funds",
    requireStaffOrOwner,
    charityController.createAddedMoneyFund(storage)
  );

  // ==================== JACKPOT ROUTE (public marketing) ====================
  app.get("/api/jackpot",
    charityController.getJackpot(storage)
  );
}
