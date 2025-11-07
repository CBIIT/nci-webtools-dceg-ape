import * as client from "openid-client";
import passport from "passport";

class OpenIDStrategy extends passport.Strategy {
  constructor(config) {
    super();
    this.name = config.name || "oidc";
    this._client = config.client;
    this._redirectUri = config.redirectUri;
    this._params = config.params || {};
    this._usePKCE = config.usePKCE || false;
    this._logger = config.logger;
  }

  async authenticate(req, options = {}) {
    const logger = this._logger;

    try {
      // Handle OAuth callback with authorization code
      if (req.query.code) {
        await this._handleCallback(req, options, logger);
      } else {
        // Initiate OAuth flow
        await this._initiateAuth(req, logger);
      }
    } catch (error) {
      logger.error(`[OAuth Error] ${error.message}`, {
        code: error.code,
        stack: error.stack,
      });
      this.error(error);
    }
  }

  async _initiateAuth(req, logger) {
    // Generate security parameters
    const state = client.randomState();
    const nonce = client.randomNonce();

    // Store in session for callback validation
    req.session.oauth = {
      state,
      nonce,
      timestamp: Date.now(),
    };

    const authParams = {
      redirect_uri: this._redirectUri,
      state,
      nonce,
      ...this._params,
    };

    // Add PKCE if enabled
    if (this._usePKCE) {
      const codeVerifier = client.randomPKCECodeVerifier();
      const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);

      authParams.code_challenge = codeChallenge;
      authParams.code_challenge_method = "S256";

      req.session.oauth.codeVerifier = codeVerifier;
    }

    logger.debug("[OAuth] Initiating authentication flow", {
      state: state.substring(0, 10) + "...",
      sessionId: req.sessionID,
    });

    // Save session before redirect
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          logger.error("[OAuth] Failed to save session", { error: err.message });
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Build and redirect to authorization URL
    const authUrl = client.buildAuthorizationUrl(this._client, authParams);
    this.redirect(authUrl.href);
  }

  async _handleCallback(req, options, logger) {
    const oauth = req.session.oauth;

    if (!oauth) {
      throw new Error("OAuth session data not found. Session may have expired.");
    }

    // Check for OAuth errors in callback
    if (req.query.error) {
      const errorMsg = req.query.error_description || req.query.error;
      throw new Error(`OAuth provider error: ${errorMsg}`);
    }

    logger.debug("[OAuth] Processing callback", {
      state: req.query.state?.substring(0, 10) + "...",
      sessionId: req.sessionID,
    });

    // Build callback URL (only with standard OAuth parameters)
    const currentUrl = new URL(req.protocol + "://" + req.get("host") + req.originalUrl);
    const callbackUrl = new URL(this._redirectUri);

    // Copy only standard OAuth/OIDC parameters to avoid redirect_uri mismatch
    ["code", "state", "error", "error_description", "iss"].forEach((param) => {
      const value = currentUrl.searchParams.get(param);
      if (value) {
        callbackUrl.searchParams.set(param, value);
      }
    });

    // Exchange authorization code for tokens
    const tokenSet = await client.authorizationCodeGrant(this._client, callbackUrl, {
      expectedState: oauth.state,
      expectedNonce: oauth.nonce,
      pkceCodeVerifier: oauth.codeVerifier,
    });

    if (!tokenSet.id_token) {
      throw new Error("No ID token received from provider");
    }

    // Decode and extract user info from ID token
    const idTokenPayload = tokenSet.id_token.split(".")[1];
    const claims = JSON.parse(Buffer.from(idTokenPayload, "base64url").toString("utf8"));

    logger.debug("[OAuth] Authentication successful", {
      sub: claims.sub,
      email: claims.email,
    });

    // Clean up OAuth session data
    delete req.session.oauth;

    // Return user profile
    const user = {
      id: claims.sub,
      email: claims.email,
      name: claims.name,
      picture: claims.picture,
      raw: claims, // Store all claims for future use
    };

    this.success(user);
  }
}

/**
 * Create an OpenID Connect strategy
 * Automatically handles OAuth with client secret or PKCE for public clients
 */
export async function createOpenIDStrategy({
  issuerUrl,
  clientId,
  clientSecret,
  redirectUri,
  scope = "openid profile email",
  logger,
  name = "oidc",
}) {
  logger.debug("[OAuth] Discovering OpenID configuration", { issuerUrl });

  // Discover OpenID configuration from issuer
  const config = clientSecret
    ? await client.discovery(new URL(issuerUrl), clientId, clientSecret)
    : await client.discovery(new URL(issuerUrl), clientId, client.None);

  logger.debug("[OAuth] Discovery complete", {
    issuer: config.issuer?.metadata?.issuer || issuerUrl,
    authEndpoint: config.authorization_endpoint?.toString(),
  });

  return new OpenIDStrategy({
    name,
    client: config,
    redirectUri,
    params: { scope },
    usePKCE: !clientSecret, // Use PKCE for public clients
    logger,
  });
}
