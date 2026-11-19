"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, logEvent } from "@/lib/db";
import { requireOwner } from "@/lib/session";
import { runDaily } from "@/lib/channel";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function addPost(f: FormData) {
  const me = await requireOwner();
  const options = [0, 1, 2, 3].map((i) => str(f, `opt${i}`)).filter(Boolean);
  const correct = Number(str(f, "correct"));
  const question = str(f, "question");
  if (!question || options.length < 2) redirect("/admin/channel?m=need");
  if (!(correct >= 0 && correct < options.length)) redirect("/admin/channel?m=correct");
  if (question.length > 300 || options.some((o) => o.length > 100) || str(f, "explain_short").length > 200) redirect("/admin/channel?m=long");
  const { error } = await db().from("channel_posts").insert({
    source: str(f, "source") || null, level: str(f, "level") || null, passage: str(f, "passage") || null,
    question, options, correct,
    explain_short: str(f, "explain_short") || null, explain_full: str(f, "explain_full") || null,
    sort: Number(str(f, "sort")) || 0, created_by: me.tg_id,
  });
  if (error) redirect("/admin/channel?m=err");
  await logEvent(me.tg_id, "channel", "add", question.slice(0, 60));
  revalidatePath("/admin/channel");
  redirect("/admin/channel?m=added");
}

export async function skipPost(f: FormData) {
  const me = await requireOwner();
  const id = Number(str(f, "id"));
  await db().from("channel_posts").update({ status: "skipped" }).eq("id", id).eq("status", "queued");
  await logEvent(me.tg_id, "channel", String(id), "안 올림");
  revalidatePath("/admin/channel");
  redirect("/admin/channel?m=skipped");
}

// [지금 올리기] — 시험용. 어제 문제 정답 + 다음 문제를 바로 올림
export async function runNow() {
  const me = await requireOwner();
  const out = await runDaily(true);
  await logEvent(me.tg_id, "channel", "run", out.join(" · "));
  revalidatePath("/admin/channel");
  redirect(`/admin/channel?r=${encodeURIComponent(out.join(" · "))}`);
}
