import { createReadStream, createWriteStream, existsSync } from "fs";
import { writeFile, readdir, mkdir } from "fs/promises";
import { join, relative, normalize } from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { createLogger } from "./logger.js";

const execFileAsync = promisify(execFile);

const [jobId] = process.argv.slice(2);
const logger = createLogger(`Job ${jobId}`, process.env?.LOG_LEVEL || "debug");

if (!jobId) {
  logger.error("No jobId specified");
  process.exit(1);
}

try {
  await run(jobId);
  process.exit(0);
} catch (e) {
  logger.error(e);
  process.exit(1);
}

async function run(jobId, env = process.env) {
  const start = new Date();
  const inputFolder = join(env.INPUT_FOLDER, jobId);
  const outputFolder = join(env.OUTPUT_FOLDER, jobId);
  logger.info(`Running job ${jobId}`);
  const command = "TotalSegmentator";
  const args = ["-i", join(inputFolder, "ct"), "-o", join(outputFolder, "AUTOSEG"), "-ot", "dicom"];
  const { stdout, stderr } = await execFileAsync(command, args, { env });
  if (stdout) {
    logger.info(stdout);
  }
  if (stderr) {
    logger.error(stderr);
  }

  try {
  } catch (error) {
    logger.error("An error occurred");
    logger.error(error);
  } finally {
    logger.info("Job completed");
    const statusFilePath = join(outputFolder, "status.json");
    const status = {
      id: jobId,
      status: "COMPLETED",
      submittedAt: start,
      completedAt: new Date(),
    };
    await setTimeout(10000);
  }
}
