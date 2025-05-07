import path from "path";
import { BatchClient, SubmitJobCommand } from "@aws-sdk/client-batch";
import { readJson } from "./utils.js";
import { createLogger } from "./logger.js";

export function getWorkerCommand(id) {
  return ["node", ["--env-file=.env", "worker.js", id]];
}

export function getWorker(workerType = "local") {
  switch (workerType) {
    case "local":
      return runLocalWorker;
    case "batch":
      return submitBatch;
    default:
      throw new Error(`Unknown worker type: ${workerType}`);
  }
}

/**
 * Executes a worker process locally.
 * @param {string} id
 * @param {string} cwd
 * @returns
 */
export async function runLocalWorker(id, env = process.env) {
  const paramsFilePath = path.resolve(env.INPUT_FOLDER, id, "params.json");
  const params = await readJson(paramsFilePath);
  const logger = createLogger(env.APP_NAME, env.LOG_LEVEL);
  logger.debug("run local worker TBA");
}

async function submitBatch(id, env = process.env) {
  const { BATCH_JOB_QUEUE, BATCH_JOB_DEFINITION } = process.env;
  const logger = createLogger(env.APP_NAME, env.LOG_LEVEL);
  const client = new BatchClient();
  const workerCommand = ["node", "app.js", id];
  const jobCommand = new SubmitJobCommand({
    // SubmitJobRequest
    jobName: `ape-worker-${id}`,
    jobQueue: BATCH_JOB_QUEUE,
    jobDefinition: BATCH_JOB_DEFINITION,
    containerOverrides: {
      command: workerCommand,
    },
    propagateTags: true,
  });
  const command = await client.send(jobCommand);
  logger.info(`Submitted Batch SubmitJob command. Deploy ID: ${id}`);
  logger.debug(workerCommand);
  logger.debug(command);
  return command.jobName;
}
