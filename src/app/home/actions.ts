"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, logEvent } from "@/lib/db";
import { requireMe } from "@/lib/session";
import { notifyOwners } from "@/lib/notify";
import { origin } from "@/lib/origin";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function saveProfile(f: FormData) {
  const me = await requireMe();
  const name = str(f, "passport_name").replace(/\s+/g, " ").toUpperCase();
  if (!/^[A-Z' -]{3,80}$/.test(name)) redirect("/home?m=name");
  const phone = str(f, "phone").replace(/[^\d+]/g, "").slice(0, 20) || null;
  await db().from("people").update({ passport_name: name, phone }).eq("tg_id", me.tg_id);
  await logEvent(me.tg_id, "profile", String(me.tg_id), `여권 이름: ${name}${phone ? ` · 전화 ${phone}` : ""}`);
  revalidatePath("/home");
  redirect("/home");
}

export async function setLang(f: FormData) {
  const me = await requireMe();
  const lang = str(f, "lang") === "ru" ? "ru" : "uz";
  await db().from("people").update({ lang }).eq("tg_id", me.tg_id);
  revalidatePath("/home");
}

export async function applyClass(f: FormData) {
  const me = await requireMe();
  const classId = str(f, "class_id");
  const { data: c } = await db().from("classes").select("id,name,status,capacity").eq("id", classId).maybeSingle();
  if (!c || c.status === "closed") redirect("/home?m=closed");
  const { count } = await db().from("enrollments").select("id", { count: "exact", head: true }).eq("class_id", classId).eq("status", "active");
  if ((count ?? 0) >= c.capacity) redirect("/home?m=full");
  const { data: old } = await db().from("enrollments").select("id,status").eq("class_id", classId).eq("tg_id", me.tg_id).maybeSingle();
  if (old && old.status !== "dropped") redirect("/home");
  if (old) await db().from("enrollments").update({ status: "applied", proof_path: null, proof_at: null }).eq("id", old.id);
  else await db().from("enrollments").insert({ class_id: classId, tg_id: me.tg_id });
  await logEvent(me.tg_id, "apply", classId, c.name);
  await notifyOwners(`📝 새 수강 신청\n${me.passport_name ?? me.tg_name} → ${c.name}\n입금 사진이 오면 다시 알려 드려요.`);
  revalidatePath("/home");
  redirect("/home?m=applied");
}

export async function uploadProof(f: FormData) {
  const me = await requireMe();
  const enrollId = str(f, "enrollment_id");
  const file = f.get("file");
  if (!(file instanceof File) || file.size === 0) redirect("/home?m=nofile");
  if (file.size > 10 * 1024 * 1024) redirect("/home?m=big");
  const { data: e } = await db().from("enrollments").select("id,tg_id,status,class_id,classes(name)").eq("id", enrollId).maybeSingle();
  if (!e || e.tg_id !== me.tg_id || e.status === "dropped") redirect("/home");
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
  const path = `${me.tg_id}/${e.id}-${Date.now()}.${ext}`;
  const up = await db().storage.from("proofs").upload(path, file, { contentType: file.type || "image/jpeg" });
  if (up.error) redirect("/home?m=upload");
  await db().from("enrollments").update({ proof_path: path, proof_at: new Date().toISOString(), ...(e.status === "active" ? {} : { status: "proof" }) }).eq("id", e.id);
  const className = (e.classes as unknown as { name: string } | null)?.name ?? "";
  await logEvent(me.tg_id, "proof", e.id, className);
  await notifyOwners(`💳 입금 사진 도착\n${me.passport_name ?? me.tg_name} → ${className}\n관리 화면에서 확인 후 [입금 확인]을 눌러 주세요.`, await origin());
  revalidatePath("/home");
  redirect("/home?m=proof");
}
