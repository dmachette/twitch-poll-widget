export default function handler(req, res) {
  // Return JSON containing Twitch credentials
  res.status(200).json({
    username: process.env.TWITCH_USERNAME,
    token: process.env.TWITCH_OAUTH_TOKEN,
    channel: process.env.TWITCH_CHANNEL
  });
}
