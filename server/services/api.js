import express from "express";
import { check } from "express-validator";
import compression from "compression";
import cors from "cors";
import multer from "multer";
import path from "path";
import DiskStorage from "./storage.js";
import { logRequests, logErrors, logFiles, handleValidationErrors, logForbiddenErrors } from "./middleware.js";
import { submit } from "../analysis/ape.js";
import { removePHI } from "./dicom.js";
import { readJson } from "./utils.js";

export function createApi(env) {
  // define middleware
  const storage = new DiskStorage({
    filename: (req, file) => file.originalname,
    destination: (req) => path.resolve(env.INPUT_FOLDER, req.params.id, 'ct'),
  });
  const upload = multer({ storage });
  const validate = check("id").isUUID();

  // register middleware
  const router = express.Router();
  router.use(express.json({ limit: "100mb" }));
  router.use(compression());
  router.use(cors());
  router.use(logRequests());

  // serve static files under /data
  router.use("/data", express.static(env.DATA_FOLDER));

  // register routes
  router.get("/ping", async (req, res) => res.json(true));

  router.post("/submit/:id", validate, handleValidationErrors, upload.array("files"), logFiles(), async (req, res) => {
    const { files = [], body } = req;
    const { logger } = req.app.locals;
    const { chunkIndex, totalChunks, originalFileName } = body;

    // Handle chunked upload
    if (chunkIndex !== undefined && totalChunks !== undefined) {
      const outputDir = path.resolve(env.INPUT_FOLDER, req.params.id, 'ct');
      
      // Create ct directory if it doesn't exist
      await import('fs').then(fs => fs.promises.mkdir(outputDir, { recursive: true }));
      
      // Store chunk in ct folder
      for (const file of files) {
        const chunkPath = path.join(outputDir, `${originalFileName}.part${chunkIndex}`);
        await import('fs').then(fs => fs.promises.rename(file.path, chunkPath));
      }
      
      // Check if all chunks are received
      const expectedChunks = Array.from({ length: parseInt(totalChunks) }, (_, i) => 
        path.join(outputDir, `${originalFileName}.part${i}`)
      );
      
      const fs = await import('fs');
      const allChunksExist = await Promise.all(
        expectedChunks.map(chunk => fs.promises.access(chunk).then(() => true).catch(() => false))
      );
      
      if (allChunksExist.every(exists => exists)) {
        // Reassemble file
        const finalPath = path.join(outputDir, originalFileName);
        
        // Use writeFile with concatenated buffer for reliable reassembly
        const chunks = [];
        for (let i = 0; i < parseInt(totalChunks); i++) {
          const chunkPath = expectedChunks[i];
          const chunkData = await fs.promises.readFile(chunkPath);
          chunks.push(chunkData);
          await fs.promises.unlink(chunkPath); // Clean up chunk
        }
        
        const completeFile = Buffer.concat(chunks);
        await fs.promises.writeFile(finalPath, completeFile);
        
        // Process reassembled file
        if (path.extname(originalFileName).toLowerCase() === ".dcm") {
          await removePHI(finalPath);
          logger.debug(`Remove PHI from file: ${originalFileName}`);
        }
      }
      
      res.json(true);
      return;
    }

    // Handle regular file upload (non-chunked)
    for (const file of files) {
      if (path.extname(file.originalname).toLowerCase() === ".dcm") {
        await removePHI(file.path);
        logger.debug(`Remove PHI from file: ${file.originalname}`);
      }
    }

    if (body.params) {
      res.json(await submit(body.params));
    } else {
      res.json(true);
    }
  });

  


  router.use(logForbiddenErrors());
  router.use(logErrors());
  return router;
}
