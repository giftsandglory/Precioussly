// netlify/functions/sheet-proxy.js
export async function handler(event) {
  try {
    // Key picks which sheet to call
    const key = (event.queryStringParameters?.key || "").toUpperCase();

    // Map keys -> env var names
    const MAP = {
      ANNOUNCE:       process.env.SHEET_ID_ANNOUNCE,
      MENU:           process.env.SHEET_ID_MENU,
      MEDIA:          process.env.SHEET_ID_MEDIA,       // slider / hero
      COUPONS:        process.env.SHEET_ID_COUPONS,
      CATEGORIES:     process.env.SHEET_ID_CATEGORIES,
      CATALOG1:       process.env.SHEET_ID_CATALOG1,    // search catalog 1
      CATALOG2:       process.env.SHEET_ID_CATALOG2     // search catalog 2
    };

    const sheetId = MAP[key];
    if (!sheetId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Unknown key" }) };
    }

    // Using opensheet.elk.sh here (quick/low-friction). IDs stay server-side.
    const url = `https://opensheet.elk.sh/${sheetId}/Sheet1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Upstream error: ${res.status}`);
    const data = await res.json();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300"
      },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}