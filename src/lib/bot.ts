import "server-only";
import { createHash } from "node:crypto";
import { BOT_TOKEN, SESSION_SECRET } from "./env";

// 텔레그램이 webhook에 붙여 보내는 비밀값 (우리 서버만 앎)
export const webhookSecret = () => createHash("sha256").update(`${BOT_TOKEN}|${SESSION_SECRET}`).digest("hex").slice(0, 48);
