// Starts Google OAuth (creates PKCE + state, stores in HttpOnly cookies, redirects to Google)
const crypto = require("crypto");

const b64url = (buf) =>
  buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/,"");

exports.handler = async () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.OAUTH_REDIRECT;
  const siteUrl = process.env.SITE_URL || "";

  if (!clientId || !redirectUri) {
    return { statusCode: 500, body: "Missing Google env vars" };
  }

  // Create PKCE and state
  const codeVerifier = b64url(crypto.randomBytes(32));
  const codeChallenge = b64url(crypto.createHash("sha256").update(codeVerifier).digest());
  const state = b64url(crypto.randomBytes(24));

  // Build Google auth URL
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("code_challenge", codeChallenge);
  u.searchParams.set("code_challenge_method", "S256");
  u.searchParams.set("state", state);
  u.searchParams.set("prompt", "consent");
  u.searchParams.set("access_type", "offline");

  // Cookies (short TTL, HttpOnly)
  const cookieBase = "Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600";
  const cookies = [
    `pkce_verifier=${codeVerifier}; ${cookieBase}`,
    `oauth_state=${state}; ${cookieBase}`,
    // optional: remember where to return users
    `post_login=${encodeURIComponent(siteUrl + "/")}; ${cookieBase}`
  ];

  return {
    statusCode: 302,
    headers: { Location: u.toString() },
    multiValueHeaders: { "Set-Cookie": cookies }
  };
};