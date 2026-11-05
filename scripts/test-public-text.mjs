// Tests for scripts/lib/public-text.mjs and its JSON export, and for the diff rules of shop-agent pull requests.
// Run: node scripts/test-public-text.mjs
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkPublicText, loadFacts } from "./lib/public-text.mjs";
import { checkDiff } from "./lib/shop-agent-diff.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
let failed = 0;
const t = (name, ok, detail = "") => {
  if (ok) console.log(`ok   ${name}`);
  else {
    failed++;
    console.error(`FAIL ${name} ${detail}`);
  }
};

// The exported JSON is current.
const exp = spawnSync("node", [path.join(here, "lib/export-public-text.mjs"), "--check"], { encoding: "utf8" });
t("public-text.json is current", exp.status === 0, exp.stderr);

const facts = loadFacts();
const bad = (text, opts) => checkPublicText(text, facts, opts).length > 0;
t("plain text passes", !bad("Closed from 24 to 26 December."));
t("review word", bad("Read our reviews"));
t("rated", bad("Top rated in Greenwich"));
t("5 star", bad("A 5 star welcome"));
t("star symbol", bad("Great ★★★"));
t("testimonial", bad("A testimonial from a client"));
t("Trustpilot", bad("See us on Trustpilot"));
t("Google reviews", bad("Our Google reviews"));
t("starts is not stars", !bad("Offer starts Monday"));
t("emoji", bad("Open \u{1F389}"));
t("Thai", bad("เปิด"));
t("link", bad("see www.example.com"));
t("phone", bad("Call 020 7946 0958"));
t("old number", bad("07497 493585"));
t("health", bad("Relieves pain"));
t("therapist blocked in general text", bad("Our therapist is in"));
t("therapist allowed in alt", !bad("A therapist pressing along a client's back", { allowTherapist: true }));
t("no money mode", bad("Only £5 off", { money: "none" }));
t("discount ok", !bad("Take £5 off"));
t("invented price", bad("Thai massage £29 today"));

// Diff rules.
const promo = (o = {}) => ({ code: "P-AAAA", title: "T", detail: "D", status: "live", ends: "2026-11-30", ends_label: "Monday 30 November 2026", ...o });
const P = (...l) => ({ promotions: l });
t("diff: status and end date may change", checkDiff("promotions", P(promo()), P(promo({ status: "ended", ends: "2026-11-20", ends_label: "x" }))).length === 0);
t("diff: new promotion appended", checkDiff("promotions", P(promo()), P(promo(), promo({ code: "P-BBBB" }))).length === 0);
t("diff: promotion title edit rejected", checkDiff("promotions", P(promo()), P(promo({ title: "Other" }))).length === 1);
t("diff: promotion detail edit rejected", checkDiff("promotions", P(promo()), P(promo({ detail: "Other" }))).length === 1);
t("diff: promotion points edit rejected", checkDiff("promotions", P(promo({ points: ["a"] })), P(promo({ points: ["b"] }))).length === 1);
t("diff: promotion removed", checkDiff("promotions", P(promo(), promo({ code: "P-BBBB" })), P(promo())).length >= 1);
t("diff: promotion inserted before old one", checkDiff("promotions", P(promo()), P(promo({ code: "P-BBBB" }), promo())).length >= 1);
const clo = (o = {}) => ({ code: "C-AAAA", label: "Christmas", from: "2026-12-24", to: "2026-12-26", hours: null, status: "live", ...o });
const C = (...l) => ({ closures: l });
t("diff: closure to and status may change", checkDiff("closures", C(clo()), C(clo({ to: "2026-12-27", status: "withdrawn" }))).length === 0);
t("diff: closure label edit rejected", checkDiff("closures", C(clo()), C(clo({ label: "Xmas" }))).length === 1);
t("diff: closure from edit rejected", checkDiff("closures", C(clo()), C(clo({ from: "2026-12-23" }))).length === 1);
t("diff: closure hours edit rejected", checkDiff("closures", C(clo()), C(clo({ hours: { opens: "12:00", closes: "15:00" } }))).length === 1);
t("diff: closure removed", checkDiff("closures", C(clo()), C()).length >= 1);
const faq = (o = {}) => ({ code: "Q-AAAA", question: "Is there parking?", answer: "No.", status: "live", ...o });
const Q = (...l) => ({ questions: l });
t("diff: faq status may change", checkDiff("faq-extra", Q(faq()), Q(faq({ status: "hidden" }))).length === 0);
t("diff: faq answer edit rejected", checkDiff("faq-extra", Q(faq()), Q(faq({ answer: "Yes." }))).length === 1);
t("diff: faq question edit rejected", checkDiff("faq-extra", Q(faq()), Q(faq({ question: "Other?" }))).length === 1);
t("diff: faq removed", checkDiff("faq-extra", Q(faq()), Q()).length >= 1);
const img = (o = {}) => ({ key: "sp-aaa", alt: "A photo of a room", status: "live", ...o });
const I = (...l) => ({ images: l, slots: {} });
t("diff: image retire", checkDiff("photos", I(img()), I(img({ status: "retired" }))).length === 0);
t("diff: image alt edit rejected", checkDiff("photos", I(img()), I(img({ alt: "Other photo of a room" }))).length === 1);
t("diff: image removed", checkDiff("photos", I(img()), I()).length >= 1);
t("diff: hours free", checkDiff("hours", { hours: {} }, { hours: { x: 1 } }).length === 0);
t("diff: notice free", checkDiff("notice", { notice: null }, { notice: { code: "N-A" } }).length === 0);
t("diff: unknown concern", checkDiff("services", {}, {}).length === 1);

// The CLI against a real two-parent history is exercised by the workflow; here one throw-away repo.
{
  const dir = mkdtempSync(path.join(os.tmpdir(), "diff-"));
  const git = (...a) => spawnSync("git", a, { cwd: dir, encoding: "utf8" });
  git("init", "-q", "-b", "main");
  git("config", "user.email", "t@example.com");
  git("config", "user.name", "t");
  mkdirSync(path.join(dir, "data"));
  const write = (o) => writeFileSync(path.join(dir, "data/closures.json"), JSON.stringify(o));
  write(C(clo()));
  git("add", ".");
  git("commit", "-q", "-m", "a");
  write(C(clo({ label: "Edited" })));
  git("commit", "-qam", "b");
  git("checkout", "-q", "-b", "side", "HEAD~1");
  git("commit", "-q", "--allow-empty", "-m", "c");
  git("merge", "-q", "--no-ff", "-m", "m", "main");
  const r = spawnSync("node", [path.join(here, "check-shop-agent-diff.mjs"), "closures"], { cwd: dir, encoding: "utf8" });
  t("cli rejects a label edit between HEAD^1 and HEAD", r.status === 1 && /label/.test(r.stderr), r.stderr);
  const r2 = spawnSync("node", [path.join(here, "check-shop-agent-diff.mjs"), "nope"], { cwd: dir, encoding: "utf8" });
  t("cli rejects unknown concern", r2.status === 2);
}

if (failed) process.exit(1);
console.log("public-text and diff tests passed");
