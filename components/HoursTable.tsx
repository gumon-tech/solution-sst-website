import { closuresForBuild } from "@/lib/closures-data";
import { closureLabel } from "@/lib/hours-text";
import { DAYS, HOURS } from "@/lib/site";

/** Seven rows, Monday first, rendered from HOURS. */
export function HoursTable({ className = "" }: { className?: string }) {
  return (
    <table className={`w-full border-collapse text-left ${className}`}>
      <caption className="sr-only">Opening hours</caption>
      <tbody>
        {DAYS.map((d) => {
          const h = HOURS[d];
          return (
            <tr key={d} className="border-b border-stone last:border-0">
              <th scope="row" className="py-2.5 pr-4 font-semibold text-ink">
                {d}
              </th>
              <td className="py-2.5 text-ink">{h ? `${h.opens}–${h.closes}` : "Closed"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Upcoming closures and changed hours under the table on /visit/ (data/closures.json). Nothing when there are none. */
export function ClosuresList() {
  const list = closuresForBuild();
  if (list.length === 0) return null;
  return (
    <div id="closures" className="mt-5 rounded-r-md bg-plum-tint p-4">
      <h3 className="eyebrow">Upcoming changes</h3>
      <ul className="mt-2 space-y-1.5 text-ink">
        {list.map((c) => (
          <li key={c.code} data-closure-row={c.code}>
            <span className="font-semibold">{c.label}:</span> {closureLabel(c)}
          </li>
        ))}
      </ul>
    </div>
  );
}
