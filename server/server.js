import express from "express";
import passport from "passport";
import { createLogger } from "./services/logger.js";
import { createApi } from "./services/api.js";
import { isMainModule } from "./services/utils.js";
import { validateEnvironment } from "./services/environment.js";
import { createDefaultAuthStrategy } from "./services/auth/passportUtils.js";
import { createSession } from "./services/db/session.js";

// if this module is the main module, start the app
if (isMainModule(import.meta)) {
  const env = process.env;
  validateEnvironment(env);
  main(env);
}

export async function main(env) {
  const { APP_NAME, APP_PORT, SERVER_TIMEOUT } = env;
  const serverTimeout = +SERVER_TIMEOUT || 1000 * 60 * 15;
  const app = await createApp(env);
  const server = app.listen(APP_PORT, () => {
    app.locals.logger.info(`${APP_NAME} started on port ${APP_PORT}`);
  });
  server.setTimeout(serverTimeout);
  return server;
}

export async function createApp(env) {
  const { APP_NAME, LOG_LEVEL } = env;
  const app = express();

  app.set("trust proxy", 1);

  // create services
  const logger = createLogger(APP_NAME, LOG_LEVEL);
  app.locals.logger = logger;

  // Setup session management
  app.use(createSession(env, logger));
  
  // Setup passport authentication
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Register passport strategies
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));
  passport.use("default", await createDefaultAuthStrategy(env, logger));

  // register api routes
  app.use("/api", createApi(env));

  return app;
}
