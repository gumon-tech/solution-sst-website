"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { noticeShownOn, type Notice } from "@/lib/notice";
import { londonDay } from "@/lib/promotions";

/**
 * One line under the header on every page, from data/notice.json. `notice` is the one live on the build day; once the page
 * loads the browser drops it if its last day has passed since the build (same rule as PromoCards). Nothing renders when empty.
 */
export function NoticeBand({ notice, buildDay }: { notice: Notice | null; buildDay: string }) {
  const [day, setDay] = useState(buildDay);
  useEffect(() => {
    setDay(londonDay());
  }, []);
  if (!noticeShownOn(notice, day)) return null;
  return (
    <div id="notice" role="status" data-notice={notice.code} className="on-plum bg-plum text-cream">
      <p className="container-x py-2.5 text-center text-sm font-medium">
        {notice.text}
        {notice.link && (
          <>
            {" "}
            <Link href={notice.link} className="link underline">
              Find out more
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
