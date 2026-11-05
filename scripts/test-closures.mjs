// Self-test for scripts/validate-closures.mjs. Run: node scripts/test-closures.mjs
import { runCases } from "./lib/run-cases.mjs";

const c = (o = {}) => ({ code: "C-XM26", label: "Christmas", from: "2026-12-24", to: "2026-12-26", hours: null, status: "live", ...o });
const file = (closures, extra = {}) => ({ updated_at: "2026-11-06T09:00:00Z", closures, ...extra });
runCases("validate-closures.mjs", [
  ["empty", file([]), true],
  ["closed range", file([c()]), true],
  ["24 December to 4 January", file([c({ to: "2027-01-04" })]), true],
  ["changed hours one day", file([c({ code: "C-NY27", label: "New Year", from: "2027-01-01", to: "2027-01-01", hours: { opens: "13:00", closes: "18:00" } })]), true],
  ["past entry kept as history", file([c({ from: "2020-01-01", to: "2020-01-02" })]), true],
  ["withdrawn overlaps live is fine", file([c(), c({ code: "C-OLD", status: "withdrawn" })]), true],
  ["overlapping live", file([c(), c({ code: "C-TWO", from: "2026-12-26", to: "2026-12-28" })]), false],
  ["duplicate code", file([c(), c({ from: "2027-02-01", to: "2027-02-01" })]), false],
  ["bad code", file([c({ code: "xm26" })]), false],
  ["from after to", file([c({ from: "2026-12-27" })]), false],
  ["longer than 31 days", file([c({ from: "2026-12-01", to: "2027-01-05" })]), false],
  ["bad date", file([c({ to: "2026-12-32" })]), false],
  ["empty label", file([c({ label: "" })]), false],
  ["label over 40", file([c({ label: "x".repeat(41) })]), false],
  ["label with emoji", file([c({ label: "Christmas \u{1F384}" })]), false],
  ["label with health wording", file([c({ label: "Sick leave and recovery" })]), false],
  ["label with price", file([c({ label: "Closed, £5 off after" })]), false],
  ["hours opens after closes", file([c({ hours: { opens: "18:00", closes: "13:00" } })]), false],
  ["hours odd minutes", file([c({ hours: { opens: "13:07", closes: "18:00" } })]), false],
  ["unknown status", file([c({ status: "ended" })]), false],
  ["unknown key", file([c({ extra: 1 })]), false],
  ["missing key", file([c({ hours: undefined })]), false],
  ["unknown file key", file([], { note: "x" }), false],
  ["more than 60 entries", file(Array.from({ length: 61 }, (_, i) => c({ code: `C-A${i}`, from: "2027-01-01", to: "2027-01-01", status: "withdrawn" }))), false],
]);
