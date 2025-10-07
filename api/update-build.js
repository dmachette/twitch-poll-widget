// BUILD_TAG: API v1.0
import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const note = req.query.note || "No build note provided.";
  const buildFile = path.resolve("./build.json");

  let buildData;
  try {
    buildData = JSON.parse(fs.readFileSync(buildFile, "utf8"));
  } catch(err) {
    buildData = { build: { id: "", version: "v1.0.0", name: "Initial Build", date: "", notes: "" }, files: {} };
  }

  // Increment patch version
  const oldVersion = buildData.build.version.replace("v","") || "1.0.0";
  const parts = oldVersion.split(".").map(Number);
  parts[2] += 1;
  const newVersion = `v${parts.join(".")}`;
  const now = new Date().toISOString();
  const newBuildId = now.replace(/[:.]/g, "-");

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
  } catch(err) {
    res.status(500).json({ error: "Failed to write build.json" });
  }
}
