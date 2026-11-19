"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, logEvent } from "@/lib/db";
import { requireOwner } from "@/lib/session";
import { NEWS_COLS, collectNews, draftFromLink, postNews, type NewsItem } from "@/lib/news";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const back = (q: string) => { revalidatePath("/admin/news"); redirect(`/admin/news?${q}`); };

// 고친 우즈벡어·버튼을 저장하면서 상태 바꾸기
async function saveEdits(f: FormData) {
  const id = Number(str(f, "id"));
  const edits = {
    title_uz: str(f, "title_uz").slice(0, 120) || null,
    body_uz: str(f, "body_uz").slice(0, 700) || null,
    cta: str(f, "cta") === "consult" ? "consult" : "class",
  };
  await db().from("news_items").update(edits).eq("id", id);
  return id;
}

export async function approveNews(f: FormData) {
  const me = await requireOwner();
  const id = await saveEdits(f);
  await db().from("news_items").update({ status: "approved", decided_by: me.tg_id }).eq("id", id).in("status", ["draft", "approved"]);
  await logEvent(me.tg_id, "news", String(id), "승인");
  back("m=approved");
}

export async function postNewsNow(f: FormData) {
  const me = await requireOwner();
  const id = await saveEdits(f);
  const { data } = await db().from("news_items").select(NEWS_COLS).eq("id", id).maybeSingle();
  if (!data || data.status === "posted") back("m=gone");
  const r = await postNews(data as NewsItem);
  await logEvent(me.tg_id, "news", String(id), r.ok ? "지금 올림" : `올리기 실패: ${r.error}`);
  back(r.ok ? "m=posted" : `e=${encodeURIComponent(r.error ?? "")}`);
}

export async function rejectNews(f: FormData) {
  const me = await requireOwner();
  const id = Number(str(f, "id"));
  await db().from("news_items").update({ status: "rejected", decided_by: me.tg_id }).eq("id", id).in("status", ["draft", "approved"]);
  await logEvent(me.tg_id, "news", String(id), "버림");
  back("m=rejected");
}

export async function collectNow() {
  await requireOwner();
  const r = await collectNews();
  back(`r=${encodeURIComponent(`초안 ${r.drafts}개 · 관련 없음 ${r.ignored}개${r.errors.length ? ` · 오류: ${r.errors.slice(0, 3).join(" / ")}` : ""}`)}`);
}

export async function addFromLink(f: FormData) {
  await requireOwner();
  const url = str(f, "url");
  if (!/^https?:\/\/\S+$/i.test(url)) back("e=" + encodeURIComponent("https:// 로 시작하는 링크를 넣어 주세요"));
  const r = await draftFromLink(url, str(f, "text"));
  back(r.ok ? "m=drafted" : `e=${encodeURIComponent(r.error ?? "")}`);
}

export async function addSource(f: FormData) {
  const me = await requireOwner();
  const name = str(f, "name"), url = str(f, "url");
  if (!name || !/^https?:\/\/\S+$/i.test(url)) back("e=" + encodeURIComponent("이름과 https:// RSS 주소를 넣어 주세요"));
  await db().from("news_sources").insert({ name, url });
  await logEvent(me.tg_id, "news", "source", `추가: ${name}`);
  back("m=source");
}

export async function toggleSource(f: FormData) {
  await requireOwner();
  await db().from("news_sources").update({ active: str(f, "active") === "1" }).eq("id", Number(str(f, "id")));
  back("m=source");
}
