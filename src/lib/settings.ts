import "server-only";
import { db } from "./db";

// 작은 설정 값 (표 settings, 0008). 표가 없으면 기본값.
export async function getSetting(key: string, fallback = ""): Promise<string> {
  const { data, error } = await db().from("settings").select("value").eq("key", key).maybeSingle();
  if (error || !data) return fallback;
  return data.value;
}
export async function setSetting(key: string, value: string) {
  await db().from("settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
}
// 자동 승인: 켜져 있으면 창고의 초안도 승인 없이 순서대로 올라감 (기본 켜짐)
export const autoApprove = async () => (await getSetting("auto_approve", "on")) === "on";
