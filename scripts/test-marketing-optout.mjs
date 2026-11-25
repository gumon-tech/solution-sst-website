// Tests the pure opt-out functions of lib/whatsapp.ts (insertOptOut, removeOptOut, OPT_OUT_TEXT).
// Run: node scripts/test-marketing-optout.mjs
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
// lib/whatsapp.ts imports SITE only for the phone number: stub that import.
const src = readFileSync(path.join(root, "lib/whatsapp.ts"), "utf8").replace(/^import \{ SITE \} from "@\/lib\/site";/m, 'const SITE = { whatsappNumber: "0", phoneE164: "+0" };');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const dir = mkdtempSync(path.join(os.tmpdir(), "optout-"));
writeFileSync(path.join(dir, "whatsapp.mjs"), js);
const { insertOptOut, removeOptOut, OPT_OUT_TEXT, TAG_AT_END } = await import(pathToFileURL(path.join(dir, "whatsapp.mjs")).href);

rmSync(dir, { recursive: true, force: true });
let failed = 0;
const eq = (name, got, want) => {
  if (got === want) console.log(`ok   ${name}`);
  else {
    failed++;
    console.error(`FAIL ${name}\n  got:  ${JSON.stringify(got)}\n  want: ${JSON.stringify(want)}`);
  }
};

const msg = "Hi Sri Siam Thai Therapy & Wellness, I'd like to book a Thai Massage (1 hour) please.";
for (const tag of ["web-T", "web-AD", "web-AD-ABCDEFGH", "web-PT"]) {
  const plain = `${msg} [${tag}]`;
  const marked = `${msg} ${OPT_OUT_TEXT} [${tag}]`;
  eq(`insert before [${tag}]`, insertOptOut(plain), marked);
  eq(`insert is idempotent [${tag}]`, insertOptOut(marked), marked);
  eq(`remove restores [${tag}]`, removeOptOut(marked), plain);
  eq(`remove on unmarked is unchanged [${tag}]`, removeOptOut(plain), plain);
  eq(`insert then remove round trip [${tag}]`, removeOptOut(insertOptOut(plain)), plain);
}
eq("text without a tag is unchanged by insert", insertOptOut(msg), msg);
eq("text without a tag is unchanged by remove", removeOptOut(msg), msg);
eq("tag in the middle is not touched", insertOptOut("Hi [web-T] there"), "Hi [web-T] there");
eq("marker format", insertOptOut("A [web-X]"), `A ${OPT_OUT_TEXT} [web-X]`);
eq("the marker text", OPT_OUT_TEXT, "Please don't send me news and offers.");
// TAG_AT_END keeps working on a marked message (AdSource swaps the tag only).
const marked = `${msg} ${OPT_OUT_TEXT} [web-T]`;
eq("TAG_AT_END still finds the tag on a marked message", TAG_AT_END.exec(marked)?.[1], "T");
eq("AdSource swap keeps the marker", marked.replace(TAG_AT_END, " [web-AD]"), `${msg} ${OPT_OUT_TEXT} [web-AD]`);
if (failed) process.exit(1);
console.log("all opt-out cases passed");
