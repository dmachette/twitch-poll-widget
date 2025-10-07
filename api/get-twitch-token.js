// BUILD_TAG: API v5.2 - Secure Twitch Token Fetch
export default function handler(req, res) {
  const token = process.env.TWITCH_OAUTH_TOKEN;
  const clientId = process.env.TWITCH_CLIENT_ID;

  if (!token || !clientId) {
    return res.status(400).json({
      error: "Missing Twitch credentials. Please set TWITCH_OAUTH_TOKEN and TWITCH_CLIENT_ID in Vercel.",
    });
  }

  res.status(200).json({
    client_id: clientId,
    token: token,
  });
}
