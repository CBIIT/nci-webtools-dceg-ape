import { createOpenIDStrategy } from "./passportStrategies.js";

/**
 * Create the default authentication strategy based on environment config
 * Automatically detects whether to use OAuth (with client secret) or PKCE (public client)
 */
export async function createDefaultAuthStrategy(env, logger) {
  return createOpenIDStrategy({
    issuerUrl: env.OIDC_BASE_URL,
    clientId: env.OIDC_CLIENT_ID,
    clientSecret: env.OIDC_CLIENT_SECRET || null,
    redirectUri: env.OIDC_CALLBACK_URI,
    scope: env.OIDC_SCOPE || "openid profile email",
    logger,
    name: "default",
  });
}
