// BUILD_TAG: API v5.6 - Build manifest endpoint
import fs from "fs";
import path from "path";

export default function handler(req, res) {
  try {
    const buildFile = path.resolve("./build.json");
    const buildData = JSON.parse(fs.readFileSync(buildFile, "utf8"));
    res.status(200).json(buildData);
  } catch (err) {
    console.error("get-build error:", err);
    res.status(500).json({ error: "Failed to read build.json" });
  }
}
