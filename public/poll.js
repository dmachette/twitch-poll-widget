// MACHETTE SQUAD Poll Widget v5.7.4
// "Chat Voice Restored Edition" — safe Twitch message replies
// --------------------------------------------------------------------------

let client = null;
let channelName = "";
let connected = false;
let messageHandlerAttached = false;
let pollActive = false;
let pollData = null;

// ====== STATUS INDICATOR UPDATES ======
function updateStatus(state, username) {
  const dot = document.getElementById("status-dot");
  const name = document.getElementById("channel-name");

  switch (state) {
    case "connected-auth":
      dot.style.backgroundColor = "#00ff00"; // green
      dot.style.boxShadow = "0 0 10px #00ff00";
      name.textContent = `Authenticated as ${username}`;
      break;
    case "connected-anon":
      dot.style.backgroundColor = "#ffff00"; // yellow
      dot.style.boxShadow = "0 0 10px #ffff00";
      name.textContent = `Anonymous mode`;
      break;
    case "disconnected":
    default:
      dot.style.backgroundColor = "#ff0000"; // red
      dot.style.boxShadow = "0 0 10px #ff0000";
      name.textContent = `Disconnected`;
      break;
  }
}

// ====== FETCH TWITCH CREDS FROM SERVERLESS API ======
async function connectTwitch() {
  try {
    const res = await fetch("/api/get-twitch-creds");
    const creds = await res.json();
    channelName = creds.channel;
    console.log("Fetched Twitch channel:", channelName);

    if (client) {
      console.log("Client already exists, skipping re-init.");
      return;
    }

    if (!creds.token) {
      console.warn("⚠️ No OAuth token detected — overlay will not reply in chat.");
    }

    // Initialize TMI client
    client = new tmi.Client({
      options: { debug: true },
      connection: { reconnect: true, secure: true },
      identity: creds.token
        ? { username: channelName, password: creds.token }
        : undefined,
      channels: [channelName || "anonymous"]
    });

    await client.connect();
    connected = true;

    if (!messageHandlerAttached) {
      client.on("message", handleChatMessage);
      messageHandlerAttached = true;
    }

    if (!creds.token) updateStatus("connected-anon");
    else updateStatus("connected-auth", channelName);

    console.log("✅ Connected to Twitch chat!");
  } catch (err) {
    console.error("Error connecting to Twitch:", err);
    updateStatus("disconnected");
  }
}

// ====== HANDLE CHAT MESSAGES ======
function handleChatMessage(channel, tags, message, self) {
  if (self) return;
  const lowerMsg = message.trim().toLowerCase();
  if (lowerMsg.startsWith("!")) handleChatCommand(tags.username, message);
}

// ====== POLL COMMAND HANDLER ======
function handleChatCommand(user, message) {
  const parts = message.trim().split(" ");
  const command = parts[0].toLowerCase();

  // Simplified syntax: !poll Question/Option1/Option2/...
  if (command === "!poll") {
    const pollText = message.slice(6).trim();
    const segments = pollText.split("/").map(s => s.trim()).filter(Boolean);

    if (segments.length < 2) {
      console.log("⚠️ Invalid poll format. Use: !poll Question/Option1/Option2/...");
      return;
    }

    const question = segments[0];
    const options = segments.slice(1, 6);
    startPoll(question, options);
  }

  if (command === "!vote") {
    const voteIndex = parseInt(parts[1]);
    if (pollActive && pollData && !isNaN(voteIndex)) {
      castVote(user, voteIndex);
    }
  }

  if (command === "!endpoll") {
    if (pollActive) endPoll();
  }

  if (command === "!results") {
    if (pollActive) showResults();
  }
}

// ====== POLL LOGIC ======
function startPoll(question, options) {
  if (pollActive) {
    console.log("⚠️ Poll already active!");
    return;
  }

  pollActive = true;
  pollData = {
    question,
    options,
    votes: new Array(options.length).fill(0),
    voters: new Set()
  };

  const container = document.getElementById("poll-container");
  container.innerHTML = `
    <div class="poll-box">
      <h2>${question}</h2>
      ${options.map((opt, i) => `<p>[${i + 1}] ${opt}</p>`).join("")}
      <p class="poll-note">(Vote using !vote 1–${options.length})</p>
    </div>
  `;

  // Announce poll in chat (only if authenticated)
  if (client && channelName && channelName !== "anonymous") {
    client.say(channelName, `🗳️ New Poll Started: ${question}`);
    options.forEach((opt, i) => {
      client.say(channelName, `[${i + 1}] ${opt}`);
    });
    client.say(channelName, `Vote now with !vote 1–${options.length}!`);
  }
}

function castVote(user, voteIndex) {
  if (!pollActive) return;
  if (pollData.voters.has(user)) return;

  if (voteIndex >= 1 && voteIndex <= pollData.options.length) {
    pollData.votes[voteIndex - 1]++;
    pollData.voters.add(user);
    console.log(`🗳️ ${user} voted for ${pollData.options[voteIndex - 1]}`);
  }
}

function endPoll() {
  pollActive = false;
  showResults();

  if (client && client.readyState() === "OPEN" && pollData && pollData.options) {
    const totalVotes = pollData.votes.reduce((a, b) => a + b, 0);
    const topIndex = pollData.votes.indexOf(Math.max(...pollData.votes));
    const winner = pollData.options[topIndex];

    if (channelName && channelName !== "anonymous") {
      client.say(channelName, `🏁 Poll Ended: "${pollData.question}" — Winner: ${winner} (${totalVotes} votes total)`);
    }
  }
}

function showResults() {
  const container = document.getElementById("poll-container");
  if (!pollData) return;

  const totalVotes = pollData.votes.reduce((a, b) => a + b, 0);
  const resultsHTML = pollData.options
    .map((opt, i) => {
      const votes = pollData.votes[i];
      const percent = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
      return `<p>[${i + 1}] ${opt} — ${votes} votes (${percent}%)</p>`;
    })
    .join("");

  container.innerHTML = `
    <div class="poll-box">
      <h2>Poll Ended: ${pollData.question}</h2>
      ${resultsHTML}
      <p class="poll-note">Total Votes: ${totalVotes}</p>
    </div>
  `;

  if (client && channelName && channelName !== "anonymous") {
    client.say(channelName, `📊 Poll Results: ${pollData.question}`);
    pollData.options.forEach((opt, i) => {
      const votes = pollData.votes[i];
      const percent = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
      client.say(channelName, `[${i + 1}] ${opt} — ${votes} votes (${percent}%)`);
    });
  }

  pollData = null;
}

// ====== INIT ======
connectTwitch();
