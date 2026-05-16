// Cross-restaurant retrieval evaluation harness runner.
// See ./README.md for full docs.
//
// Run from apps/web/:
//   node scripts/eval-harness/run-harness.mjs --dry-run
//   node scripts/eval-harness/run-harness.mjs --sample 2
//   node scripts/eval-harness/run-harness.mjs

import { config as loadEnv } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import mongoose from "mongoose";

// Load env from multiple candidate locations. The harness can be invoked
// from apps/web/ (preferred), or from the monorepo root via a turbo task.
// dotenv silently skips missing files, so this is safe.
const __envBootstrap_dir = path.dirname(fileURLToPath(import.meta.url));
loadEnv(); // process.cwd()/.env
loadEnv({ path: path.join(__envBootstrap_dir, "..", "..", ".env") }); // apps/web/.env
loadEnv({ path: path.join(__envBootstrap_dir, "..", "..", "..", "..", ".env") }); // monorepo root .env

import connectDB from "../../lib/db.js";
import Restaurant from "../../lib/models/Restaurant.js";

import { loadPersonas } from "./lib/personaLoader.mjs";
import { simulatePersona } from "./lib/simulator.mjs";
import { getTasteVector, retrieveTop, getDestinationMenu } from "./lib/retrieval.mjs";
import { computeBullseye } from "./lib/bullseye.mjs";
import { judge } from "./lib/judge.mjs";
import { randomBaseline } from "./baselines/random.mjs";
import { popularityBaseline } from "./baselines/popularity.mjs";
import { aggregate } from "./lib/aggregator.mjs";
import { cleanupOne, cleanupAll, verifyClean } from "./lib/cleanup.mjs";
import { captureVersion } from "./lib/versioning.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PERSONA_DIR = path.join(__dirname, "personas");
const RESULTS_DIR = path.join(__dirname, "results");
const RUBRIC_PATH = path.join(__dirname, "rubric", "rubric.md");
const FEW_SHOT_PATH = path.join(__dirname, "rubric", "few-shot.md");
const JUDGE_PROMPT_PATH = path.join(__dirname, "judge-prompt.md");

const REQUIRED_RESTAURANTS = ["demo-mughlai", "demo-italian"];

// Token cost model (approximate). Used for the pre-flight cost gate only.
// Gemini 2.0 Flash list price: roughly $0.10/M input + $0.40/M output.
// Each judge call: ~2500 in + ~300 out ≈ $0.000370.
const COST_PER_CALL = 0.000370;

// Inter-call pacing — gemini-2.0-flash free tier is ~15 req/min, so 4s
// spacing keeps us safely below the ceiling. Overridable for paid keys
// via env: HARNESS_INTERCALL_MS=0 to disable.
const INTERCALL_MS = process.env.HARNESS_INTERCALL_MS
  ? Number(process.env.HARNESS_INTERCALL_MS)
  : 4500;

async function pace() {
  if (INTERCALL_MS > 0) await new Promise((r) => setTimeout(r, INTERCALL_MS));
}

function fmtUsd(x) {
  return `$${x.toFixed(4)}`;
}

function ts() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function main() {
  // ─── CLI ───────────────────────────────────────────────────────────
  const { values: args } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      sample: { type: "string" },
      "judge-temp": { type: "string" },
      "judge-model": { type: "string" },
      "no-cleanup": { type: "boolean", default: false },
      confirm: { type: "boolean", default: false },
      output: { type: "string" },
      personas: { type: "string" },
    },
  });
  const dryRun = args["dry-run"];
  const sampleN = args.sample ? Number(args.sample) : null;
  const judgeTemp = args["judge-temp"] ? Number(args["judge-temp"]) : 0.0;
  const judgeModel = args["judge-model"] || process.env.JUDGE_MODEL || "gemini-2.0-flash";
  const noCleanup = args["no-cleanup"];
  const confirmFlag = args.confirm;
  const personaDir = args.personas || PERSONA_DIR;

  console.log("─".repeat(72));
  console.log("Cross-Restaurant Retrieval Evaluation Harness");
  console.log("─".repeat(72));
  console.log(`mode:         ${dryRun ? "DRY-RUN (no LLM, no DB writes)" : "LIVE"}`);
  console.log(`judge:        ${judgeModel} @ temp ${judgeTemp}`);
  console.log(`personas dir: ${personaDir}`);
  console.log("");

  // ─── Load personas ────────────────────────────────────────────────
  const { personas: allPersonas, errors: loadErrors } = loadPersonas(personaDir);
  if (loadErrors.length) {
    console.error("Persona validation errors:");
    for (const e of loadErrors) {
      console.error(`  ${e.file}: ${e.errors.join("; ")}`);
    }
    if (allPersonas.length === 0) {
      console.error("No valid personas. Aborting.");
      process.exit(1);
    }
  }
  const personas = sampleN ? allPersonas.slice(0, sampleN) : allPersonas;
  console.log(`Loaded ${personas.length} persona(s)${sampleN ? ` (--sample ${sampleN})` : ""}`);

  const totalEvals = personas.reduce((s, p) => s + p.targetRestaurantSlugs.length, 0);
  // Each evaluation makes 3 judge calls: system retrieval + random baseline + popularity baseline.
  const JUDGE_CALLS_PER_EVAL = 3;
  const totalJudgeCalls = totalEvals * JUDGE_CALLS_PER_EVAL;
  const estimatedCost = totalJudgeCalls * COST_PER_CALL;
  console.log(`Total evaluations: ${totalEvals}  (= ${totalJudgeCalls} judge calls: system + random + popularity)`);
  console.log(`Estimated cost: ${fmtUsd(estimatedCost)}`);
  if (estimatedCost > 2 && !confirmFlag && !dryRun) {
    console.error(
      `Estimated cost ${fmtUsd(estimatedCost)} exceeds $2 — pass --confirm to proceed.`
    );
    process.exit(2);
  }
  console.log("");

  if (dryRun) {
    console.log("DRY-RUN: validating schemas + previewing payload assembly...");
    // Smoke-test prompt assembly so we catch missing markers/files BEFORE going live.
    const { buildJudgePayload } = await import("./lib/judge.mjs");
    const fakeMenu = [
      { name: "Sample Item", description: "demo", isVeg: true, spiceLevel: "mild" },
    ];
    const fakeRetrieved = [{ name: "Sample Item" }];
    const payload = buildJudgePayload({
      persona: personas[0],
      destinationName: "Sample Destination",
      menu: fakeMenu,
      retrieved: fakeRetrieved,
    });
    console.log("\n── Sample assembled payload (first persona) ──");
    console.log(payload);
    console.log("── End sample ──\n");
    console.log("DRY-RUN complete. Personas validate, prompt assembles, no DB or LLM touched.");
    return;
  }

  // ─── Connect DB + preflight ───────────────────────────────────────
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set. Configure apps/web/.env first.");
    process.exit(1);
  }
  await connectDB();

  const required = await Restaurant.find({ slug: { $in: REQUIRED_RESTAURANTS } })
    .select("slug")
    .lean();
  const found = new Set(required.map((r) => r.slug));
  const missing = REQUIRED_RESTAURANTS.filter((s) => !found.has(s));
  if (missing.length) {
    console.error(
      `Required seed-demo restaurants not found: ${missing.join(", ")}\n` +
        `Run "pnpm seed:demo" first.`
    );
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`✓ Seed-demo restaurants present: ${REQUIRED_RESTAURANTS.join(", ")}`);

  // Preflight cleanup: remove any harness data left from a prior crash.
  const preflightClean = await cleanupAll();
  if (preflightClean.dinersDeleted > 0) {
    console.log(
      `  preflight: cleared ${preflightClean.dinersDeleted} stale harness diner(s) + ${preflightClean.ordersDeleted} order(s)`
    );
  }

  // ─── Version snapshot ─────────────────────────────────────────────
  const personaHashes = Object.fromEntries(personas.map((p) => [p.personaId, p._hash]));
  const versionInfo = captureVersion({
    judgeModel,
    judgeProvider: process.env.GEMINI_API_KEY ? "gemini" : "openai",
    judgeTemperature: judgeTemp,
    rubricPath: RUBRIC_PATH,
    fewShotPath: FEW_SHOT_PATH,
    judgePromptPath: JUDGE_PROMPT_PATH,
    personaHashes,
  });

  // ─── Main loop ────────────────────────────────────────────────────
  const results = [];
  const runId = Date.now().toString(36);
  let totalUsage = { inputTokens: 0, outputTokens: 0 };

  for (const [pIdx, persona] of personas.entries()) {
    console.log(
      `\n[${pIdx + 1}/${personas.length}] persona ${persona.personaId}`
    );
    let dinerObjectId = null;
    try {
      // Simulate
      const sim = await simulatePersona(persona, runId);
      dinerObjectId = sim.dinerId;
      console.log(
        `  ✓ simulated: ${sim.ordersInserted} order(s), ${sim.uniqueItemsOrdered} item(s), taste conf=${sim.tasteConfidence.toFixed(2)}`
      );

      if (!sim.tasteVectorReady) {
        console.warn(
          `  ⚠ taste vector not built (${sim.tasteReason}) — skipping retrieval for this persona`
        );
        continue;
      }

      const { vector: tasteVector } = await getTasteVector(dinerObjectId);

      // For each target restaurant
      for (const target of persona.targetRestaurantSlugs) {
        console.log(`  → retrieving at ${target}`);
        const { items: retrieved } = await retrieveTop(target, tasteVector, 5);
        if (retrieved.length === 0) {
          console.warn(`    ⚠ vector search returned 0 items at ${target} — skipping`);
          continue;
        }
        const { restaurantName, items: menu } = await getDestinationMenu(target);

        // Judge the real system retrieval
        const judgeResult = await judge({
          persona,
          destinationName: restaurantName,
          menu,
          retrieved,
          rubricPath: RUBRIC_PATH,
          fewShotPath: FEW_SHOT_PATH,
          promptPath: JUDGE_PROMPT_PATH,
          model: judgeModel,
          temperature: judgeTemp,
        });
        totalUsage.inputTokens += judgeResult.usage.inputTokens;
        totalUsage.outputTokens += judgeResult.usage.outputTokens;
        await pace();

        // Baselines (same destination, same persona)
        const randomItems = await randomBaseline({
          personaId: persona.personaId,
          restaurantSlug: target,
          k: 5,
        });
        const randomJudge = await judge({
          persona,
          destinationName: restaurantName,
          menu,
          retrieved: randomItems,
          rubricPath: RUBRIC_PATH,
          fewShotPath: FEW_SHOT_PATH,
          promptPath: JUDGE_PROMPT_PATH,
          model: judgeModel,
          temperature: judgeTemp,
        });
        totalUsage.inputTokens += randomJudge.usage.inputTokens;
        totalUsage.outputTokens += randomJudge.usage.outputTokens;
        await pace();

        const popItems = await popularityBaseline({ restaurantSlug: target, k: 5 });
        const popJudge = await judge({
          persona,
          destinationName: restaurantName,
          menu,
          retrieved: popItems,
          rubricPath: RUBRIC_PATH,
          fewShotPath: FEW_SHOT_PATH,
          promptPath: JUDGE_PROMPT_PATH,
          model: judgeModel,
          temperature: judgeTemp,
        });
        totalUsage.inputTokens += popJudge.usage.inputTokens;
        totalUsage.outputTokens += popJudge.usage.outputTokens;
        await pace();

        // Bullseye (deterministic, no LLM)
        const bullseye = computeBullseye(retrieved, persona.expectedBehavior);

        results.push({
          personaId: persona.personaId,
          personaDescription: persona.description,
          targetRestaurantSlug: target,
          targetRestaurantName: restaurantName,
          retrievedTop5: retrieved.map((it) => it.name),
          judge: judgeResult,
          bullseye,
          baselines: {
            random: {
              top5: randomItems.map((it) => it.name),
              judge: randomJudge,
              bullseye: computeBullseye(randomItems, persona.expectedBehavior),
            },
            popularity: {
              top5: popItems.map((it) => it.name),
              judge: popJudge,
              bullseye: computeBullseye(popItems, persona.expectedBehavior),
            },
          },
        });

        console.log(
          `    system=${judgeResult.total}  random=${randomJudge.total}  pop=${popJudge.total}  bullseye=${bullseye.matchesInTop5}/${bullseye.expectedHighCount || "n/a"}  anti=${bullseye.antiMatchesInTop3}`
        );
      }
    } catch (err) {
      console.error(`  ✗ persona ${persona.personaId} failed: ${err.message}`);
      if (err.stack) console.error(err.stack.split("\n").slice(0, 5).join("\n"));
    } finally {
      // Per-persona cleanup — guarantees no leftovers even on crash.
      if (dinerObjectId && !noCleanup) {
        const c = await cleanupOne(dinerObjectId);
        if (c.dinerDeleted) {
          console.log(`  ✓ cleaned: ${c.ordersDeleted} order(s) + 1 diner`);
        }
      }
    }
  }

  // ─── Aggregate + write ────────────────────────────────────────────
  const aggregateResult = results.length > 0 ? aggregate(results) : null;

  const outPath = args.output
    ? path.resolve(args.output)
    : path.join(RESULTS_DIR, `run-${ts()}.json`);
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const finalCost =
    (totalUsage.inputTokens * 0.10 + totalUsage.outputTokens * 0.40) / 1_000_000;

  const output = {
    version: versionInfo,
    cliArgs: { dryRun, sampleN, judgeTemp, judgeModel, noCleanup },
    actualCost: round4(finalCost),
    totalTokens: totalUsage,
    results,
    aggregate: aggregateResult,
  };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  // ─── Final cleanup verification ───────────────────────────────────
  const verify = await verifyClean();
  console.log("");
  console.log("─".repeat(72));
  console.log("SUMMARY");
  console.log("─".repeat(72));
  if (aggregateResult) {
    const a = aggregateResult;
    console.log(
      `System:     mean=${a.system.mean.toFixed(2)}/12  σ=${a.system.std.toFixed(2)}  95% CI [${a.system.ci95[0]}, ${a.system.ci95[1]}]  n=${a.system.n}`
    );
    console.log(
      `Random:     mean=${a.random.mean.toFixed(2)}/12  σ=${a.random.std.toFixed(2)}  95% CI [${a.random.ci95[0]}, ${a.random.ci95[1]}]`
    );
    console.log(
      `Popularity: mean=${a.popularity.mean.toFixed(2)}/12  σ=${a.popularity.std.toFixed(2)}  95% CI [${a.popularity.ci95[0]}, ${a.popularity.ci95[1]}]`
    );
    console.log(`Δ vs random:     ${a.deltaVsRandom > 0 ? "+" : ""}${a.deltaVsRandom}`);
    console.log(`Δ vs popularity: ${a.deltaVsPopularity > 0 ? "+" : ""}${a.deltaVsPopularity}`);
    console.log(
      `Per-axis means: dietary=${a.perAxis.dietary}, flavor=${a.perAxis.flavor}, bridge=${a.perAxis.bridge}, ranking=${a.perAxis.ranking}`
    );
    if (a.bullseye.precisionTop5Mean !== null) {
      console.log(
        `Bullseye precision@5: ${(a.bullseye.precisionTop5Mean * 100).toFixed(1)}%  (anti-matches in top-3 avg: ${a.bullseye.antiMatchesInTop3Avg})`
      );
    }
  } else {
    console.log("No successful evaluations.");
  }
  console.log(
    `\nCleanup verification: ${verify.remainingDiners} harness diner(s) remaining, ${verify.remainingOrders} harness order(s) remaining.`
  );
  if (verify.remainingDiners > 0 || verify.remainingOrders > 0) {
    console.error("⚠  RESIDUE DETECTED — investigate before next run.");
  }
  console.log(`\nActual cost: ${fmtUsd(finalCost)}  (in:${totalUsage.inputTokens} out:${totalUsage.outputTokens} tokens)`);
  console.log(`Results written to: ${outPath}`);
  console.log("─".repeat(72));

  await mongoose.disconnect();
  process.exit(verify.remainingDiners + verify.remainingOrders > 0 ? 3 : 0);
}

function round4(x) {
  return Math.round(x * 10000) / 10000;
}

main().catch(async (err) => {
  console.error("\nrun-harness crashed:", err);
  // Best-effort cleanup on unhandled crash.
  try {
    if (mongoose.connection.readyState === 1) {
      const c = await cleanupAll();
      if (c.dinersDeleted) {
        console.error(`  emergency cleanup: ${c.dinersDeleted} diner(s) + ${c.ordersDeleted} order(s) removed`);
      }
      await mongoose.disconnect();
    }
  } catch (cleanupErr) {
    console.error("  emergency cleanup also failed:", cleanupErr.message);
  }
  process.exit(99);
});
