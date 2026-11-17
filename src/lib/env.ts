// 환경변수 — 붙여 넣을 때 딸려 오는 공백·끝의 "/"·설명 글을 정리해서 씀
const clean = (v?: string) => (v ?? "").trim();

export const SUPABASE_URL = clean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  .replace(/\/+$/, "").replace(/\/(rest|auth)\/v1$/, "").replace(/\/+$/, "");
export const SERVICE_KEY = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
// 봇 토큰 칸에 설명이 섞여 들어와도 "숫자:글자" 모양만 골라 씀
export const BOT_TOKEN = (clean(process.env.BOT_TOKEN).match(/\d{6,}:[A-Za-z0-9_-]{30,}/) ?? [""])[0];
export const BOT_USERNAME = clean(process.env.NEXT_PUBLIC_BOT_USERNAME).replace(/^@/, "");
export const SESSION_SECRET = clean(process.env.SESSION_SECRET);
export const OWNER_IDS = clean(process.env.OWNER_IDS).split(/[\s,]+/).filter(Boolean).map(Number);

export const isOwnerId = (id: number) => OWNER_IDS.includes(id);
