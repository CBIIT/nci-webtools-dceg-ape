import session from "express-session";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import connectDynamoDB from "connect-dynamodb";

const DynamoDBStore = connectDynamoDB(session);

/**
 * Create session middleware with appropriate storage backend
 * Currently uses MemoryStore, can be easily switched to DynamoDB
 */
export function createSession(env, logger) {
  const sessionConfig = {
    cookie: {
      maxAge: +env.SESSION_MAX_AGE || 24 * 60 * 60 * 1000, // Default 24 hours
      httpOnly: true, // Prevent client-side JS access (XSS protection)
      secure: env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax", // CSRF protection
    },
    resave: false, // Don't save session if unmodified
    rolling: true, // Reset expiration on each request
    saveUninitialized: false, // Don't create session until something stored
    secret: env.SESSION_SECRET,
    name: env.SESSION_COOKIE_NAME || "sid",
    store: createSessionStore(env, logger),
  };

  return session(sessionConfig);
}

/**
 * Create the appropriate session store based on environment
 * @returns {session.Store} Session store instance
 */
function createSessionStore(env, logger) {
  // Use DynamoDB in production if configured
  if (env.USE_DYNAMODB_SESSIONS === "true" && env.AWS_REGION) {
    logger.debug("[Session] Using DynamoDB session store", {
      table: env.DYNAMODB_SESSION_TABLE || "sessions",
      region: env.AWS_REGION,
    });

    return new DynamoDBStore({
      client: new DynamoDBClient({
        region: env.AWS_REGION,
      }),
      table: env.DYNAMODB_SESSION_TABLE || "sessions",
    });
  }

  // Use in-memory store (default)
  logger.debug("[Session] Using in-memory session store (not suitable for production)");

  // express-session will use MemoryStore by default if no store is specified
  // We explicitly return undefined to use the default MemoryStore
  return undefined;
}

/**
 * Middleware to ensure user is authenticated
 */
export function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  // Store the original URL to redirect back after login
  req.session.returnTo = req.originalUrl;

  res.status(401).json({
    error: "Authentication required",
    loginUrl: `/api/login?destination=${encodeURIComponent(req.originalUrl)}`,
  });
}

/**
 * Middleware to attach user info to response locals
 */
export function attachUser(req, res, next) {
  if (req.user) {
    res.locals.user = req.user;
  }
  next();
}
