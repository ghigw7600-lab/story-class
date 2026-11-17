import { NextResponse } from "next/server";
import { getMe } from "@/lib/session";
import { db, logEvent } from "@/lib/db";
import { attendState } from "@/lib/time";

const RANK = { present: 3, late: 2, outside: 1 } as const;

// [수업 들어가기] → 입금 확인된 학생인지 확인 → 출석 기록 → Zoom으로
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const me = await getMe();
  if (!me) return NextResponse.redirect(new URL("/", url));
  const { data: c } = await db().from("classes").select("id,name,days,start_time,minutes,tz,zoom_url,teacher_tg").eq("id", id).maybeSingle();
  if (!c) return NextResponse.redirect(new URL("/home", url));
  const staff = me.role === "owner" || c.teacher_tg === me.tg_id;
  if (!staff) {
    const { data: e } = await db().from("enrollments").select("status").eq("class_id", id).eq("tg_id", me.tg_id).maybeSingle();
    if (e?.status !== "active") return NextResponse.redirect(new URL("/home?m=not_active", url));
    const { date, state } = attendState(c);
    const now = new Date().toISOString();
    const { data: old } = await db().from("attendance").select("id,state,joins").eq("class_id", id).eq("tg_id", me.tg_id).eq("lesson_date", date).maybeSingle();
    if (old) {
      // 다시 들어와도 처음 기록이 더 좋으면 그대로 (출석 > 지각 > 수업 외)
      const best = RANK[state] > RANK[old.state as keyof typeof RANK] ? state : old.state;
      await db().from("attendance").update({ last_at: now, joins: old.joins + 1, state: best }).eq("id", old.id);
    } else {
      await db().from("attendance").insert({ class_id: id, tg_id: me.tg_id, lesson_date: date, state });
      await logEvent(me.tg_id, "join", id, `${c.name} · ${date} · ${state}`);
    }
  }
  if (!c.zoom_url) return NextResponse.redirect(new URL(staff ? `/admin/class/${id}?m=no_zoom` : "/home?m=no_zoom", url));
  return NextResponse.redirect(c.zoom_url);
}
