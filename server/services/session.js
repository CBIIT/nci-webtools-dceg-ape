import Router from "express";
import passport from "passport";

const router = Router();

/**
 * Login route - initiates OAuth flow or handles callback
 */
router.get("/login", (req, res, next) => {
  // Store destination for post-login redirect
  if (req.query.destination && !req.query.code) {
    req.session.authDestination = req.query.destination;
  }

  // Authenticate with passport
  passport.authenticate("default", {
    failureRedirect: "/api/login?error=auth_failed",
    state: req.session.oauth?.state,
    nonce: req.session.oauth?.nonce,
  })(req, res, (err) => {
    if (err) {
      return handleAuthError(req, res, err);
    }

    // Authentication successful - set session expiry and redirect
    req.session.expires = req.session.cookie.expires;

    const destination = req.session.authDestination || "/";
    delete req.session.authDestination;

    res.redirect(destination);
  });
});

/**
 * Logout route - destroys session and logs out user
 */
router.get("/logout", (req, res) => {
  const logger = req.app.locals.logger;

  req.logout((err) => {
    if (err) {
      logger.error("[Logout] Error during logout", { error: err.message });
    }

    // Destroy the session completely
    req.session.destroy((err) => {
      if (err) {
        logger.error("[Logout] Error destroying session", { error: err.message });
      }
      res.redirect("/");
    });
  });
});

/**
 * Get current session info
 */
router.get("/session", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      expires: req.session.expires,
      user: req.user,
    });
  } else {
    res.json({
      authenticated: false,
    });
  }
});

/**
 * Refresh/extend session
 */
router.post("/session", (req, res) => {
  if (req.isAuthenticated()) {
    req.session.touch();
    req.session.expires = req.session.cookie.expires;

    res.json({
      authenticated: true,
      expires: req.session.expires,
      user: req.user,
    });
  } else {
    res.status(401).json({
      authenticated: false,
      error: "Not authenticated",
    });
  }
});

/**
 * Handle authentication errors with proper logging
 */
function handleAuthError(req, res, err) {
  const logger = req.app.locals.logger || console;

  const errorInfo = {
    message: err.message,
    error: err.error,
    error_description: err.error_description,
    code: err.code,
    status: err.status,
  };

  logger.error("[Auth] Authentication failed", errorInfo);

  // Send user-friendly error response
  res.status(err.status || 500).json({
    error: err.error || "authentication_failed",
    message: err.message || "Authentication failed. Please try again.",
  });
}

export default router;
