import express from "express";
import { check } from "express-validator";
import compression from "compression";
import cors from "cors";
import multer from "multer";
import path from "path";
import DiskStorage from "./storage.js";
import { logRequests, logErrors, logFiles, handleValidationErrors, logForbiddenErrors } from "./middleware.js";
import { submit } from "../analysis/ape.js";

export function createApi(env) {
  // define middleware
  const storage = new DiskStorage({
    filename: (req, file) => file.originalname,
    destination: (req) => path.resolve(env.INPUT_FOLDER, req.params.id),
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
      logger.debug(`Remove PII from file: ${file.originalname}`);
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
