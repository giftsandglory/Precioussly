// netlify/functions/env.js
// Returns public runtime config for the client app.
// NOTE: This *exposes* the values to the browser. That's okay for Google
// OAuth Client ID and typical API keys used with Google Sheets.
// For true secrets, proxy requests server-side instead of returning keys.

export async function handler(event, context) {
  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store"
    },
    body: JSON.stringify({
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || "",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || ""
    })
  };
}
