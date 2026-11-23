import { getMe } from "@/lib/session";
import { renderSchedule, scheduleEvents } from "@/lib/schedule";

// 대표 화면 미리보기: /admin/exams/card?year=2027
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const me = await getMe();
  if (!me || me.role !== "owner") return new Response("대표만 볼 수 있어요", { status: 401 });
  const year = Number(new URL(req.url).searchParams.get("year")) || new Date().getFullYear() + 1;
  const events = await scheduleEvents(year);
  if (!events.length) return new Response(`${year}년 시험이 없어요`, { status: 404 });
  try {
    return new Response(await renderSchedule(year, events), { headers: { "content-type": "image/png", "cache-control": "no-store" } });
  } catch (e) { return new Response(`그림 실패: ${String(e)}`, { status: 500 }); }
}
