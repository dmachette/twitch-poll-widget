// MACHETTE SQUAD Poll Widget v5.7.3
// "Unified Creds Edition" — switched to /api/get-twitch-creds
// ------------------------------------------------------------

let client = null;
let channelName = "";
let connected = false;
let messageHandlerAttached = false;

// ====== FETCH TWITCH CREDS FROM SERVERLESS API ======
async function connectTwitch() {
  try {
    const res = await fetch("/api/get-twitch-creds"); // ← updated endpoint
    const creds = await res.json();
    channelName = creds.channel;
    console.log("Fetched Twitch channel:", channelName);

    if (client) {
      console.log("Client already exists, skipping re-init.");
      return;
    }

    client = new tmi.Client({
      options: { debug: true },
      connection: { secure: true, reconnect: true },
      identity: creds.token
        ? { username: creds.channel, password: creds.token }
        : undefined,
      channels: [creds.channel],
    });

    // ====== CONNECT TO TWITCH ======
    await client.connect();
    connected = true;
    console.log("✅ Connected to Twitch chat!");

    // ====== UPDATE STATUS DOT ======
    const authStatus = document.getElementById("auth-status");
    const statusDot = document.getElementById("status-dot");
    if (creds.token && creds.token.startsWith("oauth:")) {
      authStatus.textContent = `🟢 Authenticated as ${channelName}`;
      authStatus.className = "auth-ok";
      document.querySelector(".poll-panel").classList.add("authenticated");
    } else {
      authStatus.textContent = `🔴 Anonymous mode`;
      authStatus.className = "auth-fail";
      document.querySelector(".poll-panel").classList.add("anonymous");
    }

    // ====== ATTACH MESSAGE HANDLER (ONLY ONCE) ======
    if (!messageHandlerAttached) {
      client.on("message", handleChatCommand);
      messageHandlerAttached = true;
    }

  } catch (err) {
    console.error("Error connecting to Twitch:", err);
    connected = false;
  }
}

connectTwitch();

// ==============================================
// ========== POLL LOGIC BELOW ==================
// ==============================================

let activePoll = null;
let votes = {};

// ====== HANDLE CHAT COMMANDS ======
function handleChatCommand(channel, tags, message, self) {
  if (self || !message) return;
  const msg = message.trim();

  // === EASY CHAT POLL FORMAT ===
  if (msg.toLowerCase().startsWith("!poll ")) {
    const parts = msg.slice(6).split("/").map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const question = parts[0];
      const options = parts.slice(1, 6); // limit 5 options
      startPoll(tags.username, question, options);
    } else {
      client.say(channelName, `@${tags.username}, use format: !poll Question / Option1 / Option2 / Option3`);
    }
    return;
  }

  // === VOTE COMMAND ===
  if (msg.toLowerCase().startsWith("!vote ")) {
    const num = parseInt(msg.split(" ")[1]);
    castVote(tags.username, num);
    return;
  }

  // === END POLL ===
  if (msg.toLowerCase() === "!endpoll") {
    endPoll(tags.username);
    return;
  }

  // === RESULTS ===
  if (msg.toLowerCase() === "!results") {
    showResults();
    return;
  }
}

// ====== START POLL ======
function startPoll(username, question, options) {
  if (activePoll) {
    client.say(channelName, `@${username}, a poll is already running!`);
    return;
  }

  activePoll = { question, options, votes: Array(options.length).fill(0) };
  votes = {};

  renderPoll(question, options);

  client.say(channelName, `📊 New poll started by ${username}: ${question} (${options.map((opt, i) => `${i + 1}) ${opt}`).join(", ")})`);
  console.log("Poll started:", activePoll);
}

// ====== CAST VOTE ======
function castVote(username, optionNumber) {
  if (!activePoll) return;

  const choice = parseInt(optionNumber);
  if (isNaN(choice) || choice < 1 || choice > activePoll.options.length) return;

  if (votes[username]) {
    client.say(channelName, `@${username}, you already voted!`);
    return;
  }

  activePoll.votes[choice - 1]++;
  votes[username] = choice;
  updatePollDisplay();
}

// ====== END POLL ======
function endPoll(username) {
  if (!activePoll) {
    client.say(channelName, `@${username}, there’s no active poll.`);
    return;
  }

  const totalVotes = activePoll.votes.reduce((a, b) => a + b, 0);
  const winnerIndex = activePoll.votes.indexOf(Math.max(...activePoll.votes));
  const winner = activePoll.options[winnerIndex];

  client.say(channelName, `🏁 Poll ended! "${winner}" wins with ${activePoll.votes[winnerIndex]} votes (${totalVotes} total).`);
  activePoll = null;
  votes = {};
  clearPollDisplay();
}

// ====== SHOW RESULTS ======
function showResults() {
  if (!activePoll) return;
  const results = activePoll.options
    .map((opt, i) => `${i + 1}) ${opt}: ${activePoll.votes[i]} votes`)
    .join(" | ");
  client.say(channelName, `📊 Current results: ${results}`);
}

// ====== DISPLAY POLL IN OVERLAY ======
function renderPoll(question, options) {
  const container = document.getElementById("poll-container");
  container.innerHTML = `
    <div class="poll-question">${question}</div>
    <ul class="poll-options">
      ${options.map((opt, i) => `<li>${i + 1}) ${opt} — <span id="vote-${i}">0</span> votes</li>`).join("")}
    </ul>
  `;
}

// ====== UPDATE POLL DISPLAY ======
function updatePollDisplay() {
  if (!activePoll) return;
  activePoll.votes.forEach((count, i) => {
    const el = document.getElementById(`vote-${i}`);
    if (el) el.textContent = count;
  });
}

// ====== CLEAR POLL DISPLAY ======
function clearPollDisplay() {
  document.getElementById("poll-container").innerHTML = "<p>No active poll</p>";
}
