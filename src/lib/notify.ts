import "server-only";
import { OWNER_IDS } from "./env";
import { tgCall } from "./tg";

// 대표(OWNER_IDS)에게 봇으로 알림 — 대표가 봇에 /start를 한 번 눌러 둬야 받을 수 있음
export async function notifyOwners(text: string, origin?: string) {
  await Promise.all(OWNER_IDS.map((id) => tgCall("sendMessage", {
    chat_id: id, text,
    ...(origin ? { reply_markup: { inline_keyboard: [[{ text: "🛠 관리 화면", web_app: { url: `${origin}/app?to=/admin` } }]] } } : {}),
  })));
}

export const notifyStudent = (tgId: number, text: string, origin?: string) => tgCall("sendMessage", {
  chat_id: tgId, text,
  ...(origin ? { reply_markup: { inline_keyboard: [[{ text: "📚 Darslarim · Мои уроки", web_app: { url: `${origin}/app` } }]] } } : {}),
});
