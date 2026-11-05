// Self-test for scripts/validate-hours.mjs. Run: node scripts/test-hours.mjs
import { runCases } from "./lib/run-cases.mjs";

const open = { opens: "11:00", closes: "19:00" };
const week = (o = {}) => ({ Monday: null, Tuesday: open, Wednesday: open, Thursday: open, Friday: open, Saturday: open, Sunday: open, ...o });
const file = (hours = week(), extra = {}) => ({ updated_at: "2026-11-06T09:00:00Z", hours, ...extra });
runCases("validate-hours.mjs", [
  ["current hours", file(), true],
  ["Monday opened", file(week({ Monday: open })), true],
  ["different hours on Sunday", file(week({ Sunday: { opens: "12:00", closes: "17:30" } })), true],
  ["missing day", file({ ...week(), Sunday: undefined }), false],
  ["unknown day", file({ ...week(), Funday: open }), false],
  ["unknown file key", file(week(), { note: "x" }), false],
  ["bad updated_at", { updated_at: "2026-11-06", hours: week() }, false],
  ["opens after closes", file(week({ Friday: { opens: "19:00", closes: "11:00" } })), false],
  ["opens equals closes", file(week({ Friday: { opens: "11:00", closes: "11:00" } })), false],
  ["odd minutes", file(week({ Friday: { opens: "11:10", closes: "19:00" } })), false],
  ["too early", file(week({ Friday: { opens: "05:45", closes: "19:00" } })), false],
  ["too late", file(week({ Friday: { opens: "11:00", closes: "23:15" } })), false],
  ["24:00", file(week({ Friday: { opens: "11:00", closes: "24:00" } })), false],
  ["extra key in a day", file(week({ Friday: { ...open, note: "x" } })), false],
  ["day as string", file(week({ Friday: "11:00-19:00" })), false],
  ["all closed", file(week({ Tuesday: null, Wednesday: null, Thursday: null, Friday: null, Saturday: null, Sunday: null })), false],
  ["not an object", [], false],
]);
