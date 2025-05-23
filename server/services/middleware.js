import { validationResult } from "express-validator";
import { formatObject } from "./logger.js";

export function handleValidationErrors(request, response, next) {
  const { logger } = request.app.locals;
  const result = validationResult(request);
  if (!result.isEmpty()) {
    const errors = result.mapped();
    logger.error(errors);
    response.status(400).json(errors);
  } else {
    next();
  }
}

export function requestFormatter(request) {
  const parts = [request.method, request.path, formatObject(request.query), formatObject(request.body)];
  return parts.join(" ");
}

export function fileFormatter(request) {
  return formatObject(request.files);
}

export function errorFormatter(error) {
  return { error: error.message };
}

export function logRequests(formatter = requestFormatter) {
  return (request, response, next) => {
    const { logger } = request.app.locals;
    logger.info(formatter(request));
    next();
  };
}

export function logFiles(formatter = fileFormatter) {
  return (request, response, next) => {
    const { logger } = request.app.locals;
    logger.info(formatter(request));
    next();
  };
}

export function logErrors(formatter = errorFormatter) {
  return (error, request, response, next) => {
    const { logger } = request.app.locals;
    logger.error(formatObject(error));
    response.status(500).json(formatter(error));
  };
}

export function logForbiddenErrors() {
  return (err, req, res, next) => {
    if (err.status === 403) {
      console.error(`403 Forbidden Error: ${err.message}`);
      console.error(`Request URL: ${req.originalUrl}`);
      console.error(`Request Method: ${req.method}`);
      console.error(`Request Headers: ${JSON.stringify(req.headers)}`);
      console.error(`Request Body: ${JSON.stringify(req.body)}`);
    }
    next(err);
  };
}
