// MACHETTE SQUAD Poll Widget v5.6.1 — final poll.js (auth + reactive glow)

let channelName = null;
const statusDot = document.getElementById("status-dot");
const channelSpan = document.getElementById("channel-name");
const authStatus = document.getElementById("auth-status");
const pollContainer = document.getElementById("poll-container");
const pollPanel = document.querySelector(".poll-panel");

let client;
let currentPoll = null;

/* Wait for tmi to be available (loader may load asynchronously) */
function waitForTmi(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function check() {
      if (window.tmi && typeof window.tmi.Client === "function") return resolve();
      if (Date.now() - start > timeout) return reject(new Error("tmi.js not available"));
      setTimeout(check, 100);
    })();
  });
}

/* ---------------------------
   FETCH CHANNEL & CREDENTIALS
---------------------------- */

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

async function getTwitchCredentials() {
  try {
    const res = await fetch("/api/get-twitch-token");
    if (!res.ok) {
      console.warn("No credentials endpoint or token not set");
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn("Twitch credentials fetch failed:", err);
    return null;
  }
}

/* ---------------------------
   TWITCH CONNECTION (AUTH OR FALLBACK)
---------------------------- */

async function connectTwitch() {
  try {
    // ensure tmi.js loaded
    await waitForTmi().catch(e => {
      console.warn("tmi.js not loaded within timeout; continuing may fail.", e);
    });

    const creds = await getTwitchCredentials();

    // build client config
    const clientConfig = { connection: { secure: true, reconnect: true }, channels: [channelName] };

    if (creds && creds.token) {
      clientConfig.identity = { username: channelName, password: creds.token };
    }

    client = new tmi.Client(clientConfig);

    await client.connect();

    // connected
    statusDot.style.background = "green";
    channelSpan.textContent = channelName;

    // set auth UI + panel class
    if (creds && creds.token && typeof creds.token === "string" && creds.token.startsWith("oauth:")) {
      authStatus.textContent = `🟢 Authenticated as ${channelName}`;
      authStatus.className = "auth-ok";
      pollPanel.classList.remove("anonymous");
      pollPanel.classList.add("authenticated");
    } else {
      authStatus.textContent = `🔴 Anonymous mode`;
      authStatus.className = "auth-fail";
      pollPanel.classList.remove("authenticated");
      pollPanel.classList.add("anonymous");
    }

    // Listen for chat commands
    client.on("message", (channel, tags, message, self) => {
      if (self) return;

      // Only allow moderators & broadcaster to start/end polls
      const isMod = !!tags.mod;
      const isBroadcaster = tags.badges && tags.badges.broadcaster;
      const isAuthorized = isMod || isBroadcaster;

      // Start poll: only authorized
      if (message.startsWith("!startpoll ")) {
        if (!isAuthorized) {
          client.say(channelName, `Only mods or broadcaster can start polls.`);
          return;
        }
        if (currentPoll) {
          client.say(channelName, "A poll is already running!");
          return;
        }
        const options = message.replace("!startpoll ", "").trim().split(/\s+/).slice(0,5);
        if (options.length < 2) {
          client.say(channelName, "You need at least 2 options to start a poll!");
          return;
        }
        currentPoll = { options, votes: Array(options.length).fill(0) };
        client.say(channelName, `📊 Poll started! Options: ${options.join(", ")}`);
        renderPoll();
        return;
      }

      // Vote
      if (message.startsWith("!vote ")) {
        if (!currentPoll) return;
        const idx = parseInt(message.split(/\s+/)[1], 10) - 1;
        if (Number.isInteger(idx) && idx >= 0 && idx < currentPoll.options.length) {
          currentPoll.votes[idx]++;
          renderPoll();
        }
        return;
      }

      // End poll: only authorized
      if (message.trim() === "!endpoll") {
        if (!isAuthorized) {
          client.say(channelName, `Only mods or broadcaster can end polls.`);
          return;
        }
        if (!currentPoll) {
          client.say(channelName, "No poll is running.");
          return;
        }
        // announce results
        const resultsText = currentPoll.options.map((o,i) => `${o}: ${currentPoll.votes[i]}v`).join(", ");
        const winnerIndex = currentPoll.votes.indexOf(Math.max(...currentPoll.votes));
        const winner = currentPoll.options[winnerIndex];
        client.say(channelName, `🏁 Poll ended! Winner: ${winner} — ${resultsText}`);
        currentPoll = null;
        pollContainer.innerHTML = "<p>No active poll</p>";
        return;
      }

      // Results in chat
      if (message.trim() === "!results") {
        if (!currentPoll) {
          client.say(channelName, "No active poll.");
          return;
        }
        const resultsText = currentPoll.options.map((o,i) => `${o}: ${currentPoll.votes[i]}v`).join(", ");
        client.say(channelName, `📊 Current poll results: ${resultsText}`);
        return;
      }
    });
  } catch (err) {
    console.error("Failed to connect to Twitch:", err);
    statusDot.style.background = "red";
    channelSpan.textContent = "Anonymous";
    authStatus.textContent = `🔴 Anonymous mode`;
    authStatus.className = "auth-fail";
    pollPanel.classList.remove("authenticated");
    pollPanel.classList.add("anonymous");
  }
}

/* ---------------------------
   RENDERING & VERSION
---------------------------- */

function renderPoll() {
  if (!currentPoll) {
    pollContainer.innerHTML = "<p>No active poll</p>";
    return;
  }
  pollContainer.innerHTML = "";
  currentPoll.options.forEach((opt, i) => {
    const div = document.createElement("div");
    div.className = "poll-option";
    div.textContent = `[${i + 1}] ${opt} — ${currentPoll.votes[i]} votes`;
    pollContainer.appendChild(div);
  });
}

async function fetchBuildVersion() {
  try {
    const res = await fetch("/api/get-build");
    if (!res.ok) throw new Error("Failed to fetch build.json");
    const data = await res.json();
    const buildVersion = data.build?.version || "v5.6.1";
    document.getElementById("build-version").textContent = buildVersion;
  } catch (err) {
    console.warn("Could not load build version:", err);
  }
}

/* ---------------------------
   INIT
---------------------------- */

(async () => {
  await getChannelName();
  await fetchBuildVersion();
  await connectTwitch();
})();
