// BUILD_TAG: API v5.2 - Secure Twitch Channel Name
export default function handler(req, res) {
  const twitchChannel = process.env.TWITCH_CHANNEL;
  if (!twitchChannel) {
    return res.status(404).json({ error: "TWITCH_CHANNEL not set in environment variables." });
  }
  res.status(200).json({ channel: twitchChannel });
}
