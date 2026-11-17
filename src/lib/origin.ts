import "server-only";
import { headers } from "next/headers";

// 지금 사이트 주소 (class.storydesk.co.kr 등) — 코드에 주소를 박지 않음
export async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "";
}
