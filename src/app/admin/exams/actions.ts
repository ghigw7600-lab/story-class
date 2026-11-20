"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, logEvent } from "@/lib/db";
import { requireOwner } from "@/lib/session";
import { EXAM_COLS, plan, postExamMsg, type ExamEvent } from "@/lib/exams";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const date = (f: FormData, k: string) => (/^\d{4}-\d{2}-\d{2}$/.test(str(f, k)) ? str(f, k) : null);
const back = (q: string) => { revalidatePath("/admin/exams"); redirect(`/admin/exams?${q}`); };

export async function saveExam(f: FormData) {
  const me = await requireOwner();
  const row = {
    name: str(f, "name"), place: str(f, "place") || null, exam_date: date(f, "exam_date"),
    reg_start: date(f, "reg_start"), reg_end: date(f, "reg_end"), result_date: date(f, "result_date"), link: str(f, "link") || null,
  };
  if (!row.name || !row.exam_date) back("e=" + encodeURIComponent("이름과 시험일은 꼭 넣어 주세요"));
  const id = Number(str(f, "id"));
  const { error } = id ? await db().from("exam_events").update(row).eq("id", id) : await db().from("exam_events").insert(row);
  if (error) back("e=" + encodeURIComponent("저장 실패 — 0005 SQL을 실행했는지 확인해 주세요"));
  await logEvent(me.tg_id, "exam", row.name, id ? "수정" : "추가");
  back("m=saved");
}

export async function toggleExam(f: FormData) {
  await requireOwner();
  await db().from("exam_events").update({ active: str(f, "active") === "1" }).eq("id", Number(str(f, "id")));
  back("m=saved");
}

// 예정 글 하나를 지금 바로 올리기 (시험·급할 때)
export async function postExamNow(f: FormData) {
  await requireOwner();
  const { data } = await db().from("exam_events").select(EXAM_COLS).eq("id", Number(str(f, "id"))).maybeSingle();
  const m = data ? plan(data as ExamEvent).find((x) => x.trigger === str(f, "trigger")) : null;
  if (!data || !m) back("e=" + encodeURIComponent("글을 찾지 못했어요"));
  const r = await postExamMsg(data as ExamEvent, m!);
  back(r.startsWith("실패") ? `e=${encodeURIComponent(r)}` : "m=posted");
}
