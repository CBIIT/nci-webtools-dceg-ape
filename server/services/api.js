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

  router.get("/status/:id", validate, handleValidationErrors, async (req, res) => {
    const statusPath = path.resolve(env.OUTPUT_FOLDER, req.params.id, "status.json");
    try {
      const status = await readJson(statusPath);
      res.json(status);
    } catch (e) {
      res.status(404).json({ error: "Status not found" });
    }
  });



  router.use(logForbiddenErrors());
  router.use(logErrors());
  return router;
}
