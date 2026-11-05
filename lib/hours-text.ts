// Pure text rules for opening hours and closures: no imports, no file access, so a client component may use them and
// scripts/test-hours-text.mjs can compile and pin them. The exact rules, with examples, are in README ("The sentences").
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export type Day = (typeof DAYS)[number];
export interface DayHours {
  opens: string;
  closes: string;
}
export type WeekHours = Record<Day, DayHours | null>;

export interface Closure {
  code: string;
  label: string;
  /** YYYY-MM-DD, London, first day affected. */
  from: string;
  /** YYYY-MM-DD, London, last day affected (same as from for one day). */
  to: string;
  /** null: closed all day. Otherwise the changed opening hours for every day from..to. */
  hours: DayHours | null;
  status: "live" | "withdrawn";
}

const same = (a: DayHours, b: DayHours) => a.opens === b.opens && a.closes === b.closes;
const range = (h: DayHours) => `${h.opens} to ${h.closes}`;

/** "Tuesday and Wednesday", "Tuesday, Wednesday and Friday". */
function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Maximal runs of consecutive open days with identical hours, Monday first. */
function runs(w: WeekHours): { days: Day[]; hours: DayHours }[] {
  const out: { days: Day[]; hours: DayHours }[] = [];
  for (const d of DAYS) {
    const h = w[d];
    if (!h) continue;
    const last = out[out.length - 1];
    if (last && DAYS.indexOf(last.days[last.days.length - 1]) === DAYS.indexOf(d) - 1 && same(last.hours, h)) last.days.push(d);
    else out.push({ days: [d], hours: h });
  }
  return out;
}

/**
 * "Open Tuesday to Sunday, 11:00 to 19:00. Closed on Mondays."
 * One set of hours: "Open <first open day> to <last open day>, <opens> to <closes>." Several: groups of days with the same hours,
 * "Open Tuesday to Friday, 11:00 to 19:00; Saturday and Sunday, 12:00 to 17:00." Then every closed day: " Closed on Mondays and Thursdays."
 */
export function hoursText(w: WeekHours): string {
  const open = DAYS.filter((d) => w[d]);
  const closed = DAYS.filter((d) => !w[d]);
  const closedText = closed.length ? ` Closed on ${list(closed.map((d) => `${d}s`))}.` : "";
  if (open.length === 0) return `Closed every day.`;
  const first = w[open[0]]!;
  if (open.every((d) => same(w[d]!, first))) {
    const days = open.length > 1 ? `${open[0]} to ${open[open.length - 1]}` : open[0];
    return `Open ${days}, ${range(first)}.${closedText}`;
  }
  const groups: { days: Day[]; hours: DayHours }[] = [];
  for (const d of open) {
    const g = groups.find((x) => same(x.hours, w[d]!));
    if (g) g.days.push(d);
    else groups.push({ days: [d], hours: w[d]! });
  }
  const parts = groups.map((g) => {
    const consecutive = g.days.every((d, i) => i === 0 || DAYS.indexOf(d) === DAYS.indexOf(g.days[i - 1]) + 1);
    const days = consecutive && g.days.length > 2 ? `${g.days[0]} to ${g.days[g.days.length - 1]}` : list(g.days);
    return `${days}, ${range(g.hours)}`;
  });
  return `Open ${parts.join("; ")}.${closedText}`;
}

/** Footer lines: ["Mon Closed", "Tue–Sun 11:00–19:00"]. Closed days first, then one line per run of days with the same hours. */
export function hoursCompactLines(w: WeekHours): string[] {
  const short = (d: string) => d.slice(0, 3);
  const closed = DAYS.filter((d) => !w[d]);
  const parts: string[] = [];
  if (closed.length) parts.push(`${closed.map(short).join(", ")} Closed`);
  for (const r of runs(w)) {
    const days = r.days.length > 1 ? `${short(r.days[0])}–${short(r.days[r.days.length - 1])}` : short(r.days[0]);
    parts.push(`${days} ${r.hours.opens}–${r.hours.closes}`);
  }
  return parts;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayParts = (s: string) => {
  const d = new Date(`${s}T00:00:00Z`);
  return { w: WEEKDAYS[d.getUTCDay()], d: d.getUTCDate(), m: MONTHS[d.getUTCMonth()], y: d.getUTCFullYear() };
};

/** "Friday 1 January", "Thursday 24 to Saturday 26 December", "Thursday 24 December to Monday 4 January" (no year). */
function span(from: string, to: string): string {
  const a = dayParts(from);
  if (from === to) return `${a.w} ${a.d} ${a.m}`;
  const b = dayParts(to);
  if (a.m === b.m && a.y === b.y) return `${a.w} ${a.d} to ${b.w} ${b.d} ${b.m}`;
  return `${a.w} ${a.d} ${a.m} to ${b.w} ${b.d} ${b.m}`;
}

/**
 * The date phrase of one closure (the label is shown next to it, not inside it):
 *   closed, one day            "Closed Friday 25 December"
 *   closed, range              "Closed Thursday 24 to Saturday 26 December" / "Closed Thursday 24 December to Monday 4 January"
 *   changed hours, one day     "Open 13:00 to 18:00 on Friday 1 January"
 *   changed hours, range       "Open 13:00 to 18:00 from Monday 28 to Wednesday 30 December"
 */
export function closureLabel(c: Pick<Closure, "from" | "to" | "hours">): string {
  if (!c.hours) return `Closed ${span(c.from, c.to)}`;
  return `Open ${range(c.hours)} ${c.from === c.to ? "on" : "from"} ${span(c.from, c.to)}`;
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Live closures that have not finished on `day` and start within `horizonDays` of it (default 60), earliest first. */
export function upcomingClosures<T extends Closure>(list: T[], day: string, horizonDays = 60): T[] {
  const limit = addDays(day, horizonDays);
  return list
    .filter((c) => c.status === "live" && c.to >= day && c.from <= limit)
    .sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : a.to < b.to ? -1 : a.to > b.to ? 1 : 0));
}

/** The text of the FAQ placeholder {{closures_line}}: "" when none, else " Please note: Closed Thursday 24 to Saturday 26 December." (leading space). */
export function closuresLine(list: Pick<Closure, "from" | "to" | "hours">[]): string {
  if (list.length === 0) return "";
  return ` Please note: ${list.map(closureLabel).join("; ")}.`;
}
