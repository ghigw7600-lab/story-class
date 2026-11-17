import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SERVICE_KEY } from "./env";

// 서버 전용 DB 연결 (service_role). 브라우저로는 절대 보내지 않는다.
let client: SupabaseClient | null = null;
export function db() {
  if (!client) {
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Supabase 주소·열쇠가 아직 설정되지 않았어요 (Vercel 환경변수)");
    client = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

// 기록 남기기 (실패해도 화면은 계속)
export async function logEvent(actor: number | null, kind: string, target?: string, detail?: string) {
  try { await db().from("events").insert({ actor_tg: actor, kind, target, detail }); } catch { /* 기록 실패는 무시 */ }
}
