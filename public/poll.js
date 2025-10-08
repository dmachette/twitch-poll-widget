// MACHETTE SQUAD Poll Widget v5.7.2 — No Double Post Edition (auth + reactive glow)

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
    await waitForTmi().catch(e => {
      console.warn("tmi.js not loaded within timeout; continuing may fail.", e);
    });

    const creds = await getTwitchCredentials();

    // build client config
    const clientConfig = { connection: { secure: true, reconnect: true }, channels: [channelName] };
    if (creds && creds.token) clientConfig.identity = { username: channelName, password: creds.token };

    // 🔒 disconnect any previous client before making a new one
    if (client && client.readyState !== "CLOSED") {
      try {
        console.log("Disconnecting previous TMI client to avoid duplicates...");
        await client.disconnect();
      } catch (e) {
        console.warn("Previous client disconnect failed (probably already closed).", e);
      }
    }

    client = new tmi.Client(clientConfig);

    // 🧩 Prevent multiple message listeners (guards against reconnect duplication)
    if (window.tmiMessageHandlerAttached) {
      console.log("Message handler already attached — skipping duplicate bind.");
    } else {
      window.tmiMessageHandlerAttached = true;
      client.on("message", (channel, tags, message, self) => {
        if (self) return;
        handleChatCommand(channel, tags, message);
      });
    }

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
   CHAT COMMAND HANDLER
---------------------------- */

function handleChatCommand(channel, tags, message) {
  const msg = message.trim();
  const user = tags.username;
  const isMod = !!tags.mod;
  const isBroadcaster = tags.badges && tags.badges.broadcaster;
  const isAuthorized = isMod || isBroadcaster;

  // === EASY CHAT POLL FORMAT ===
  if (msg.toLowerCase().startsWith("!poll ")) {
    const parts = msg.slice(6).split("/").map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const question = parts[0];
      const options = parts.slice(1, 6);
      startPoll(user, question, options);
    } else {
      client.say(channel, `@${user}, use format: !poll Question / Option1 / Option2 / Option3`);
    }
    return;
  }

  // === VOTE COMMAND ===
  if (msg.toLowerCase().startsWith("!vote ")) {
    const num = parseInt(msg.split(" ")[1]);
    castVote(user, num);
    return;
  }

  // === END POLL ===
  if (msg.toLowerCase() === "!endpoll") {
    if (!isAuthorized) {
      client.say(channel, `Only mods or broadcaster can end polls.`);
      return;
    }
    endPoll(user);
    return;
  }

  // === RESULTS ===
  if (msg.toLowerCase() === "!results") {
    showResults();
    return;
  }

  // === START POLL ===
  if (msg.startsWith("!startpoll ")) {
    if (!isAuthorized) {
      client.say(channel, `Only mods or broadcaster can start polls.`);
      return;
    }
    if (currentPoll) {
      client.say(channel, "A poll is already running!");
      return;
    }
    const options = message.replace("!startpoll ", "").trim().split(/\s+/).slice(0,5);
    if (options.length < 2) {
      client.say(channel, "You need at least 2 options to start a poll!");
      return;
    }
    currentPoll = { options, votes: Array(options.length).fill(0) };
    client.say(channel, `📊 Poll started! Options: ${options.join(", ")}`);
    renderPoll();
    return;
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
    const buildVersion = data.build?.version || "v5.7.2";
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
