// Self-test for scripts/validate-faq-extra.mjs. Run: node scripts/test-faq-extra.mjs
import { runCases } from "./lib/run-cases.mjs";

const q = (o = {}) => ({ code: "Q-2BX9", question: "Do you have parking nearby?", answer: "There is no parking at the shop. Pay-and-display bays are on Glaisher Street and nearby streets.", status: "live", ...o });
const file = (questions, extra = {}) => ({ updated_at: "2026-11-06T09:00:00Z", questions, ...extra });
runCases("validate-faq-extra.mjs", [
  ["empty", file([]), true],
  ["good question", file([q()]), true],
  ["hidden question", file([q({ status: "hidden" })]), true],
  ["question without ?", file([q({ question: "Do you have parking nearby" })]), false],
  ["question too short", file([q({ question: "Parking?" })]), false],
  ["question too long", file([q({ question: "x".repeat(100) + "?" })]), false],
  ["answer too short", file([q({ answer: "No parking." })]), false],
  ["answer too long", file([q({ answer: "x".repeat(401) })]), false],
  ["repeats a core question", file([q({ question: "What are your opening hours?" })]), false],
  ["repeats another extra", file([q(), q({ code: "Q-2BX8", question: "do you have parking nearby?" })]), false],
  ["duplicate code", file([q(), q({ question: "Is there a step at the door?" })]), false],
  ["more than 8 live", file(Array.from({ length: 9 }, (_, i) => q({ code: `Q-A${i}`, question: `Is there a question number ${"abcdefghij"[i]}?` }))), false],
  ["pregnancy", file([q({ question: "Is it safe during pregnancy?" })]), false],
  ["doctor", file([q({ answer: "Please ask your doctor before booking, and tell us on WhatsApp." })]), false],
  ["deposit", file([q({ answer: "The deposit is taken by payment link when you book on WhatsApp." })]), false],
  ["cancel", file([q({ answer: "You can cancel on WhatsApp when you need to change a booking." })]), false],
  ["voucher", file([q({ answer: "Gift vouchers can be bought on the gift vouchers page of the site." })]), false],
  ["price word", file([q({ answer: "The price list is on the treatments page with every length shown." })]), false],
  ["pound sign", file([q({ answer: "Parking is about £3 an hour in the bays on Glaisher Street." })]), false],
  ["health wording", file([q({ answer: "A massage helps with pain and stress after a long working week." })]), false],
  ["placeholder", file([q({ answer: "We are open {{hours_sentence}} and we work by appointment only." })]), false],
  ["link", file([q({ answer: "Find the bays at www.example.com/parking near the Glaisher Street shop." })]), false],
  ["phone number", file([q({ answer: "Ring 020 7946 0958 if you cannot find the shop on Glaisher Street." })]), false],
  ["review wording", file([q({ answer: "Read what people say in our reviews before you come to Greenwich." })]), false],
  ["unknown status", file([q({ status: "ended" })]), false],
  ["unknown key", file([q({ extra: 1 })]), false],
  ["unknown file key", file([], { note: "x" }), false],
]);
