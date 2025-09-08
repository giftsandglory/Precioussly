// netlify/functions/create-order.js
export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { amountInPaise, receipt } = JSON.parse(event.body || "{}");
  if (!amountInPaise) {
    return { statusCode: 400, body: "amountInPaise required" };
  }

  const key_id = process.env.RZP_KEY_ID;
  const key_secret = process.env.RZP_KEY_SECRET;

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization":
        "Basic " + Buffer.from(`${key_id}:${key_secret}`).toString("base64"),
    },
    body: JSON.stringify({
      amount: amountInPaise, // paise
      currency: "INR",
      receipt: receipt || `rcpt_${Date.now()}`,
      payment_capture: 1, // ✅ auto-capture on success
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return { statusCode: res.status, body: JSON.stringify(data) };
  }
  return { statusCode: 200, body: JSON.stringify(data) };
}