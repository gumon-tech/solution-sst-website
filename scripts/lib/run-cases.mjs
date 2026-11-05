// Tiny test runner for the validate-*.mjs scripts: each case is [name, fileContent, shouldPass]; the validator is run on a temp file.
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scripts = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export function runCases(validator, cases, extraArgs = () => []) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "cases-"));
  let failed = 0;
  cases.forEach(([name, body, ok], i) => {
    const f = path.join(dir, `${i}.json`);
    writeFileSync(f, typeof body === "string" ? body : JSON.stringify(body));
    const r = spawnSync("node", [path.join(scripts, validator), f, ...extraArgs(dir)], { encoding: "utf8" });
    if ((r.status === 0) !== ok) {
      failed++;
      console.error(`FAIL ${name}: expected ${ok ? "pass" : "fail"}, got ${r.status === 0 ? "pass" : "fail"}\n${r.stderr}`);
    } else console.log(`ok   ${name}`);
  });
  if (failed) process.exit(1);
  console.log(`${cases.length} cases passed`);
}
