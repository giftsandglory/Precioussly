// netlify/functions/verify-signature.js
import crypto from "crypto";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { order_id, razorpay_payment_id, razorpay_signature } =
    JSON.parse(event.body || "{}");

  if (!order_id || !razorpay_payment_id || !razorpay_signature) {
    return { statusCode: 400, body: "Missing fields" };
  }

  const key_secret = process.env.RZP_KEY_SECRET;
  const bodyStr = `${order_id}|${razorpay_payment_id}`;
  const expected = crypto
    .createHmac("sha256", key_secret)
    .update(bodyStr)
    .digest("hex");

  const ok = expected === razorpay_signature;
  return {
    statusCode: ok ? 200 : 400,
    body: JSON.stringify({ ok }),
  };
}