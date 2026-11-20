"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, logEvent } from "@/lib/db";
import { requireOwner } from "@/lib/session";
import { CARD_COLS, generateCards, postCard, type Card } from "@/lib/cards";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const back = (q: string) => { revalidatePath("/admin/cards"); redirect(`/admin/cards?${q}`); };

// 화면에서 고친 내용 저장
async function saveEdits(f: FormData) {
  const id = Number(str(f, "id"));
  if (str(f, "kind") === "poll") {
    const options = str(f, "options").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 6);
    await db().from("daily_cards").update({ question: str(f, "question") || null, options }).eq("id", id);
  } else {
    const examples = [0, 1].map((i) => ({ ko: str(f, `ex${i}_ko`), uz: str(f, `ex${i}_uz`) })).filter((e) => e.ko && e.uz);
    await db().from("daily_cards").update({
      expr_ko: str(f, "expr_ko") || null, meaning_uz: str(f, "meaning_uz") || null,
      note_uz: str(f, "note_uz") || null, level: str(f, "level") || null, examples,
    }).eq("id", id);
  }
  return id;
}

export async function saveCard(f: FormData) {
  await requireOwner();
  const id = await saveEdits(f);
  back(`m=saved#c${id}`);
}

export async function approveCard(f: FormData) {
  const me = await requireOwner();
  const id = await saveEdits(f);
  await db().from("daily_cards").update({ status: "approved", decided_by: me.tg_id }).eq("id", id).in("status", ["draft", "approved"]);
  await logEvent(me.tg_id, "card", String(id), "승인");
  back("m=approved");
}

export async function rejectCard(f: FormData) {
  const me = await requireOwner();
  const id = Number(str(f, "id"));
  await db().from("daily_cards").update({ status: "rejected", decided_by: me.tg_id }).eq("id", id).in("status", ["draft", "approved"]);
  await logEvent(me.tg_id, "card", String(id), "버림");
  back("m=rejected");
}

export async function postCardNow(f: FormData) {
  const me = await requireOwner();
  const id = await saveEdits(f);
  const { data } = await db().from("daily_cards").select(CARD_COLS).eq("id", id).maybeSingle();
  if (!data || data.status === "posted") back("m=gone");
  const r = await postCard(data as Card);
  await logEvent(me.tg_id, "card", String(id), r.ok ? "지금 올림" : `실패: ${r.error}`);
  back(r.ok ? "m=posted" : `e=${encodeURIComponent(r.error ?? "")}`);
}

export async function generate(f: FormData) {
  await requireOwner();
  const kind = str(f, "kind") === "poll" ? "poll" : "expression";
  const r = await generateCards(kind, kind === "poll" ? 4 : 7, str(f, "hint").slice(0, 300));
  back(r.error ? `e=${encodeURIComponent(r.error)}` : `m=generated&n=${r.added}`);
}

// 직접 추가 (API 키 없이도)
export async function addCard(f: FormData) {
  const me = await requireOwner();
  const kind = str(f, "kind") === "poll" ? "poll" : "expression";
  const row = kind === "poll"
    ? { kind, question: str(f, "question"), options: str(f, "options").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 6) }
    : { kind, expr_ko: str(f, "expr_ko"), meaning_uz: str(f, "meaning_uz"), meaning_ko: str(f, "meaning_ko") || null, note_uz: str(f, "note_uz") || null,
        level: str(f, "level") || "TOPIK II", examples: [0, 1].map((i) => ({ ko: str(f, `ex${i}_ko`), uz: str(f, `ex${i}_uz`) })).filter((e) => e.ko && e.uz) };
  if (kind === "poll" ? !row.question || (row.options as string[]).length < 2 : !(row as { expr_ko: string }).expr_ko || !(row as { meaning_uz: string }).meaning_uz)
    back("e=" + encodeURIComponent(kind === "poll" ? "질문과 보기 2개 이상을 넣어 주세요" : "표현과 우즈벡어 뜻은 꼭 넣어 주세요"));
  const { error } = await db().from("daily_cards").insert(row);
  if (error) back("e=" + encodeURIComponent("저장 실패 — 0004 SQL을 실행했는지 확인해 주세요"));
  await logEvent(me.tg_id, "card", kind, "직접 추가");
  back("m=added");
}

// 초안 모두 승인 (종류별)
export async function approveAll(f: FormData) {
  const me = await requireOwner();
  const kind = str(f, "kind") === "poll" ? "poll" : "expression";
  await db().from("daily_cards").update({ status: "approved", decided_by: me.tg_id }).eq("kind", kind).eq("status", "draft");
  await logEvent(me.tg_id, "card", kind, "모두 승인");
  back("m=approved");
}
