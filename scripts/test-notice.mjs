// Self-test for scripts/validate-notice.mjs. Run: node scripts/test-notice.mjs
import { runCases } from "./lib/run-cases.mjs";

const n = (o = {}) => ({ code: "N-7K2Q", text: "We are closed from 24 to 26 December. Bookings reopen on 27 December.", starts: "2026-12-01", ends: "2026-12-26", link: "/visit/", status: "live", ...o });
const file = (notice, extra = {}) => ({ updated_at: "2026-11-06T09:00:00Z", notice, ...extra });
runCases("validate-notice.mjs", [
  ["no notice", file(null), true],
  ["good notice", file(n()), true],
  ["no link", file(n({ link: null })), true],
  ["ended notice", file(n({ status: "ended" })), true],
  ["expired but live is not a build error", file(n({ starts: "2020-01-01", ends: "2020-01-31" })), true],
  ["notice key missing", { updated_at: "2026-11-06T09:00:00Z" }, false],
  ["text too short", file(n({ text: "Closed soon." })), false],
  ["text too long", file(n({ text: "x".repeat(141) })), false],
  ["two lines", file(n({ text: "We are closed from 24 to 26 December.\nBack on the 27th for everyone." })), false],
  ["star formatting", file(n({ text: "We are *closed* from 24 to 26 December, see you after." })), false],
  ["the word today", file(n({ text: "We are closed today because of a plumbing problem." })), false],
  ["the word now", file(n({ text: "Bookings for the new year are open now on WhatsApp." })), false],
  ["any pound sign", file(n({ text: "Gift vouchers from £10 are on sale until 24 December." })), false],
  ["emoji", file(n({ text: "We are closed from 24 to 26 December \u{1F384} see you soon" })), false],
  ["link in text", file(n({ text: "We are closed 24 to 26 December, see www.example.com for more" })), false],
  ["phone number", file(n({ text: "We are closed 24 to 26 December, ring 020 7946 0958 after" })), false],
  ["health wording", file(n({ text: "We are closed 24 to 26 December so staff can recover fully" })), false],
  ["review wording", file(n({ text: "We are closed 24 to 26 December, thanks for the great reviews" })), false],
  ["starts after ends", file(n({ starts: "2026-12-30" })), false],
  ["over 62 days", file(n({ starts: "2026-11-01", ends: "2027-01-31" })), false],
  ["link not on the site", file(n({ link: "/privacy/" })), false],
  ["external link", file(n({ link: "https://example.com/" })), false],
  ["bad code", file(n({ code: "n-1" })), false],
  ["bad status", file(n({ status: "draft" })), false],
  ["unknown key", file(n({ extra: 1 })), false],
  ["unknown file key", file(null, { note: "x" }), false],
]);
