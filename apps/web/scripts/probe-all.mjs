// Pillar 3 regression runner — chains every probe + the magic-moment seed
// into one GO / NO-GO check. Run before every demo recording session.
//
//   node scripts/probe-all.mjs              (verbose — shows each probe's output)
//   node scripts/probe-all.mjs --quiet      (only the summary line)
//
// Pre-requisites:
//   - `npm run dev` is running (the HTTP probes hit it)
//   - .env has MONGO_URI + GEMINI_API_KEY + SUPER_ADMIN_*
//
// Ordering: API probes first (they don't mutate canonical state); then the
// magic-moment seed (which recreates the demo restaurants + diner); then
// the probes that depend on a confident diner being present in the DB.
//
// Exit code 0 only if everything passed.

import "dotenv/config";
import { spawn } from "child_process";
import { performance } from "perf_hooks";

const QUIET = process.argv.includes("--quiet");
const BASE = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

const STEPS = [
  { tag: "Step 0", name: "Order hardening probes", script: "scripts/step0-probes.mjs", needsDevServer: true },
  { tag: "Step 1", name: "Diner identity probes", script: "scripts/step1-probes.mjs", needsDevServer: true },
  { tag: "Step 5", name: "Magic-moment seed", script: "scripts/seed-demo.mjs", needsDevServer: false },
  { tag: "Step 3", name: "Cross-restaurant retrieval probes", script: "scripts/step3-probes.mjs", needsDevServer: true },
  { tag: "Step 4", name: "Restaurant context-card probes", script: "scripts/step4-probes.mjs", needsDevServer: true },
];

const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";

function header(text) {
  console.log(`\n${BOLD}${"─".repeat(70)}\n${text}\n${"─".repeat(70)}${RESET}`);
}

async function preflightDevServer() {
  try {
    const r = await fetch(`${BASE}/api/auth/session`, { signal: AbortSignal.timeout(3000) });
    return r.ok;
  } catch {
    return false;
  }
}

function runScript(script) {
  return new Promise((resolve) => {
    const start = performance.now();
    const child = spawn(process.execPath, [script], {
      stdio: QUIET ? ["ignore", "pipe", "pipe"] : "inherit",
      env: process.env,
    });
    let captured = "";
    if (QUIET) {
      child.stdout?.on("data", (d) => (captured += d.toString()));
      child.stderr?.on("data", (d) => (captured += d.toString()));
    }
    child.on("close", (code) => {
      const elapsed = ((performance.now() - start) / 1000).toFixed(1);
      resolve({ code: code ?? 1, elapsed, captured });
    });
    child.on("error", () => resolve({ code: 1, elapsed: "?", captured }));
  });
}

(async () => {
  console.log(`${BOLD}Pillar 3 regression runner${RESET}`);
  console.log(`  target: ${BASE}`);
  console.log(`  mode:   ${QUIET ? "quiet" : "verbose"}`);

  const devUp = await preflightDevServer();
  if (!devUp) {
    console.log(`\n${RED}✗ Dev server unreachable at ${BASE}${RESET}`);
    console.log(`  Start it with:  npm run dev`);
    console.log(`  Then re-run:    node scripts/probe-all.mjs`);
    process.exit(1);
  }
  console.log(`${DIM}  dev server: reachable${RESET}`);

  const results = [];
  for (const step of STEPS) {
    if (!QUIET) header(`${step.tag}  ${step.name}  (${step.script})`);
    else process.stdout.write(`  ${DIM}running ${step.tag} ${step.name}…${RESET} `);
    const result = await runScript(step.script);
    results.push({ ...step, ...result });
    if (QUIET) {
      console.log(result.code === 0 ? `${GREEN}OK${RESET} (${result.elapsed}s)` : `${RED}FAIL${RESET} (${result.elapsed}s)`);
    }
  }

  // Final summary.
  header(`Summary`);
  let allOK = true;
  for (const r of results) {
    const status = r.code === 0 ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
    console.log(`  ${status}  ${r.tag.padEnd(8)} ${r.name.padEnd(40)} ${DIM}${r.elapsed}s${RESET}`);
    if (r.code !== 0) allOK = false;
  }
  const totalTime = results.reduce((s, r) => s + Number(r.elapsed), 0).toFixed(1);

  console.log("");
  if (allOK) {
    console.log(`${GREEN}${BOLD}✅ GO — every check passed (${totalTime}s total)${RESET}`);
    console.log(`${DIM}   The full Pillar 3 stack is green. Safe to record the demo.${RESET}`);
  } else {
    const failedTags = results.filter((r) => r.code !== 0).map((r) => r.tag);
    console.log(`${RED}${BOLD}❌ NO-GO — ${failedTags.length} step(s) failed: ${failedTags.join(", ")}${RESET}`);
    console.log(`${YELLOW}   Re-run the failing probe in verbose mode to see details:${RESET}`);
    for (const r of results.filter((x) => x.code !== 0)) {
      console.log(`     node ${r.script}`);
    }
  }

  process.exit(allOK ? 0 : 1);
})();
