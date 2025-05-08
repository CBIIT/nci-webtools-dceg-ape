import { createReadStream, createWriteStream, existsSync } from "fs";
import { writeFile, readdir, mkdir } from "fs/promises";
import { join, resolve, relative, normalize } from "path";
import { spawn, exec } from "child_process";
import { promisify } from "util";
import { createLogger } from "./logger.js";

const execAsync = promisify(exec);

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
  logger.info(`Running job ${jobId}`);
  const start = new Date();
  const inputFolder = resolve(env.INPUT_FOLDER, jobId);
  const outputFolder = resolve(env.OUTPUT_FOLDER, jobId);
  const statusFilePath = join(outputFolder, "status.json");
  const command = "TotalSegmentator";
  const args = ["-i", join(inputFolder, "ct"), "-o", join(outputFolder, "AUTOSEG"), "-ot", "dicom"];
  logger.debug(`Command: ${command} ${args.join(" ")}`);

  try {
    const { error, stdout, stderr } = await execAsync(`${command} ${args.join(" ")}`);
    logger.debug("stdout");
    logger.debug(stdout);
    logger.debug("stderr");
    logger.debug(stderr);
    if (error) {
      throw error;
    }
    // const process = spawn(command, args, { env });
    // process.stdout.on("data", (data) => {
    //   logger.info(data.toString());
    // });
    // process.stderr.on("data", (data) => {
    //   logger.error(data.toString());
    // });
    // await new Promise((resolve, reject) => {
    //   process.on("close", (code, signal) => {
    //     if (signal) {
    //       logger.error(`Process was terminated by signal: ${signal}`);
    //       reject(new Error(`Process terminated by signal: ${signal}`));
    //     } else if (code === 0) {
    //       logger.info("TotalSegmentator Complete");
    //       resolve();
    //     } else {
    //       reject(new Error(`Process exited with code ${code}`));
    //     }
    //   });
    //   process.on("error", (error) => {
    //     reject(error);
    //   });
    // });
  } catch (error) {
    logger.error("An error occurred");
    logger.error(error);
    const status = {
      id: jobId,
      status: "FAILED",
      submittedAt: start,
      completedAt: new Date(),
    };
    await writeFile(statusFilePath, JSON.stringify(status, null, 2));
  } finally {
    logger.info("Job completed");
    const status = {
      id: jobId,
      status: "COMPLETED",
      submittedAt: start,
      completedAt: new Date(),
    };
    await writeFile(statusFilePath, JSON.stringify(status, null, 2));
    setTimeout(10000);
  }
}
