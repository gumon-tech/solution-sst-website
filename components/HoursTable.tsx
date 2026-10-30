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
