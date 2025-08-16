// Returns the logged-in user's basic profile from the signed cookie
const crypto = require("crypto");

function parseCookie(header = "") {
  return header.split(/;\s*/).reduce((acc, part) => {
    const [k, v] = part.split("=");
    if (k && v) acc[k.trim()] = decodeURIComponent(v);
    return acc;
  }, {});
}

function b64urlToBuf(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

exports.handler = async (event) => {
  const cookies = parseCookie(event.headers.cookie || "");
  const raw = cookies.ps_session;
  if (!raw) return { statusCode: 401, body: "Not logged in" };

  const [p, s] = raw.split(".");
  if (!p || !s) return { statusCode: 401, body: "Bad session" };

  const payload = b64urlToBuf(p);
  const sig = b64urlToBuf(s);
  const expected = crypto
    .createHmac("sha256", process.env.SESSION_SECRET || "dev_secret")
    .update(payload)
    .digest();

  if (!crypto.timingSafeEqual(sig, expected)) {
    return { statusCode: 401, body: "Invalid signature" };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: payload.toString("utf8")
  };
};