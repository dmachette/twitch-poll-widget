// MACHETTE SQUAD Poll Widget v5.4.0 — Auth Status Edition

let channelName = null;
const statusDot = document.getElementById("status-dot");
const channelSpan = document.getElementById("channel-name");
const authStatus = document.getElementById("auth-status");
const pollContainer = document.getElementById("poll-container");

let client;
let currentPoll = null;

/* ---------------------------
   FETCH CHANNEL & CREDENTIALS
---------------------------- */

// Get Twitch channel from Vercel environment
async function getChannelName() {
  try {
    const res = await fetch("/api/get-twitch-channel");
    const data = await res.json();
    channelName = data.channel || "anonymous";
    console.log("Fetched Twitch channel:", channelName);
  } catch (err) {
    console.warn("Failed to fetch Twitch channel:", err);
    channelName = "anonymous";
  }
}

// Get Twitch OAuth credentials (client ID + token)
async function getTwitchCredentials() {
  try {
    const res = await fetch("/api/get-twitch-token");
    if (!res.ok) throw new Error("Failed to get Twitch credentials");
    return await res.json();
  } catch (err) {
    console.error("Twitch credentials fetch failed:", err);
    return null;
  }
}

/* ---------------------------
   TWITCH CONNECTION
---------------------------- */

async function connectTwitch() {
  try {
    const creds = await getTwitchCredentials();
    if (!creds) throw new Error("Missing credentials");

    client = new tmi.Client({
      options: { debug: false },
      identity: {
        username: channelName,
        password: creds.token
      },
      channels: [channelName]
    });

    await client.connect();
    statusDot.style.background = "green";
    channelSpan.textContent = channelName;

    // Show auth status
    if (creds && creds.token && creds.token.startsWith("oauth:")) {
      authStatus.textContent = `🟢 Authenticated as ${channelName}`;
      authStatus.className = "auth-ok";
    } else {
      authStatus.textContent = `🔴 Anonymous mode`;
      authStatus.className = "auth-fail";
    }

    // Listen for chat commands
    client.on("message", (channel, tags, message, self) => {
      if (self) return;

      // Start poll
      if (message.startsWith("!startpoll ")) {
        if (currentPoll) {
          client.say(channelName, "A poll is already running!");
          return;
        }
        const options = message.replace("!startpoll ", "").split(" ").slice(0, 5);
        if (options.length < 2) {
          client.say(channelName, "You need at least 2 options to start a poll!");
          return;
        }
        currentPoll = { options, votes: Array(options.length).fill(0) };
        client.say(channelName, `📊 Poll started! Options: ${options.join(", ")}`);
        renderPoll();
      }

      // Vote
      if (message.startsWith("!vote ")) {
        if (!currentPoll) return;
        const vote = parseInt(message.split(" ")[1]) - 1;
        if (vote >= 0 && vote < currentPoll.options.length) {
          currentPoll.votes[vote]++;
          renderPoll();
        }
      }

      // End poll
      if (message === "!endpoll") {
        if (!currentPoll) return;
        const winnerIndex = currentPoll.votes.indexOf(Math.max(...currentPoll.votes));
        const winner = currentPoll.options[winnerIndex];
        client.say(channelName, `🏁 Poll ended! Winner: ${winner} 🎉`);
        currentPoll = null;
        pollContainer.innerHTML = "<p>No active poll</p>";
      }

      // Show results
      if (message === "!results" && currentPoll) {
        const resultsText = currentPoll.options
          .map((opt, i) => `${opt}: ${currentPoll.votes[i]} votes`)
          .join(", ");
        client.say(channelName, `📊 Current poll results: ${resultsText}`);
      }
    });
  } catch (err) {
    console.error("Failed to connect to Twitch:", err);
    statusDot.style.background = "red";
    channelSpan.textContent = "Anonymous";
    authStatus.textContent = `🔴 Anonymous mode`;
    authStatus.className = "auth-fail";
  }
}

/* ---------------------------
   RENDERING & VERSION
---------------------------- */

function renderPoll() {
  pollContainer.innerHTML = "";
  currentPoll.options.forEach((opt, i) => {
    const div = document.createElement("div");
    div.className = "poll-option";
    div.textContent = `[${i + 1}] ${opt} — ${currentPoll.votes[i]} votes`;
    pollContainer.appendChild(div);
  });
}

// Fetch build version
async function fetchBuildVersion() {
  try {
    const res = await fetch("/api/get-build");
    if (!res.ok) throw new Error("Failed to fetch build.json");
    const data = await res.json();
    const buildVersion = data.build?.version || "v5.4.0";
    document.getElementById("build-version").textContent = buildVersion;
  } catch (err) {
    console.warn("Could not load build version:", err);
  }
}

/* ---------------------------
   INITIALIZE
---------------------------- */

(async () => {
  await getChannelName();
  await fetchBuildVersion();
  await connectTwitch();
})();
