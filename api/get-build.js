// BUILD_TAG: API v1.0
import fs from "fs";
import path from "path";

export default function handler(req, res) {
  const buildFile = path.resolve("./build.json");
  try {
    const buildData = JSON.parse(fs.readFileSync(buildFile, "utf8"));
    res.status(200).json(buildData);
  } catch(err) {
    res.status(500).json({ error: "Failed to read build.json" });
  }
}
