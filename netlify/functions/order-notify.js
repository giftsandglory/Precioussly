// /netlify/functions/order-notify.js
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
    const order = JSON.parse(event.body || "{}");

    const text =
      `📦 New COD order\n` +
      `Order ID: ${order.id}\n` +
      `Total: ₹${order?.amounts?.grandTotal ?? "-"}\n` +
      `Items: ${Array.isArray(order.items) ? order.items.length : 0}\n` +
      `Address:\n${order.address || "-"}`;

    const tgUrl = `https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`;
    await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.TG_CHAT_ID, text })
    });

    return { statusCode: 200, body: "ok" };
  } catch (e) {
    return { statusCode: 500, body: "server error" };
  }
};