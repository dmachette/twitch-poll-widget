// BUILD_TAG: API v5.3 - Secure Twitch Token Fetch
export default function handler(req, res) {
  const token = process.env.TWITCH_OAUTH_TOKEN;
  const clientId = process.env.TWITCH_CLIENT_ID || null;

  if (!token) {
    return res.status(400).json({
      error: "Missing Twitch credentials. Please set TWITCH_OAUTH_TOKEN in Vercel environment variables."
    });
  }

  // We return token and client id (clientId may be null)
  res.status(200).json({
    client_id: clientId,
    token: token
  });
}
