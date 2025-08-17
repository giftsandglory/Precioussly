// /netlify/functions/razorpay-webhook.js
const crypto = require("crypto");

// Netlify runs Node 18+ → global fetch is available
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    // 1) Verify Razorpay webhook signature
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET; // set in Netlify env
    const signature = event.headers["x-razorpay-signature"];
    const expected = crypto
      .createHmac("sha256", secret)
      .update(event.body)            // IMPORTANT: raw body string
      .digest("hex");

    if (signature !== expected) {
      return { statusCode: 401, body: "Invalid signature" };
    }

    // 2) Parse payload
    const payload = JSON.parse(event.body);
    const type = payload.event; // e.g., "payment.captured" or "payment.failed"
    const payment = payload?.payload?.payment?.entity || {};

    // 3) Build a concise Telegram message
    const inr = (paise) =>
      typeof paise === "number" ? (paise / 100).toFixed(2) : "0.00";

    let text;
    if (type === "payment.captured") {
      const notes = payment.notes || {};
      const addressLine = notes.address ? `\nAddress: ${notes.address}` : "";
      text =
        `✅ Payment received\n` +
        `ID: ${payment.id}\n` +
        `Amount: ₹${inr(payment.amount)}\n` +
        `Method: ${payment.method || "-"}\n` +
        `Email: ${payment.email || "-"} | Phone: ${payment.contact || "-"}${addressLine}`;
    } else if (type === "payment.failed") {
      text =
        `❌ Payment failed\n` +
        `ID: ${payment.id || "-"}\n` +
        `Reason: ${payment.error_description || payment.error_reason || "Unknown"}`;
    } else {
      // Ignore other events
      return { statusCode: 200, body: "Ignored" };
    }

    // 4) Send to Telegram (kept server-side; token not exposed)
    const tgUrl = `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`;
    const body = {
      chat_id: process.env.TG_CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true
    };

    await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    return { statusCode: 200, body: "ok" };
  } catch (e) {
    // Optional: log error for debugging
    return { statusCode: 500, body: "server error" };
  }
};