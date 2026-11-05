// Pins the exact sentences of lib/hours-text.ts (hoursText, hoursCompactLines, closureLabel, closuresLine, upcomingClosures).
// The shop bot reads the same sentence back to the manager, and README ("The sentences") lists these examples: change all together.
// Run: node scripts/test-hours-text.mjs
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const js = ts.transpileModule(readFileSync(path.join(root, "lib/hours-text.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const dir = mkdtempSync(path.join(os.tmpdir(), "hours-text-"));
writeFileSync(path.join(dir, "hours-text.mjs"), js);
const m = await import(pathToFileURL(path.join(dir, "hours-text.mjs")).href);

let failed = 0;
const eq = (name, got, want) => {
  if (got === want) console.log(`ok   ${name}`);
  else {
    failed++;
    console.error(`FAIL ${name}\n  got:  ${JSON.stringify(got)}\n  want: ${JSON.stringify(want)}`);
  }
};
const O = { opens: "11:00", closes: "19:00" };
const week = (o = {}) => ({ Monday: null, Tuesday: O, Wednesday: O, Thursday: O, Friday: O, Saturday: O, Sunday: O, ...o });

// The live file gives today's sentence, unchanged from before the hours moved to data/hours.json.
const live = JSON.parse(readFileSync(path.join(root, "data/hours.json"), "utf8")).hours;
eq("today's sentence", m.hoursText(live), "Open Tuesday to Sunday, 11:00 to 19:00. Closed on Mondays.");
eq("today's footer lines", m.hoursCompactLines(live).join(" | "), "Mon Closed | Tue–Sun 11:00–19:00");

eq("open every day", m.hoursText(week({ Monday: O })), "Open Monday to Sunday, 11:00 to 19:00.");
eq("one open day", m.hoursText(week({ Tuesday: null, Wednesday: null, Thursday: null, Friday: null, Saturday: null })), "Open Sunday, 11:00 to 19:00. Closed on Mondays, Tuesdays, Wednesdays, Thursdays, Fridays and Saturdays.");
eq("two closed days", m.hoursText(week({ Sunday: null })), "Open Tuesday to Saturday, 11:00 to 19:00. Closed on Mondays and Sundays.");
eq("closed day inside the range", m.hoursText(week({ Thursday: null })), "Open Tuesday to Sunday, 11:00 to 19:00. Closed on Mondays and Thursdays.");
eq("different Sunday hours", m.hoursText(week({ Sunday: { opens: "12:00", closes: "17:00" } })), "Open Tuesday to Saturday, 11:00 to 19:00; Sunday, 12:00 to 17:00. Closed on Mondays.");
eq("two groups, three days each", m.hoursText(week({ Monday: { opens: "10:00", closes: "16:00" }, Tuesday: { opens: "10:00", closes: "16:00" }, Wednesday: { opens: "10:00", closes: "16:00" }, Saturday: null, Sunday: null })), "Open Monday to Wednesday, 10:00 to 16:00; Thursday and Friday, 11:00 to 19:00. Closed on Saturdays and Sundays.");
eq("different hours on non-consecutive days", m.hoursText(week({ Monday: { opens: "12:00", closes: "17:00" }, Tuesday: { opens: "12:00", closes: "17:00" }, Wednesday: O, Thursday: { opens: "12:00", closes: "17:00" }, Friday: null, Saturday: null, Sunday: null })), "Open Monday, Tuesday and Thursday, 12:00 to 17:00; Wednesday, 11:00 to 19:00. Closed on Fridays, Saturdays and Sundays.");
eq("footer, closed day inside the range", m.hoursCompactLines(week({ Thursday: null })).join(" | "), "Mon, Thu Closed | Tue–Wed 11:00–19:00 | Fri–Sun 11:00–19:00");
eq("footer, different Sunday", m.hoursCompactLines(week({ Sunday: { opens: "12:00", closes: "17:00" } })).join(" | "), "Mon Closed | Tue–Sat 11:00–19:00 | Sun 12:00–17:00");

const c = (from, to, hours = null) => ({ code: "C-X", label: "x", from, to, hours, status: "live" });
eq("closed one day", m.closureLabel(c("2026-12-25", "2026-12-25")), "Closed Friday 25 December");
eq("closed range, one month", m.closureLabel(c("2026-12-24", "2026-12-26")), "Closed Thursday 24 to Saturday 26 December");
eq("closed range over New Year", m.closureLabel(c("2026-12-24", "2027-01-04")), "Closed Thursday 24 December to Monday 4 January");
eq("changed hours, one day", m.closureLabel(c("2027-01-01", "2027-01-01", { opens: "13:00", closes: "18:00" })), "Open 13:00 to 18:00 on Friday 1 January");
eq("changed hours, range", m.closureLabel(c("2026-12-28", "2026-12-30", { opens: "13:00", closes: "18:00" })), "Open 13:00 to 18:00 from Monday 28 to Wednesday 30 December");
eq("changed hours, range over New Year", m.closureLabel(c("2026-12-31", "2027-01-02", { opens: "13:00", closes: "18:00" })), "Open 13:00 to 18:00 from Thursday 31 December to Saturday 2 January");
eq("no closures: empty line", m.closuresLine([]), "");
eq("one closure line", m.closuresLine([c("2026-12-24", "2027-01-04")]), " Please note: Closed Thursday 24 December to Monday 4 January.");
eq("two closures line", m.closuresLine([c("2026-12-24", "2026-12-26"), c("2027-01-01", "2027-01-01", { opens: "13:00", closes: "18:00" })]), " Please note: Closed Thursday 24 to Saturday 26 December; Open 13:00 to 18:00 on Friday 1 January.");

const list = [c("2026-12-24", "2026-12-26"), { ...c("2026-12-01", "2026-12-02"), code: "C-W", status: "withdrawn" }, { ...c("2026-10-01", "2026-10-02"), code: "C-P" }, { ...c("2027-06-01", "2027-06-02"), code: "C-F" }];
eq("upcoming: live, not over, within 60 days", m.upcomingClosures(list, "2026-11-06").map((x) => x.code).join(), "C-X");
eq("upcoming: a closure on its last day still shows", m.upcomingClosures(list, "2026-12-26").map((x) => x.code).join(), "C-X");
eq("upcoming: gone the day after", m.upcomingClosures(list, "2026-12-27").map((x) => x.code).join(), "");
eq("upcoming: 61 days ahead is not shown yet", m.upcomingClosures([c("2027-01-06", "2027-01-07")], "2026-11-06").length, 0);
eq("upcoming: 60 days ahead is shown", m.upcomingClosures([c("2027-01-05", "2027-01-07")], "2026-11-06").length, 1);

if (failed) process.exit(1);
console.log("hours text tests passed");
