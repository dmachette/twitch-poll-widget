export default async function handler(req, res) {
  const channel = process.env.TWITCH_CHANNEL || "anonymous";
  const token = process.env.TWITCH_OAUTH_TOKEN || null;
  res.status(200).json({ channel, token });
}
