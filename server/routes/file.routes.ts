import type { Express } from "express";
import { IStorage } from "../storage";
import { requireAnyAuth } from "../middleware/auth";
import * as fileController from "../controllers/file.controller";

export function setupFileRoutes(app: Express, storage: IStorage) {
  // Public objects are intentionally world-readable (e.g. poster images shown
  // on the landing page); private objects below require auth.
  app.get("/public-objects/:filePath(*)",
    fileController.servePublicObject(storage)
  );

  app.get("/objects/:objectPath(*)",
    requireAnyAuth,
    fileController.servePrivateObject(storage)
  );

  // All file CRUD requires auth — controllers must enforce per-file ownership.
  app.post("/api/objects/upload",
    requireAnyAuth,
    fileController.getUploadURL(storage)
  );

  app.put("/api/files",
    requireAnyAuth,
    fileController.createFileRecord(storage)
  );

  app.get("/api/files",
    requireAnyAuth,
    fileController.getUserFiles(storage)
  );

  app.get("/api/files/:id",
    requireAnyAuth,
    fileController.getFileDetails(storage)
  );

  app.delete("/api/files/:id",
    requireAnyAuth,
    fileController.deleteFile(storage)
  );

  app.post("/api/files/:id/share",
    requireAnyAuth,
    fileController.createFileShare(storage)
  );

  app.get("/api/files/:id/shares",
    requireAnyAuth,
    fileController.getFileShares(storage)
  );

  app.delete("/api/shares/:shareId",
    requireAnyAuth,
    fileController.deleteFileShare(storage)
  );
}
