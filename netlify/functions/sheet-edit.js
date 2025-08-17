// netlify/functions/sheet-edit.js
export const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Allow only your two admin emails (you already check on the UI too)
  const ALLOWED = new Set(['preciously906@gmail.com','ask.precioussly@gmail.com']);

  // If you use Netlify Identity, you can read: context.clientContext.user.email
  const userEmail = (context.clientContext && context.clientContext.user && context.clientContext.user.email) || '';

  // If you don’t use Netlify Identity, you can also accept userEmail from frontend after
  // verifying via your existing "/.netlify/functions/session". This is an extra UI check.
  // const userEmail = JSON.parse(event.body || '{}').userEmail || '';

  if (!ALLOWED.has(userEmail)) {
    return { statusCode: 403, body: 'Not allowed' };
  }

  const GAS_URL = process.env.GAS_URL;          // set in Netlify env
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY; // same as API_KEY in Apps Script

  try {
    const payload = JSON.parse(event.body || '{}');
    payload.apiKey = ADMIN_API_KEY;

    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    return { statusCode: res.status, body: text };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok:false, error: String(err) }) };
  }
};