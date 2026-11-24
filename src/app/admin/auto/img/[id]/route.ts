import { getMe } from "@/lib/session";
import { db } from "@/lib/db";
import { renderWriting } from "@/lib/autopilot";

// 쓰기 연습 그림 미리보기 (대표만)
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getMe();
  if (!me || me.role !== "owner") return new Response("대표만 볼 수 있어요", { status: 401 });
  const { id } = await params;
  const { data } = await db().from("daily_cards").select("kind,tag,body_ko").eq("id", Number(id)).maybeSingle();
  if (!data || data.kind !== "writing") return new Response("없음", { status: 404 });
  try {
    return new Response(await renderWriting(data), { headers: { "content-type": "image/png", "cache-control": "no-store" } });
  } catch (e) {
    return new Response(`그림 실패: ${String(e)}`, { status: 500 });
  }
}
