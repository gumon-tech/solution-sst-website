// Diff-aware rules for shop-agent pull requests: compares data/<concern>.json at HEAD^1 (main) and HEAD (the merge result)
// and rejects edits to wording that is already on the site and removals. Run by .github/workflows/auto-merge-shop-agent.yml.
//   node scripts/check-shop-agent-diff.mjs <promotions|hours|closures|notice|faq-extra|photos>
import { spawnSync } from "node:child_process";
import { checkDiff, CONCERNS } from "./lib/shop-agent-diff.mjs";

const concern = process.argv[2];
if (!CONCERNS.includes(concern ?? "")) {
  console.error(`usage: check-shop-agent-diff.mjs <${CONCERNS.join("|")}>`);
  process.exit(2);
}
const show = (ref) => {
  const r = spawnSync("git", ["show", `${ref}:data/${concern}.json`], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (r.status !== 0) {
    console.error(`cannot read data/${concern}.json at ${ref}: ${r.stderr.trim()}`);
    process.exit(1);
  }
  try {
    return JSON.parse(r.stdout);
  } catch (e) {
    console.error(`data/${concern}.json at ${ref} is not valid JSON: ${e.message}`);
    process.exit(1);
  }
};
const errors = checkDiff(concern, show("HEAD^1"), show("HEAD"));
if (errors.length) {
  console.error(`data/${concern}.json: changes the shop system may not make:\n- ` + errors.join("\n- "));
  process.exit(1);
}
console.log(`shop-agent diff OK for ${concern}`);
