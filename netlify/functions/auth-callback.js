// Handles Google redirect, exchanges code for tokens, creates a signed session cookie
const crypto = require("crypto");
const qs = require("querystring");

const b64url = (buf) =>
  buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/,"");

function parseCookie(header = "") {
  return header.split(/;\s*/).reduce((acc, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k.trim()] = decodeURIComponent(v);
    return acc;
  }, {});
}

exports.handler = async (event) => {
  try {
    const { code, state } = event.queryStringParameters || {};
    const cookies = parseCookie(event.headers.cookie || "");
    const savedVerifier = cookies.pkce_verifier;
    const savedState = cookies.oauth_state;

    if (!code || !state || !savedVerifier || state !== savedState) {
      return { statusCode: 400, body: "Invalid OAuth state" };
    }

    // Exchange code -> tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: qs.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        code_verifier: savedVerifier,
        grant_type: "authorization_code",
        redirect_uri: process.env.OAUTH_REDIRECT
      })
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      return { statusCode: 500, body: JSON.stringify(tokenJson) };
    }

    // Get user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` }
    });
    const user = await userRes.json();

    // Sign a small session cookie (name, email, picture only)
    const payload = JSON.stringify({
      name: user.name,
      email: user.email,
      picture: user.picture,
      sub: user.sub,
      at: Date.now()
    });

    const sig = crypto
      .createHmac("sha256", process.env.SESSION_SECRET || "dev_secret")
      .update(payload)
      .digest();

    const sessionValue = `${b64url(Buffer.from(payload))}.${b64url(sig)}`;

    // Set cookies; clear temp cookies
    const cookieBase = "Path=/; HttpOnly; Secure; SameSite=Lax";
    const cookiesOut = [
      `ps_session=${sessionValue}; ${cookieBase}; Max-Age=${60 * 60 * 24 * 30}`, // 30d
      "pkce_verifier=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
      "oauth_state=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
      "post_login=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"
    ];

    return {
      statusCode: 302,
      headers: { Location: process.env.SITE_URL || "/" },
      multiValueHeaders: { "Set-Cookie": cookiesOut }
    };
  } catch (e) {
    return { statusCode: 500, body: e.message || "OAuth error" };
  }
};