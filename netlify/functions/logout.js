// Clears the session cookie
exports.handler = async () => {
  return {
    statusCode: 302,
    headers: { Location: "/" },
    multiValueHeaders: {
      "Set-Cookie": [
        "ps_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax"
      ]
    }
  };
};