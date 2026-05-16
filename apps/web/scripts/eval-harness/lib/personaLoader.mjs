// Persona schema loader + hand-rolled validator. Returns parsed personas
// along with per-file SHA-12 hashes for run versioning.
//
// We hand-roll validation instead of pulling in zod — keeps the harness
// dependency-free (the repo doesn't ship zod in apps/web today). The schema
// is small enough that the loss is negligible.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const REQUIRED_TOP = [
  "personaId",
  "description",
  "tasteAxes",
  "simulatedOrders",
  "targetRestaurantSlugs",
  "expectedBehavior",
];
const REQUIRED_TASTE = [
  "dietaryClass",
  "spicePreference",
  "homeCuisine",
  "primaryTraits",
  "avoidance",
];
const REQUIRED_EXPECTED = ["shouldRankHigh", "shouldRankLow", "antiMatches"];
const VALID_DIETARY = ["vegetarian", "vegan", "non-vegetarian", "jain", "gluten-free"];
const VALID_SPICE = ["mild", "medium", "hot", "mixed"];

export function validatePersona(p) {
  const errs = [];
  for (const f of REQUIRED_TOP) {
    if (p[f] === undefined) errs.push(`missing top-level "${f}"`);
  }
  if (typeof p.personaId !== "string" || !p.personaId.startsWith("p")) {
    errs.push(`personaId must be a string starting with "p" (got ${p.personaId})`);
  }
  if (typeof p.description !== "string" || p.description.length < 20) {
    errs.push("description must be a string of ≥20 chars");
  }
  if (p.tasteAxes && typeof p.tasteAxes === "object") {
    for (const f of REQUIRED_TASTE) {
      if (p.tasteAxes[f] === undefined) errs.push(`missing tasteAxes.${f}`);
    }
    if (p.tasteAxes.dietaryClass && !VALID_DIETARY.includes(p.tasteAxes.dietaryClass)) {
      errs.push(`tasteAxes.dietaryClass must be one of ${VALID_DIETARY.join("|")}`);
    }
    if (p.tasteAxes.spicePreference && !VALID_SPICE.includes(p.tasteAxes.spicePreference)) {
      errs.push(`tasteAxes.spicePreference must be one of ${VALID_SPICE.join("|")}`);
    }
    if (!Array.isArray(p.tasteAxes.primaryTraits) || p.tasteAxes.primaryTraits.length === 0) {
      errs.push("tasteAxes.primaryTraits must be a non-empty array");
    }
    if (!Array.isArray(p.tasteAxes.avoidance)) {
      errs.push("tasteAxes.avoidance must be an array");
    }
  }
  if (!Array.isArray(p.simulatedOrders) || p.simulatedOrders.length === 0) {
    errs.push("simulatedOrders must be a non-empty array");
  } else {
    for (const [i, o] of p.simulatedOrders.entries()) {
      if (!o.homeRestaurantSlug) errs.push(`simulatedOrders[${i}].homeRestaurantSlug required`);
      if (!Array.isArray(o.items) || o.items.length === 0) {
        errs.push(`simulatedOrders[${i}].items must be a non-empty array`);
      } else {
        for (const [j, it] of o.items.entries()) {
          if (!it.name) errs.push(`simulatedOrders[${i}].items[${j}].name required`);
          if (typeof it.daysAgo !== "number" || it.daysAgo < 0) {
            errs.push(`simulatedOrders[${i}].items[${j}].daysAgo must be a non-negative number`);
          }
        }
      }
    }
  }
  if (!Array.isArray(p.targetRestaurantSlugs) || p.targetRestaurantSlugs.length === 0) {
    errs.push("targetRestaurantSlugs must be a non-empty array");
  }
  if (p.expectedBehavior && typeof p.expectedBehavior === "object") {
    for (const f of REQUIRED_EXPECTED) {
      if (!Array.isArray(p.expectedBehavior[f])) {
        errs.push(`expectedBehavior.${f} must be an array`);
      }
    }
  }
  return errs;
}

function fileHash(content) {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 12);
}

export function loadPersonas(dir) {
  if (!fs.existsSync(dir)) {
    return { personas: [], errors: [{ file: dir, errors: ["persona directory does not exist"] }] };
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const personas = [];
  const errors = [];
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const raw = fs.readFileSync(fullPath, "utf8");
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      errors.push({ file, errors: [`JSON parse error: ${e.message}`] });
      continue;
    }
    const errs = validatePersona(parsed);
    if (errs.length) {
      errors.push({ file, errors: errs });
      continue;
    }
    personas.push({ ...parsed, _file: file, _hash: fileHash(raw) });
  }
  return { personas, errors };
}

// Public-only view of a persona that the JUDGE may see. expectedBehavior is
// QUARANTINED to bullseye.mjs and must never reach the judge prompt. This
// helper is the single chokepoint that enforces the boundary.
export function toJudgeView(persona) {
  return {
    personaId: persona.personaId,
    description: persona.description,
    tasteAxes: persona.tasteAxes,
  };
}
