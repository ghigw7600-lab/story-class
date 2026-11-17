import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_SECRET, isOwnerId } from "./env";
import { db, logEvent } from "./db";
import { tgName, type TgUser } from "./tg";

// 로그인 = 텔레그램 번호를 서명해서 쿠키에 넣음 (비밀번호 없음). 30일 유지.
const COOKIE = "sc_session";
const MAX_AGE = 30 * 24 * 60 * 60;
const sign = (v: string) => createHmac("sha256", SESSION_SECRET).update(v).digest("base64url");

export type Person = {
  tg_id: number; tg_username: string | null; tg_name: string | null; passport_name: string | null;
  phone: string | null; role: "student" | "teacher" | "owner"; lang: "uz" | "ru" | "ko";
};

// 텔레그램 확인이 끝난 사용자로 로그인 → 사람 표에 없으면 만들고, 있으면 이름만 새로
export async function startSession(u: TgUser) {
  if (!SESSION_SECRET) throw new Error("SESSION_SECRET이 설정되지 않았어요");
  const owner = isOwnerId(u.id);
  const { data: old } = await db().from("people").select("tg_id,role").eq("tg_id", u.id).maybeSingle();
  const lang = u.language_code === "ru" ? "ru" : u.language_code === "ko" ? "ko" : "uz";
  if (!old) {
    await db().from("people").insert({ tg_id: u.id, tg_username: u.username ?? null, tg_name: tgName(u), role: owner ? "owner" : "student", lang: owner ? "ko" : lang });
  } else {
    await db().from("people").update({
      tg_username: u.username ?? null, tg_name: tgName(u), last_seen_at: new Date().toISOString(),
      ...(owner && old.role !== "owner" ? { role: "owner" } : {}),
    }).eq("tg_id", u.id);
  }
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const v = `${u.id}.${exp}`;
  (await cookies()).set(COOKIE, `${v}.${sign(v)}`, {
    httpOnly: true, secure: true, path: "/", maxAge: MAX_AGE,
    sameSite: "none", partitioned: true, // 텔레그램 웹(web.telegram.org)은 미니앱을 iframe으로 열어서 필요
  });
  if (!old) await logEvent(u.id, "login", String(u.id), "처음 로그인");
}

export async function endSession() {
  (await cookies()).set(COOKIE, "", { path: "/", maxAge: 0, secure: true, sameSite: "none", partitioned: true });
}

function sessionId(raw?: string): number | null {
  if (!raw || !SESSION_SECRET) return null;
  const [id, exp, sig] = raw.split(".");
  if (!id || !exp || !sig) return null;
  const good = sign(`${id}.${exp}`);
  if (good.length !== sig.length || !timingSafeEqual(Buffer.from(good), Buffer.from(sig))) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return Number(id);
}

// 지금 로그인한 사람 (없으면 null). 한 화면 안에서는 한 번만 읽음.
export const getMe = cache(async (): Promise<Person | null> => {
  const id = sessionId((await cookies()).get(COOKIE)?.value);
  if (!id) return null;
  const { data } = await db().from("people").select("tg_id,tg_username,tg_name,passport_name,phone,role,lang").eq("tg_id", id).maybeSingle();
  return (data as Person) ?? null;
});

export async function requireMe() {
  const me = await getMe();
  if (!me) redirect("/");
  return me;
}

export async function requireOwner() {
  const me = await requireMe();
  if (me.role !== "owner") redirect("/home");
  return me;
}
