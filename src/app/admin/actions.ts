"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, logEvent } from "@/lib/db";
import { requireOwner } from "@/lib/session";
import { notifyStudent } from "@/lib/notify";
import { origin } from "@/lib/origin";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => { const v = str(f, k).replace(/[,\s]/g, ""); return v === "" ? null : Number(v); };

function classFields(f: FormData) {
  const z = str(f, "zoom_url");
  const zoom = /^https:\/\/\S+$/i.test(z) ? z : "";   // https:// 로 시작하는 링크만
  return {
    name: str(f, "name"),
    level: str(f, "level") || null,
    term: str(f, "term") || null,
    days: f.getAll("days").map(Number).filter((d) => d >= 1 && d <= 7).sort(),
    start_time: str(f, "start_time") || null,
    minutes: num(f, "minutes") ?? 90,
    tz: str(f, "tz") || "Asia/Tashkent",
    starts_on: str(f, "starts_on") || null,
    ends_on: str(f, "ends_on") || null,
    capacity: num(f, "capacity") ?? 15,
    fee: num(f, "fee"),
    fee_note: str(f, "fee_note") || null,
    zoom_url: zoom || null,
    teacher_tg: num(f, "teacher_tg"),
    status: (["open", "running", "closed"].includes(str(f, "status")) ? str(f, "status") : "open") as "open" | "running" | "closed",
  };
}

export async function createClass(f: FormData) {
  const me = await requireOwner();
  const v = classFields(f);
  if (!v.name) redirect("/admin?m=noname");
  const { data, error } = await db().from("classes").insert(v).select("id").single();
  if (error) redirect(`/admin?m=err`);
  await logEvent(me.tg_id, "class", data.id, `반 만들기: ${v.name}`);
  revalidatePath("/admin");
  redirect(`/admin/class/${data.id}?m=created`);
}

export async function updateClass(f: FormData) {
  const me = await requireOwner();
  const id = str(f, "id");
  const v = classFields(f);
  if (v.teacher_tg) await db().from("people").update({ role: "teacher" }).eq("tg_id", v.teacher_tg).eq("role", "student");
  await db().from("classes").update(v).eq("id", id);
  await logEvent(me.tg_id, "class", id, `반 고침: ${v.name}`);
  revalidatePath(`/admin/class/${id}`);
  redirect(`/admin/class/${id}?m=saved`);
}

// [입금 확인] → 수업 입장 열림 + 학생에게 봇 알림
export async function confirmPayment(f: FormData) {
  const me = await requireOwner();
  const id = str(f, "enrollment_id");
  const { data: e } = await db().from("enrollments").select("id,tg_id,status,class_id,classes(name)").eq("id", id).maybeSingle();
  if (!e || e.status === "dropped") redirect("/admin");
  const amount = num(f, "paid_amount");
  const note = str(f, "paid_note") || null;
  await db().from("enrollments").update({ status: "active", paid_amount: amount, paid_note: note, confirmed_at: new Date().toISOString(), confirmed_by: me.tg_id }).eq("id", id);
  const name = (e.classes as unknown as { name: string } | null)?.name ?? "";
  await logEvent(me.tg_id, "confirm", id, `${name} · ${amount ?? "-"} ${note ?? ""}`);
  await notifyStudent(e.tg_id, `✅ To'lov tasdiqlandi · Оплата подтверждена\n${name}\n\nDars vaqtida "Darsga kirish" tugmasini bosing.\nВо время урока нажмите «Войти на урок».`, await origin());
  revalidatePath("/admin");
  redirect(str(f, "back") || "/admin?m=confirmed");
}

export async function dropEnrollment(f: FormData) {
  const me = await requireOwner();
  const id = str(f, "enrollment_id");
  const reason = str(f, "reason") || "사유 없음";
  const { data: e } = await db().from("enrollments").select("class_id").eq("id", id).maybeSingle();
  await db().from("enrollments").update({ status: "dropped" }).eq("id", id);
  await logEvent(me.tg_id, "drop", id, reason);
  revalidatePath("/admin");
  redirect(e ? `/admin/class/${e.class_id}?m=dropped` : "/admin");
}
