import "server-only";

// Claude API — 소식 요약·표현 카드 초안 만들 때 씀 (Vercel 환경변수 ANTHROPIC_API_KEY)
const KEY = () => (process.env.ANTHROPIC_API_KEY ?? "").trim();
const MODEL = () => (process.env.ANTHROPIC_MODEL ?? "").trim() || "claude-sonnet-5-5";
export const hasClaude = () => !!KEY();

// system + user 를 보내고, 답에서 JSON(객체 또는 배열)만 꺼내 돌려줌
export async function claudeJSON<T>(system: string, user: string, maxTokens = 800, timeoutMs = 40000): Promise<T> {
  if (!KEY()) throw new Error("ANTHROPIC_API_KEY 없음");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY(), "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL(), max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const j = (await r.json()) as { content?: { type: string; text?: string }[]; error?: { message?: string } };
  if (!r.ok) throw new Error(j.error?.message ?? `Claude HTTP ${r.status}`);
  const text = (j.content ?? []).filter((c) => c.type === "text").map((c) => c.text).join("");
  const m = text.match(/[[{][\s\S]*[\]}]/);
  if (!m) throw new Error("Claude 답에 JSON이 없음");
  return JSON.parse(m[0]) as T;
}
