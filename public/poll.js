async function initTwitch() {
  let username, token, channel;

  try {
    const res = await fetch('/api/get-twitch-token');
    const data = await res.json();
    username = data.username;
    token = data.token;
    channel = data.channel;
  } catch (err) {
    console.warn('Could not fetch credentials, falling back to anonymous');
    username = 'justinfan12345';
    token = null;
    channel = 'the_dj_machette';
  }

  const client = new tmi.Client({
    options: { debug: true },
    identity: token
      ? { username: username, password: token }
      : undefined,
    channels: [channel]
  });

  const statusDot = document.getElementById('status-dot');
  const channelNameEl = document.getElementById('channel-name');

  client.connect()
    .then(() => {
      statusDot.style.background = 'green';
      channelNameEl.textContent = token ? username : 'anonymous';
    })
    .catch(() => {
      statusDot.style.background = 'red';
      channelNameEl.textContent = 'offline';
    });

  // Listen for chat messages to handle polls
  client.on('message', (channel, tags, message, self) => {
    if (self) return;

    // Example: Start poll with !poll question option1 option2
    if (message.startsWith('!poll')) {
      const args = message.slice(5).trim().split(' ');
      const question = args.shift();
      const options = args;

      const container = document.getElementById('poll-container');
      container.innerHTML = `<h3>${question}</h3>`;
      options.forEach(opt => {
        const div = document.createElement('div');
        div.textContent = `${opt}: 0 votes`;
        container.appendChild(div);
      });
    }

    // TODO: add voting logic here
  });
}

initTwitch();
