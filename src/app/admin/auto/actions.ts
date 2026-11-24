"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, logEvent } from "@/lib/db";
import { requireOwner } from "@/lib/session";
import { setSetting } from "@/lib/settings";
import { CARD_COLS2, type Card } from "@/lib/cards";
import { postWriting, postTip, postQuestion, postLibraryDrop, postRecruit, postConsult } from "@/lib/autopilot";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const back = (q: string) => { revalidatePath("/admin/auto"); redirect(`/admin/auto?${q}`); };

export async function toggleAuto(f: FormData) {
  const me = await requireOwner();
  const on = str(f, "on") === "on";
  await setSetting("auto_approve", on ? "on" : "off");
  await logEvent(me.tg_id, "auto", "auto_approve", on ? "켬" : "끔");
  back(`m=${on ? "on" : "off"}`);
}

export async function rejectItem(f: FormData) {
  const me = await requireOwner();
  const id = Number(str(f, "id"));
  await db().from("daily_cards").update({ status: "rejected", decided_by: me.tg_id }).eq("id", id).in("status", ["draft", "approved"]);
  back("m=rejected");
}

export async function saveItem(f: FormData) {
  await requireOwner();
  const id = Number(str(f, "id"));
  const patch: Record<string, string | null> = {};
  for (const k of ["question", "body_ko", "body_uz", "answer"]) if (f.has(k)) patch[k] = str(f, k) || null;
  await db().from("daily_cards").update(patch).eq("id", id).in("status", ["draft", "approved"]);
  back(`m=saved#i${id}`);
}

// 지금 바로 올리기 (시험용·확인용)
export async function postNow(f: FormData) {
  const me = await requireOwner();
  const what = str(f, "what");
  let r: string;
  if (what === "library") r = await postLibraryDrop(true);
  else if (what === "recruit") r = await postRecruit(true);
  else if (what === "consult") r = await postConsult(true);
  else {
    const { data } = await db().from("daily_cards").select(CARD_COLS2).eq("id", Number(str(f, "id"))).in("status", ["draft", "approved"]).maybeSingle();
    if (!data) back("e=" + encodeURIComponent("이미 올라갔거나 없는 글이에요"));
    const c = data as unknown as Card;
    r = c.kind === "writing" ? await postWriting(c) : c.kind === "tip" ? await postTip(c) : await postQuestion(c);
  }
  await logEvent(me.tg_id, "auto", what || "item", `지금 올림: ${r}`);
  back(/실패|없어요|없는|필요/.test(r) ? `e=${encodeURIComponent(r)}` : `m=posted&r=${encodeURIComponent(r)}`);
}
