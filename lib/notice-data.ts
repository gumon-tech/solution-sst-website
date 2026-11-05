import file from "@/data/notice.json";
import { noticeShownOn, type Notice, type NoticeFile } from "@/lib/notice";
import { londonDay } from "@/lib/promotions";

/** The notice to write into every page now, or null. The browser also hides it once its last day has passed (NoticeBand). */
export function noticeForBuild(): { notice: Notice | null; buildDay: string } {
  const buildDay = londonDay();
  const n = (file as NoticeFile).notice;
  return { notice: noticeShownOn(n, buildDay) ? n : null, buildDay };
}
