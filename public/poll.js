(async () => {
  const username = process.env.TWITCH_USERNAME || "anonymous";
  const token = process.env.TWITCH_OAUTH_TOKEN;
  const channel = process.env.TWITCH_CHANNEL || "the_dj_machette";

  const statusDot = document.getElementById("status-dot");
  const statusText = document.getElementById("status-text");

  const identity = token
    ? { username, password: token }
    : undefined;

  const client = new tmi.Client({
    connection: { reconnect: true, secure: true },
    identity,
    channels: [channel]
  });

  client.on("connected", () => {
    statusDot.classList.remove("offline");
    statusDot.classList.add("online");
    statusText.textContent = identity ? `Connected as ${username}` : "Connected anonymously";
  });

  client.on("disconnected", () => {
    statusDot.classList.remove("online");
    statusDot.classList.add("offline");
    statusText.textContent = "Disconnected";
  });

  client.connect().catch(console.error);
})();
