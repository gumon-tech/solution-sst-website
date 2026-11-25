// Runs the shell of rules 1 and 2 of .github/workflows/auto-merge-shop-agent.yml (taken from the workflow file itself, not a
// copy) and rule 4 (scripts/check-shop-agent-diff.mjs) against real merge commits in a throwaway git repository, the way the
// check job sees a pull request: HEAD is the merge, HEAD^1 is main, HEAD^2 is the pull request's head.
// Run: node scripts/test-workflow-rules.mjs   (needs git and bash)
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const workflow = readFileSync(path.join(root, ".github/workflows/auto-merge-shop-agent.yml"), "utf8").split("\n");

/** The `run: |` block of the step whose name starts with `name`, de-indented as YAML does. */
function runBlock(name) {
  const start = workflow.findIndex((l) => l.trim().startsWith(`- name: ${name}`));
  if (start < 0) throw new Error(`workflow step "${name}" not found`);
  const runAt = workflow.findIndex((l, i) => i > start && /^\s*run: \|\s*$/.test(l));
  const runIndent = workflow[runAt].search(/\S/);
  const body = [];
  for (const l of workflow.slice(runAt + 1)) {
    if (l.trim() && l.search(/\S/) <= runIndent) break;
    body.push(l);
  }
  const ind = body.find((l) => l.trim()).search(/\S/);
  return body.map((l) => l.slice(ind)).join("\n").trimEnd() + "\n";
}
const RULE1 = runBlock("Rule 1, which concern");
const RULE1_KNOWN = runBlock("Rule 1, the concern is known");
const RULE2 = runBlock("Rule 2,");

const tmp = mkdtempSync(path.join(os.tmpdir(), "wf-rules-"));
const dir = path.join(tmp, "repo");
mkdirSync(dir);
const git = (...args) => {
  const r = spawnSync("git", ["-c", "user.name=test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd: dir, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
};
const write = (rel, text) => {
  mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
  writeFileSync(path.join(dir, rel), text);
};
const json = (rel) => JSON.parse(readFileSync(path.join(root, rel), "utf8"));

// main: the real data files and two content files.
git("init", "-q", "-b", "main");
cpSync(path.join(root, "data"), path.join(dir, "data"), { recursive: true });
for (const f of ["content/home.md", "content/privacy.md"]) cpSync(path.join(root, f), path.join(dir, f));
git("add", "-A");
git("commit", "-q", "-m", "main");

const services = json("data/services.json");
const copy = json("data/copy.json");
const seo = json("data/seo.json");
const pretty = (o) => JSON.stringify(o, null, 2) + "\n";
const priceChange = () => {
  const s = structuredClone(services);
  s.services[0].price_gbp += 2;
  return pretty(s);
};
const newSlug = () => {
  const s = structuredClone(services);
  s.services.push({ ...s.services[0], slug: "reflexology", name: "Reflexology" });
  return pretty(s);
};
const copyEdit = () => pretty({ ...copy, slots: { ...copy.slots, "home.hero.lead": "We bring the traditional techniques of Thai massage to Greenwich, Cutty Sark, with a modern touch." } });
const copyNewKey = () => pretty({ ...copy, slots: { ...copy.slots, "home.hero.subtitle": null } });
const seoEdit = () => pretty({ ...seo, pages: { ...seo.pages, "/": { title: "Thai Massage | Sri Siam Thai Therapy & Wellness", description: null } } });
const touch = (rel) => () => readFileSync(path.join(dir, rel), "utf8") + "\n";

// [branch, changes {path: () => text | null (delete)}, expected: "merge" | "rule1" | "rule2" | "rule4", sha override]
const cases = [
  ["shop-agent/services-p1", { "data/services.json": priceChange }, "merge"],
  ["shop-agent/services-p2", { "data/services.json": priceChange, "data/promotions.json": touch("data/promotions.json") }, "rule2"],
  ["shop-agent/services-p3", { "data/services.json": priceChange, "content/home.md": touch("content/home.md") }, "rule2"],
  ["shop-agent/services-p4", { "data/services.json": newSlug }, "rule4"],
  ["shop-agent/copy-c1", { "data/copy.json": copyEdit }, "merge"],
  ["shop-agent/copy-c2", { "content/home.md": touch("content/home.md") }, "rule2"],
  ["shop-agent/copy-c3", { "data/copy.json": copyEdit, "content/privacy.md": touch("content/privacy.md") }, "rule2"],
  ["shop-agent/copy-c4", { "data/copy.json": copyEdit, "content/new-page.md": () => "# New\n" }, "rule2"],
  ["shop-agent/copy-c5", { "data/copy.json": () => null }, "rule2"],
  ["shop-agent/copy-c6", { "data/copy.json": copyNewKey }, "rule4"],
  ["shop-agent/copy-c7", { "data/seo.json": seoEdit }, "rule2"],
  ["shop-agent/seo-s1", { "data/seo.json": seoEdit }, "merge"],
  ["shop-agent/seo-s2", { "data/seo.json": seoEdit, "data/copy.json": copyEdit }, "rule2"],
  ["shop-agent/hours-h1", { "data/hours.json": touch("data/hours.json") }, "merge"],
  ["shop-agent/promotions-x1", { "data/promotions.json": touch("data/promotions.json") }, "merge"],
  ["shop-agent/photos-x1", { "data/photos.json": touch("data/photos.json"), "public/img/sp-front-room-800.webp": () => "RIFF" }, "merge"],
  ["shop-agent/photos-x2", { "data/photos.json": touch("data/photos.json"), "data/copy.json": copyEdit }, "rule2"],
  ["shop-agent/foo-x", { "data/copy.json": copyEdit }, "rule1"],
  ["shop-agent/copy-", { "data/copy.json": copyEdit }, "rule1"],
  ["shop-agent/copyedit", { "data/copy.json": copyEdit }, "rule1"],
  ["shop-agent/services-p5", { "data/services.json": priceChange }, "rule2", "0000000000000000000000000000000000000000"],
];

const bash = (script, env) => spawnSync("bash", ["-e", "-c", script], { cwd: dir, encoding: "utf8", env: { PATH: process.env.PATH, HOME: process.env.HOME, ...env } });
let failed = 0;
for (const [branch, changes, want, shaOverride] of cases) {
  git("checkout", "-q", "-B", branch, "main");
  for (const [rel, f] of Object.entries(changes)) {
    const text = f();
    if (text === null) rmSync(path.join(dir, rel));
    else write(rel, text);
  }
  git("add", "-A");
  git("commit", "-q", "-m", branch);
  const head = git("rev-parse", "HEAD");
  // refs/pull/N/merge: main merged with the pull request head.
  git("checkout", "-q", "--detach", "main");
  git("merge", "-q", "--no-ff", "-m", "merge", branch);

  const out = path.join(tmp, "github-output");
  writeFileSync(out, "");
  const env = { HEAD_REF: branch, SHA: shaOverride ?? head, GITHUB_OUTPUT: out };
  let got = "merge";
  let log = "";
  const r1 = bash(RULE1, env);
  const concern = /concern=(.*)/.exec(readFileSync(out, "utf8"))?.[1] ?? "";
  log += r1.stdout + r1.stderr;
  const r1k = bash(RULE1_KNOWN, { ...env, CONCERN: concern });
  log += r1k.stdout + r1k.stderr;
  if (r1.status !== 0 || r1k.status !== 0) got = "rule1";
  else {
    const r2 = bash(RULE2, { ...env, CONCERN: concern });
    log += r2.stdout + r2.stderr;
    if (r2.status !== 0) got = "rule2";
    else {
      const r4 = spawnSync("node", [path.join(root, "scripts/check-shop-agent-diff.mjs"), concern], { cwd: dir, encoding: "utf8" });
      log += r4.stdout + r4.stderr;
      if (r4.status !== 0) got = "rule4";
    }
  }
  git("checkout", "-q", "main");
  if (got !== want) {
    failed++;
    console.error(`FAIL ${branch} ${Object.keys(changes).join(" ")}: expected ${want}, stopped at ${got}\n${log}`);
  } else console.log(`ok   ${branch.padEnd(28)} ${Object.keys(changes).join(" + ").padEnd(60)} -> ${want === "merge" ? "rules 1, 2 and 4 pass" : `stops at ${want}`} (concern=${concern})`);
}
rmSync(tmp, { recursive: true, force: true });
if (failed) process.exit(1);
console.log(`${cases.length} workflow rule cases passed`);
