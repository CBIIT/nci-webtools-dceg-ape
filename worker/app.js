import { createReadStream, createWriteStream, existsSync } from "fs";
import { writeFile, readdir, mkdir } from "fs/promises";
import { join, resolve, relative, normalize } from "path";
import { execFile, spawn } from "child_process";
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
  const inputFolder = resolve(env.INPUT_FOLDER, jobId);
  const outputFolder = resolve(env.OUTPUT_FOLDER, jobId);
  logger.info(`Running job ${jobId}`);
  const command = "TotalSegmentator";
  const args = ["-i", join(inputFolder, "ct"), "-o", join(outputFolder, "AUTOSEG"), "-ot", "dicom", "--fast"];
  logger.debug(command + " " + args.join(" "));
  // const { stdout, stderr } = await execFileAsync(command, args, { env });
  // if (stdout) {
  //   logger.info(stdout);
  // }
  // if (stderr) {
  //   logger.error(stderr);
  // }

  try {
    const process = spawn(command, args, { env });
    let timeout = setTimeout(() => {
      logger.error("Process timed out after 10 seconds");
      process.kill(); // Kill the process
    }, 10000); // 10 seconds timeout

    process.stdout.on("data", (data) => {
      logger.info(data.toString());
      timeout = setTimeout(() => {
        logger.error("Process timed out after 10 seconds");
        process.kill();
      }, 10000);
    });

    process.stderr.on("data", (data) => {
      if (data) logger.error(data.toString());
    });

    process.on("close", (code) => {
      logger.info(`Process exited with code ${code}`);
    });
    await new Promise((resolve, reject) => {
      process.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });
    });
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
