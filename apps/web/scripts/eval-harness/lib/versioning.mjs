// Captures everything you'd need to re-derive the same scores months from
// now. When the harness output is compared across runs, this metadata
// answers "what changed?" — model? prompt? rubric? persona JSON? git?
//
// Pinned in output JSON under the `version` field.

import fs from "node:fs";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

export function fileSha(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath, "utf8"))
    .digest("hex")
    .slice(0, 12);
}

export function getGitCommit() {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

export function getGitDirty() {
  try {
    const out = execSync("git status --porcelain", { encoding: "utf8" }).trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

export function captureVersion({
  judgeModel,
  judgeProvider,
  judgeTemperature,
  rubricPath,
  fewShotPath,
  judgePromptPath,
  personaHashes,
}) {
  return {
    runStartedAt: new Date().toISOString(),
    nodeVersion: process.version,
    gitCommit: getGitCommit(),
    gitDirty: getGitDirty(),
    judgeModel,
    judgeProvider,
    judgeTemperature,
    embeddingModel: "gemini-embedding-001",
    embeddingDimensions: 768,
    rubricHash: fileSha(rubricPath),
    fewShotHash: fileSha(fewShotPath),
    judgePromptHash: fileSha(judgePromptPath),
    personaHashes,
  };
}
