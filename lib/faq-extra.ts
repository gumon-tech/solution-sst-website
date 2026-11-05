// data/faq-extra.json: extra questions the shop system may add. Core FAQ stays in content/faq.md.
import file from "@/data/faq-extra.json";

export interface FaqExtra {
  code: string;
  question: string;
  answer: string;
  status: "live" | "hidden";
}

export function liveFaqExtra(): FaqExtra[] {
  return (file as { questions: FaqExtra[] }).questions.filter((q) => q.status === "live");
}
