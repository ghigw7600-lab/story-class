import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { BOT_TOKEN } from "./env";

export type TgUser = { id: number; first_name?: string; last_name?: string; username?: string; language_code?: string };

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const DAY = 24 * 60 * 60;

// ① 봇에서 연 미니앱: 텔레그램이 넣어 준 initData의 서명 확인
//    secret = HMAC_SHA256(key "WebAppData", 봇 토큰), hash = HMAC_SHA256(secret, 정렬한 key=value 줄들)
export function verifyInitData(initData: string, maxAgeSec = DAY): TgUser | null {
  if (!initData || !BOT_TOKEN) return null;
  const p = new URLSearchParams(initData);
  const hash = p.get("hash") ?? "";
  p.delete("hash");
  const check = [...p.entries()].map(([k, v]) => `${k}=${v}`).sort().join("\n");
  const secret = createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const calc = createHmac("sha256", secret).update(check).digest("hex");
  if (!same(calc, hash)) return null;
  if (Date.now() / 1000 - Number(p.get("auth_date") ?? 0) > maxAgeSec) return null;
  try { return JSON.parse(p.get("user") ?? "null"); } catch { return null; }
}

// ② 브라우저의 "텔레그램으로 로그인" 버튼: secret = SHA256(봇 토큰)
export function verifyLoginWidget(q: Record<string, string>, maxAgeSec = DAY): TgUser | null {
  if (!BOT_TOKEN || !q.hash || !q.id) return null;
  const { hash, ...rest } = q;
  const check = Object.keys(rest).sort().map((k) => `${k}=${rest[k]}`).join("\n");
  const secret = createHash("sha256").update(BOT_TOKEN).digest();
  const calc = createHmac("sha256", secret).update(check).digest("hex");
  if (!same(calc, hash)) return null;
  if (Date.now() / 1000 - Number(rest.auth_date ?? 0) > maxAgeSec) return null;
  return { id: Number(rest.id), first_name: rest.first_name, last_name: rest.last_name, username: rest.username };
}

// 봇으로 메시지 보내기 (알림) — 실패해도 멈추지 않음
export async function tgCall(method: string, body: object) {
  if (!BOT_TOKEN) return { ok: false, description: "BOT_TOKEN 없음" };
  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    return await r.json();
  } catch (e) {
    return { ok: false, description: String(e) };
  }
}

export const tgName = (u: TgUser) => [u.first_name, u.last_name].filter(Boolean).join(" ") || (u.username ? `@${u.username}` : String(u.id));
