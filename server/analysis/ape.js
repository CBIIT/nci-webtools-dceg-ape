import path from "path";
import { mkdirs, readJson, writeJson } from "../services/utils.js";
import { getWorker } from "../services/workers.js";

const { WORKER_TYPE } = process.env;

export async function submit(params, env = process.env) {
  const { id } = params;
  const inputFolder = path.resolve(env.INPUT_FOLDER, id);
  const outputFolder = path.resolve(env.OUTPUT_FOLDER, id);
  const paramsFilePath = path.resolve(inputFolder, "params.json");

  const statusFilePath = path.resolve(outputFolder, "status.json");
  await mkdirs([inputFolder, outputFolder]);

  const worker = getWorker(params.sendNotification ? WORKER_TYPE : "local");
  const status = { id, status: "SUBMITTED", submittedAt: new Date() };

  await writeJson(paramsFilePath, params);
  await writeJson(statusFilePath, status);

  worker(id).catch(console.error);
  return status;
}
