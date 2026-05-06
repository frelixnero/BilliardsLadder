import type { Express } from "express";
import { IStorage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import * as fileController from "../controllers/file.controller";

export function setupFileRoutes(app: Express, storage: IStorage) {
  // Public objects are intentionally world-readable (e.g. poster images shown
  // on the landing page); private objects below require auth.
  app.get("/public-objects/:filePath(*)",
    fileController.servePublicObject(storage)
  );

  app.get("/objects/:objectPath(*)",
    isAuthenticated,
    fileController.servePrivateObject(storage)
  );

  // All file CRUD requires auth — controllers must enforce per-file ownership.
  app.post("/api/objects/upload",
    isAuthenticated,
    fileController.getUploadURL(storage)
  );

  app.put("/api/files",
    isAuthenticated,
    fileController.createFileRecord(storage)
  );

  app.get("/api/files",
    isAuthenticated,
    fileController.getUserFiles(storage)
  );

  app.get("/api/files/:id",
    isAuthenticated,
    fileController.getFileDetails(storage)
  );

  app.delete("/api/files/:id",
    isAuthenticated,
    fileController.deleteFile(storage)
  );

  app.post("/api/files/:id/share",
    isAuthenticated,
    fileController.createFileShare(storage)
  );

  app.get("/api/files/:id/shares",
    isAuthenticated,
    fileController.getFileShares(storage)
  );

  app.delete("/api/shares/:shareId",
    isAuthenticated,
    fileController.deleteFileShare(storage)
  );
}
