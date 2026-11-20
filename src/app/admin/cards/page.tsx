import { requireOwner } from "@/lib/session";
import { db } from "@/lib/db";
import { hasClaude } from "@/lib/claude";
import { CARD_COLS, type Card } from "@/lib/cards";
import AdminTop from "../AdminTop";
import { approveCard, rejectCard, postCardNow, saveCard, generate } from "./actions";

export const maxDuration = 120; // Claude로 초안 만들기는 1분쯤 걸림

const MSG: Record<string, string> = {
  approved: "승인했어요 — 아침에 순서대로 올라가요.", rejected: "버렸어요.", posted: "채널에 올렸어요.",
  saved: "고친 내용을 저장했어요 (그림도 새로 그려져요).", gone: "이미 올라간 카드예요.",
};
const fmt = (s: string | null) => (s ? new Date(s).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "");

function ExpressionForm({ c }: { c: Card }) {
  const ex = [0, 1].map((i) => c.examples?.[i] ?? { ko: "", uz: "" });
  return (
    <form className="card" id={`c${c.id}`}>
      <input type="hidden" name="id" value={c.id} /><input type="hidden" name="kind" value="expression" />
      <div className="row" style={{ alignItems: "flex-start" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/admin/cards/img/${c.id}?v=${encodeURIComponent(c.expr_ko ?? "")}${encodeURIComponent(c.meaning_uz ?? "")}`} alt="" width={260} height={260} style={{ borderRadius: 12, flexShrink: 0 }} />
        <div className="grow">
          <div className="row">
            {c.status === "approved" && <span className="badge ok">승인됨 · 게시 대기</span>}
            <b className="grow">{c.meaning_ko}</b>
          </div>
          <div className="row">
            <label className="grow">표현 (한국어)<input className="input" name="expr_ko" defaultValue={c.expr_ko ?? ""} maxLength={40} /></label>
            <label>레벨<select className="input" name="level" defaultValue={c.level ?? "TOPIK II"}><option>TOPIK I</option><option>TOPIK II</option></select></label>
          </div>
          <label>뜻 (우즈벡어)<input className="input" name="meaning_uz" defaultValue={c.meaning_uz ?? ""} maxLength={80} /></label>
          <label>언제 쓰는지 (우즈벡어)<input className="input" name="note_uz" defaultValue={c.note_uz ?? ""} maxLength={200} /></label>
          {ex.map((e, i) => (
            <div className="row" key={i}>
              <label className="grow">예문 {i + 1} (한국어)<input className="input" name={`ex${i}_ko`} defaultValue={e.ko} maxLength={60} /></label>
              <label className="grow">예문 {i + 1} (우즈벡어)<input className="input" name={`ex${i}_uz`} defaultValue={e.uz} maxLength={90} /></label>
            </div>
          ))}
        </div>
      </div>
      <div className="row">
        <span className="grow" />
        <button className="btn" formAction={rejectCard}>버리기</button>
        <button className="btn" formAction={saveCard}>고친 내용 저장 (그림 새로)</button>
        <button className="btn" formAction={postCardNow}>지금 올리기</button>
        <button className="btn primary" formAction={approveCard}>✔ 승인</button>
      </div>
    </form>
  );
}

function PollForm({ c }: { c: Card }) {
  return (
    <form className="card">
      <input type="hidden" name="id" value={c.id} /><input type="hidden" name="kind" value="poll" />
      {c.status === "approved" && <span className="badge ok">승인됨 · 게시 대기</span>}
      <label>질문 (우즈벡어)<input className="input" name="question" defaultValue={c.question ?? ""} maxLength={200} /></label>
      <label>보기 (한 줄에 하나, 2~6개)<textarea className="input" name="options" rows={4} defaultValue={(c.options ?? []).join("\n")} /></label>
      <div className="row">
        <span className="grow" />
        <button className="btn" formAction={rejectCard}>버리기</button>
        <button className="btn" formAction={postCardNow}>지금 올리기</button>
        <button className="btn primary" formAction={approveCard}>✔ 승인</button>
      </div>
    </form>
  );
}

export default async function CardsAdmin({ searchParams }: { searchParams: Promise<{ m?: string; e?: string; n?: string }> }) {
  await requireOwner();
  const { m, e, n } = await searchParams;
  const sb = db();
  const [{ data: open, error }, { data: posted }] = await Promise.all([
    sb.from("daily_cards").select(CARD_COLS).in("status", ["draft", "approved"]).order("status").order("sort").order("id"),
    sb.from("daily_cards").select(CARD_COLS).eq("status", "posted").order("posted_at", { ascending: false }).limit(14),
  ]);
  const cards = (open ?? []) as Card[];
  const expr = cards.filter((c) => c.kind === "expression");
  const polls = cards.filter((c) => c.kind === "poll");
  const ready = (list: Card[]) => list.filter((c) => c.status === "approved").length;

  return (
    <>
      <AdminTop />
      <div className="wrap wide">
        {m === "generated" && <div className="notice ok">Claude가 초안 {n}개를 만들었어요 — 확인하고 승인해 주세요.</div>}
        {m && MSG[m] && <div className="notice ok">{MSG[m]}</div>}
        {e && <div className="notice err">{e}</div>}
        {error && <div className="notice err">카드 표가 아직 없어요 — Supabase SQL Editor에서 <b>0004_daily_cards.sql</b>을 실행해 주세요.</div>}
        {!hasClaude() && <div className="notice err">ANTHROPIC_API_KEY가 없어서 초안을 못 만들어요 — Vercel 환경변수에 넣어 주세요.</div>}

        <h1>🌅 아침 카드</h1>
        <div className="card">
          <p className="muted" style={{ marginTop: 0 }}>
            매일 아침 타슈켄트 10시(한국 오후 2시쯤)에 승인된 <b>오늘의 표현</b> 카드 1장, 화·금요일엔 <b>참여 투표</b> 1개도 함께 올라가요.
            창고가 4장 밑으로 떨어지면 매일 낮 소식 모으기 때 Claude가 7장씩 자동으로 채우고 봇으로 알려 드려요.
            지금 승인된 카드: 표현 <b>{ready(expr)}장</b> · 투표 <b>{ready(polls)}개</b>.
          </p>
          <form action={generate} className="row">
            <select className="input" name="kind" style={{ maxWidth: 160 }}><option value="expression">오늘의 표현 7장</option><option value="poll">참여 투표 4개</option></select>
            <input className="input grow" name="hint" placeholder="(선택) 요청 — 예: 기숙사 생활 표현, TOPIK I 쉬운 것, 겨울 관련" />
            <button className="btn primary">✨ Claude로 초안 만들기</button>
          </form>
          <p className="muted" style={{ marginBottom: 0 }}>한국어는 맞는지, 우즈벡어는 자연스러운지 한 번 보고 승인해 주세요. 고치면 [고친 내용 저장]으로 그림이 새로 그려져요.</p>
        </div>

        <h2>오늘의 표현 {expr.length}장</h2>
        {!expr.length && <p className="muted">없어요 — 위에서 초안을 만들어 주세요.</p>}
        {expr.map((c) => <ExpressionForm key={c.id} c={c} />)}

        <h2>참여 투표 {polls.length}개</h2>
        {!polls.length && <p className="muted">없어요.</p>}
        {polls.map((c) => <PollForm key={c.id} c={c} />)}

        <h2>최근 올린 카드</h2>
        {!(posted ?? []).length && <p className="muted">아직 없어요.</p>}
        {!!(posted ?? []).length && (
          <table className="grid">
            <thead><tr><th>종류</th><th>내용</th><th>올린 때</th></tr></thead>
            <tbody>{((posted ?? []) as Card[]).map((c) => (
              <tr key={c.id}><td>{c.kind === "expression" ? "표현" : "투표"}</td><td>{c.kind === "expression" ? `${c.expr_ko} — ${c.meaning_uz}` : c.question}</td><td>{fmt(c.posted_at)}</td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}
