// Types and date rule for data/notice.json. No file access, so a client component can import it (NoticeBand).
export interface Notice {
  code: string;
  text: string;
  /** YYYY-MM-DD, London. */
  starts: string;
  ends: string;
  /** null or one of the site's own routes. */
  link: string | null;
  status: "live" | "ended";
}

export interface NoticeFile {
  updated_at: string;
  notice: Notice | null;
}

export function noticeShownOn(n: Notice | null, day: string): n is Notice {
  return !!n && n.status === "live" && n.starts <= day && day <= n.ends;
}
