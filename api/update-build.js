// BUILD_TAG: API v5.6 - Auto-updater (increments patch)
import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const note = req.query.note || "No build note provided.";
  const buildFile = path.resolve("./build.json");

  let buildData;
  try {
    buildData = JSON.parse(fs.readFileSync(buildFile, "utf8"));
  } catch (err) {
    buildData = {
      build: { id: "", version: "v1.0.0", name: "Initial Build", date: "", notes: "" },
      files: {}
    };
  }

  const oldVersion = (buildData.build.version || "v1.0.0").replace(/^v/, "");
  const parts = oldVersion.split(".").map(n => parseInt(n, 10) || 0);
  parts[2] = (parts[2] || 0) + 1; // bump patch
  const newVersion = `v${parts.join(".")}`;
  const now = new Date().toISOString();
  const newBuildId = now.replace(/[:.]/g, "-");

  // Append an entry into a simple history array (create if missing)
  if (!Array.isArray(buildData.history)) buildData.history = [];
  buildData.history.push({
    id: newBuildId,
    version: newVersion,
    date: now,
    notes: note
  });

  // Update current
  buildData.build = {
    id: newBuildId,
    version: newVersion,
    name: `Auto Build ${newVersion}`,
    date: now,
    notes: note
  };

  try {
    fs.writeFileSync(buildFile, JSON.stringify(buildData, null, 2));
    res.status(200).json({ message: "✅ Build updated!", version: newVersion, date: now, note });
  } catch (err) {
    console.error("update-build write error:", err);
    res.status(500).json({ error: "Failed to write build.json" });
  }
}
