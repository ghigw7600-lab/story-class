"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, logEvent } from "@/lib/db";
import { requireOwner } from "@/lib/session";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const CATS = ["tests", "writing", "words", "guide"];
const back = (q: string) => { revalidatePath("/admin/library"); redirect(`/admin/library?${q}`); };

export async function saveItem(f: FormData) {
  await requireOwner();
  const cat = str(f, "category");
  await db().from("library_items").update({
    title: str(f, "title").slice(0, 120) || "Material", description: str(f, "description").slice(0, 600) || null,
    category: CATS.includes(cat) ? cat : "guide", sort: Number(str(f, "sort")) || 0,
  }).eq("id", Number(str(f, "id")));
  back("m=saved");
}

export async function toggleItem(f: FormData) {
  const me = await requireOwner();
  await db().from("library_items").update({ active: str(f, "active") === "1" }).eq("id", Number(str(f, "id")));
  await logEvent(me.tg_id, "library", str(f, "id"), str(f, "active") === "1" ? "보이기" : "숨기기");
  back("m=saved");
}

export async function addLink(f: FormData) {
  const me = await requireOwner();
  const url = str(f, "url"), title = str(f, "title"), cat = str(f, "category");
  if (!/^https?:\/\/\S+$/i.test(url) || !title) back("e=" + encodeURIComponent("제목과 https:// 링크를 넣어 주세요"));
  const { error } = await db().from("library_items").insert({ category: CATS.includes(cat) ? cat : "guide", title: title.slice(0, 120), description: str(f, "description") || null, file_type: "link", url });
  if (error) back("e=" + encodeURIComponent("저장 실패 — 0007 SQL을 실행했는지 확인해 주세요"));
  await logEvent(me.tg_id, "library", "link", title);
  back("m=added");
}
