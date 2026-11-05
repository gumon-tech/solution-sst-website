// Writes out/build.json after `next build`: which commit this site was built from and a hash of every data file the shop system
// writes. The shop system confirms "live" when build.json's sha is the merge commit (or the data hash matches). No secrets.
//   https://srisiamthaitherapyandwellness.co.uk/build.json
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
if (!existsSync(path.join(root, "out"))) {
  console.error("out/ does not exist: run next build first");
  process.exit(1);
}
const sha = process.env.GITHUB_SHA || spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim() || "unknown";
const data = {};
for (const c of ["promotions", "hours", "closures", "notice", "faq-extra", "photos"]) {
  data[c] = createHash("sha256").update(readFileSync(path.join(root, "data", `${c}.json`))).digest("hex");
}
writeFileSync(path.join(root, "out/build.json"), JSON.stringify({ sha, built_at: new Date().toISOString(), data }, null, 2) + "\n");
console.log(`out/build.json written (sha ${sha.slice(0, 7)})`);
