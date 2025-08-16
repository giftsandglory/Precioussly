// netlify/functions/wa.js
export async function handler(event) {
  const number = process.env.WA_NUMBER; // e.g., 918586057887
  const defaultMsg = process.env.WA_DEFAULT_MSG || "Hi Precioussly! I need help with my order.";
  const text = event.queryStringParameters?.text || defaultMsg;

  if (!number) {
    return { statusCode: 500, body: "WA_NUMBER not configured" };
  }
  return {
    statusCode: 302,
    headers: {
      Location: `https://wa.me/${number}?text=${encodeURIComponent(text)}`
    }
  };
}