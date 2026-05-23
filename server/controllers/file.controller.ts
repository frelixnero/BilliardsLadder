import { Request, Response } from "express";
import { IStorage } from "../storage";
import { insertUploadedFileSchema, insertFileShareSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "../services/objectStorage";
import { ObjectPermission, getObjectAclPolicy } from "../utils/objectAcl";

export function getUploadURL(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const session = req.session as any;
      const userId = session.passport?.user?.claims?.sub || session.passport?.user?.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      
      const { category = "general_upload", fileName } = req.body;
      const objectStorageService = new ObjectStorageService();
      
      const { url, objectPath } = await objectStorageService.getObjectEntityUploadURL(
        userId,
        user.globalRole || "PLAYER",
        category,
        fileName
      );
      
      res.json({ 
        uploadURL: url, 
        objectPath,
        expiresIn: 900,
        maxFileSize: 50 * 1024 * 1024
      });
    } catch (error) {
      console.error("Error creating upload URL:", error);
      res.status(500).json({ error: "Failed to create upload URL" });
    }
  };
}

export function createFileRecord(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const session = req.session as any;
      const userId = session.passport?.user?.claims?.sub || session.passport?.user?.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const objectStorageService = new ObjectStorageService();
      const normalizedPath = objectStorageService.normalizeObjectEntityPath(req.body.objectPath || "");
      const userRole = user.globalRole || "PLAYER";
      const allowedPrefix = `/objects/uploads/${userRole}/${userId}/`;

      // Prevent clients from registering metadata for objects outside their own upload namespace.
      if (!normalizedPath.startsWith(allowedPrefix)) {
        return res.status(403).json({ error: "Invalid object path for current user" });
      }

      const visibility = req.body.visibility === "public" ? "public" : "private";

      await objectStorageService.trySetObjectEntityAclPolicy(normalizedPath, {
        owner: userId,
        visibility,
        aclRules: req.body.aclRules || [],
      });
      
      const validatedData = insertUploadedFileSchema.parse({
        ...req.body,
        userId,
        objectPath: normalizedPath,
        visibility,
        uploadedAt: new Date(),
        isActive: true,
      });
      
      const uploadedFile = await storage.createUploadedFile(validatedData);

      res.status(201).json({
        ...uploadedFile,
        objectPath: normalizedPath,
      });
    } catch (error) {
      console.error("Error creating file record:", error);
      res.status(500).json({ error: "Failed to save file metadata" });
    }
  };
}

export function getUserFiles(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const session = req.session as any;
      const userId = session.passport?.user?.claims?.sub || session.passport?.user?.id;
      const { category } = req.query;
      
      const files = await storage.getUserUploadedFiles(userId, category as string);
      res.json({ files });
    } catch (error) {
      console.error("Error listing files:", error);
      res.status(500).json({ error: "Failed to list files" });
    }
  };
}

export function getFileDetails(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const session = req.session as any;
      const userId = session.passport?.user?.claims?.sub || session.passport?.user?.id;
      const file = await storage.getUploadedFile(req.params.id);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      if (file.userId !== userId) {
        const user = await storage.getUser(userId);
        const isAdmin = user?.globalRole === "OWNER" || user?.globalRole === "STAFF";
        
        if (!isAdmin) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      res.json(file);
    } catch (error) {
      console.error("Error getting file:", error);
      res.status(500).json({ error: "Failed to get file" });
    }
  };
}

export function deleteFile(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const session = req.session as any;
      const userId = session.passport?.user?.claims?.sub || session.passport?.user?.id;
      const file = await storage.getUploadedFile(req.params.id);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      if (file.userId !== userId) {
        const user = await storage.getUser(userId);
        const isAdmin = user?.globalRole === "OWNER" || user?.globalRole === "STAFF";
        
        if (!isAdmin) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const deleted = await storage.deleteUploadedFile(req.params.id);
      
      if (deleted) {
        res.json({ success: true, message: "File deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete file" });
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  };
}

export function createFileShare(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const session = req.session as any;
      const userId = session.passport?.user?.claims?.sub || session.passport?.user?.id;
      const file = await storage.getUploadedFile(req.params.id);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      if (file.userId !== userId) {
        return res.status(403).json({ error: "Only file owners can create shares" });
      }
      
      const validatedData = insertFileShareSchema.parse({
        ...req.body,
        fileId: req.params.id,
        sharedBy: userId,
      });
      
      const share = await storage.createFileShare(validatedData);
      res.status(201).json(share);
    } catch (error) {
      console.error("Error creating file share:", error);
      res.status(500).json({ error: "Failed to create file share" });
    }
  };
}

export function getFileShares(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const session = req.session as any;
      const userId = session.passport?.user?.claims?.sub || session.passport?.user?.id;
      const file = await storage.getUploadedFile(req.params.id);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      if (file.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const shares = await storage.getFileShares(req.params.id);
      res.json({ shares });
    } catch (error) {
      console.error("Error listing file shares:", error);
      res.status(500).json({ error: "Failed to list file shares" });
    }
  };
}

export function deleteFileShare(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const session = req.session as any;
      const userId = session.passport?.user?.claims?.sub || session.passport?.user?.id;
      const share = await storage.getFileShare(req.params.shareId);
      
      if (!share) {
        return res.status(404).json({ error: "Share not found" });
      }
      
      if (share.sharedBy !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const deleted = await storage.deleteFileShare(req.params.shareId);
      
      if (deleted) {
        res.json({ success: true, message: "Share deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete share" });
      }
    } catch (error) {
      console.error("Error deleting share:", error);
      res.status(500).json({ error: "Failed to delete share" });
    }
  };
}

export function servePublicObject(storage: IStorage) {
  return async (req: Request, res: Response) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      const aclPolicy = await getObjectAclPolicy(file);
      if (!aclPolicy || aclPolicy.visibility !== "public") {
        console.warn(`Attempted access to non-public file through public route: ${filePath}`);
        return res.status(403).json({ error: "File is not publicly accessible" });
      }
      
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function servePrivateObject(storage: IStorage) {
  return async (req: Request, res: Response) => {
    try {
      let userId: string | undefined;
      if (req.isAuthenticated()) {
        const session = req.session as any;
        userId = session.passport?.user?.claims?.sub || session.passport?.user?.id;
      }
      
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.sendStatus(403);
      }
      
      if (userId) {
        try {
          const fileRecord = await storage.getUploadedFileByPath(req.path);
          if (fileRecord && fileRecord.userId === userId) {
            await storage.incrementFileDownloadCount(fileRecord.id);
          }
        } catch (error) {
          console.warn("Failed to update download count:", error);
        }
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving private object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  };
}
