// loader-tmi.js
(function loadTMI() {
  console.log("🔄 Loading TMI.js...");

  function loadScript(src, onLoad, onError) {
    const script = document.createElement("script");
    script.src = src;
    script.onload = onLoad;
    script.onerror = onError;
    document.head.appendChild(script);
  }

  // First try local
  loadScript("tmi.min.js", () => {
    console.log("✅ Loaded local tmi.min.js");
    window.tmiReady = true;
    initPollScript();
  }, () => {
    // Fallback to CDN
    console.warn("⚠️ Local tmi.min.js missing, loading from CDN...");
    loadScript("https://cdn.jsdelivr.net/npm/tmi.js@1.8.5/dist/tmi.min.js", () => {
      console.log("✅ Loaded TMI.js from CDN");
      window.tmiReady = true;
      initPollScript();
    }, () => console.error("❌ Failed to load TMI.js"));
  });

  // Dynamically load poll.js only after tmi is ready
  function initPollScript() {
    const pollScript = document.createElement("script");
    pollScript.src = "poll.js";
    pollScript.defer = true;
    document.body.appendChild(pollScript);
  }
})();
