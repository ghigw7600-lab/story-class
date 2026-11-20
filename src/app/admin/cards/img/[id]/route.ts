import { getMe } from "@/lib/session";
import { db } from "@/lib/db";
import { CARD_COLS, renderExpression, type Card } from "@/lib/cards";

// 대표 화면에서 보는 카드 미리보기 그림
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getMe();
  if (!me || me.role !== "owner") return new Response("대표만 볼 수 있어요", { status: 401 });
  const { id } = await params;
  const { data } = await db().from("daily_cards").select(CARD_COLS).eq("id", Number(id)).maybeSingle();
  if (!data || data.kind !== "expression") return new Response("없음", { status: 404 });
  try {
    const png = await renderExpression(data as Card);
    return new Response(png, { headers: { "content-type": "image/png", "cache-control": "no-store" } });
  } catch (e) {
    return new Response(`그림 실패: ${String(e)}`, { status: 500 });
  }
}
