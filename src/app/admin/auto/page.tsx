import { requireOwner } from "@/lib/session";
import { db } from "@/lib/db";
import { autoApprove } from "@/lib/settings";
import { CARD_COLS2, CARD_COLS3, type Card } from "@/lib/cards";
import { stock, KIND_KO } from "@/lib/autopilot";
import AdminTop from "../AdminTop";
import { toggleAuto, rejectItem, saveItem, postNow } from "./actions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FUN_KO: Record<string, string> = { kpop: "K-pop 표현", drama: "드라마 표현", real: "교과서 vs 실제", proverb: "속담", balance: "밸런스 게임", food: "메뉴판 읽기" };
const MSG: Record<string, string> = {
  on: "자동 승인을 켰어요 — 창고의 글이 승인 없이 순서대로 올라가요.", off: "자동 승인을 껐어요 — [🌅 카드]에서 승인한 것만 올라가요.",
  rejected: "버렸어요 (안 올라가요).", saved: "고친 내용을 저장했어요.", posted: "채널에 올렸어요.",
};

const WEEK: [string, string, string, string, string][] = [
  // 요일, 10시, 14시, 18시, 20시 (타슈켄트)
  ["월", "표현 카드", "쓰기 연습 (+지난 정답)", "퀴즈", "참여 질문"],
  ["화", "표현 카드 + 투표", "어휘·문법 팁", "퀴즈", "📥 자료 소개 (봇으로 받기)"],
  ["수", "표현 카드", "쓰기 연습 (+지난 정답)", "퀴즈", "참여 질문"],
  ["목", "표현 카드", "어휘·문법 팁", "퀴즈", "📢 수업 모집 (반 없으면 대기 명단)"],
  ["금", "표현 카드 + 투표", "쓰기 연습 (+지난 정답)", "퀴즈", "참여 질문"],
  ["토", "표현 카드", "어휘·문법 팁", "퀴즈", "참여 질문 (첫 토요일 = 🎓 유학 상담)"],
  ["일", "표현 카드", "🎵 재미: K-pop·드라마·실제 한국어·속담", "주간 정답 모음", "🎮 재미: 밸런스 게임 투표·메뉴판 읽기 챌린지"],
];

function FunFields({ c }: { c: Card }) {
  if (c.tag === "balance") return <>
    <label>질문 (우즈벡어)<input className="input" name="question" defaultValue={c.question ?? ""} /></label>
    <label>선택지 (한 줄에 하나)<textarea className="input" name="options" rows={3} defaultValue={(c.options ?? []).join("\n")} /></label>
  </>;
  if (c.tag === "food") return <>
    <label>가게 이름 (한국어)<input className="input" name="question" defaultValue={c.question ?? ""} /></label>
    <label>메뉴 (한 줄에 &quot;이름 | 가격&quot;)<textarea className="input" name="body_ko" rows={5} defaultValue={c.body_ko ?? ""} /></label>
  </>;
  return <>
    <label>표현 (한국어)<input className="input" name="expr_ko" defaultValue={c.expr_ko ?? ""} /></label>
    <label>뜻 (우즈벡어)<input className="input" name="meaning_uz" defaultValue={c.meaning_uz ?? ""} /></label>
    <label>설명 (우즈벡어)<textarea className="input" name="body_uz" rows={5} defaultValue={c.body_uz ?? ""} /></label>
  </>;
}

function Item({ c }: { c: Card }) {
  return (
    <form className="card" id={`i${c.id}`}>
      <input type="hidden" name="id" value={c.id} />
      <div className="row" style={{ alignItems: "flex-start" }}>
        {(c.kind === "writing" || (c.kind === "fun" && c.tag === "food")) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/admin/auto/img/${c.id}?v=${encodeURIComponent((c.body_ko ?? "").slice(0, 40))}`} alt="" width={220} height={220} style={{ borderRadius: 12, flexShrink: 0 }} />
        )}
        <div className="grow">
          {c.status === "approved" && <span className="badge ok">승인됨</span>} <span className="muted">#{c.id}{c.tag ? ` · ${FUN_KO[c.tag] ?? c.tag}` : ""}</span>
          {c.kind === "fun" ? <FunFields c={c} /> : <>
          {c.kind === "question" && <label>질문 (우즈벡어)<input className="input" name="question" defaultValue={c.question ?? ""} /></label>}
          {c.kind !== "question" && <label>{c.kind === "writing" ? "문제 글 (한국어, ㉠ ㉡ 빈칸)" : "제목 (한국어)"}<textarea className="input" name="body_ko" rows={c.kind === "writing" ? 4 : 1} defaultValue={c.body_ko ?? ""} /></label>}
          <label>{c.kind === "tip" ? "설명 (우즈벡어)" : "덧붙임 (우즈벡어, 비우면 기본 문구)"}<textarea className="input" name="body_uz" rows={c.kind === "tip" ? 6 : 2} defaultValue={c.body_uz ?? ""} /></label>
          {c.kind === "writing" && <label>모범답안 (다음 쓰기 날 답장으로 올라감)<textarea className="input" name="answer" rows={2} defaultValue={c.answer ?? ""} /></label>}
          </>}
          {c.meaning_ko && <p className="muted" style={{ margin: "4px 0 0" }}>한국어 뜻: {c.meaning_ko}</p>}
        </div>
      </div>
      <div className="row">
        <span className="grow" />
        <button className="btn" formAction={rejectItem}>버리기</button>
        <button className="btn" formAction={saveItem}>저장</button>
        <button className="btn" formAction={postNow}>지금 올리기</button>
      </div>
    </form>
  );
}

export default async function AutoAdmin({ searchParams }: { searchParams: Promise<{ m?: string; e?: string; r?: string }> }) {
  await requireOwner();
  const { m, e, r } = await searchParams;
  const sb = db();
  const auto = await autoApprove();
  const [st, { data: items, error }, { count: wait }, { count: botUsers }, { data: funs, error: funErr }] = await Promise.all([
    stock().catch(() => []),
    sb.from("daily_cards").select(CARD_COLS2).in("kind", ["writing", "tip", "question"]).in("status", auto ? ["draft", "approved"] : ["approved", "draft"]).order("sort").order("id"),
    sb.from("bot_users").select("tg_id", { count: "exact", head: true }).not("waitlist_at", "is", null),
    sb.from("bot_users").select("tg_id", { count: "exact", head: true }),
    sb.from("daily_cards").select(CARD_COLS3).eq("kind", "fun").in("status", ["draft", "approved"]).order("sort").order("id"),
  ]);
  const funList = (funs ?? []) as unknown as Card[];
  const list = (items ?? []) as unknown as Card[];
  const of = (k: string) => list.filter((c) => c.kind === k);

  return (
    <>
      <AdminTop />
      <div className="wrap wide">
        {m && MSG[m] && <div className="notice ok">{MSG[m]}{r ? ` (${r})` : ""}</div>}
        {e && <div className="notice err">{e}</div>}
        {error && <div className="notice err">새 표가 아직 없어요 — Supabase SQL Editor에서 <b>0008_autopilot.sql</b>을 실행해 주세요.</div>}

        <h1>⚙️ 자동 운영</h1>
        <div className="card">
          <div className="row">
            <div className="grow">
              <b>자동 승인: {auto ? "🟢 켜짐" : "⚪ 꺼짐"}</b>
              <p className="muted" style={{ margin: "4px 0 0" }}>
                {auto ? "창고에 있는 글이 승인 없이 순서대로 올라가요. 마음에 안 드는 글만 아래에서 [버리기] 하세요."
                  : "[🌅 카드]·여기에서 승인한 글만 올라가요."}
              </p>
            </div>
            <form action={toggleAuto}><input type="hidden" name="on" value={auto ? "off" : "on"} /><button className={`btn${auto ? "" : " primary"}`}>{auto ? "끄기" : "켜기"}</button></form>
          </div>
        </div>

        <h2>창고 (남은 날 수)</h2>
        <div className="card">
          <table className="grid">
            <thead><tr><th>종류</th><th>남은 개수</th><th>약</th></tr></thead>
            <tbody>{st.map((s) => (
              <tr key={s.kind}><td>{KIND_KO[s.kind]}</td><td>{s.left}</td><td style={{ color: s.days < 14 ? "#c62828" : undefined }}>{s.days}일 치{s.days < 14 ? " ⚠️" : ""}</td></tr>
            ))}</tbody>
          </table>
          <p className="muted" style={{ marginBottom: 0 }}>2주 치 밑으로 떨어지면 월요일 아침에 봇으로 알려 드려요. 그때 Claude 대화에서 &quot;다음 묶음 만들어줘&quot;라고 하면 돼요.</p>
        </div>

        <h2>한 주 일정 (타슈켄트 시간 · 한국은 +4시간)</h2>
        <div className="card">
          <table className="grid">
            <thead><tr><th>요일</th><th>10시</th><th>14시</th><th>18시</th><th>20시</th></tr></thead>
            <tbody>{WEEK.map((w) => <tr key={w[0]}>{w.map((x, i) => <td key={i}>{x}</td>)}</tr>)}</tbody>
          </table>
          <p className="muted" style={{ marginBottom: 0 }}>시험이 있는 날(공식 확인한 회차)은 10시 응원 · 14시 &quot;TOPIK I 어땠어요?&quot; · 20시 &quot;TOPIK II 어땠어요?&quot;(투표)가 자동으로 더해지고, 성적 발표 7·3·1일 전에도 글이 올라가요.</p>
        </div>

        <h2>지금 바로 올리기</h2>
        <div className="card">
          <div className="row" style={{ flexWrap: "wrap" }}>
            <form action={postNow}><input type="hidden" name="what" value="library" /><button className="btn">📥 자료 소개</button></form>
            <form action={postNow}><input type="hidden" name="what" value="recruit" /><button className="btn">📢 수업 모집</button></form>
            <form action={postNow}><input type="hidden" name="what" value="consult" /><button className="btn">🎓 유학 상담</button></form>
          </div>
          <p className="muted" style={{ marginBottom: 0 }}>봇 사용자 <b>{botUsers ?? 0}명</b> · 수업 대기 명단 <b>{wait ?? 0}명</b> (대기 명단에 들어오면 봇으로 바로 알려 드려요)</p>
        </div>

        {funErr && !error && <div className="notice err">재미 콘텐츠는 <b>0009_fun.sql</b>을 실행해야 보여요.</div>}
        {(["writing", "tip", "question"] as const).map((k) => (
          <section key={k}>
            <h2>다음 {KIND_KO[k]} ({of(k).length}개) <span className="muted" style={{ fontSize: 14 }}>— 위에서부터 순서대로, 5개만 보여요</span></h2>
            {!of(k).length && <p className="muted">창고가 비었어요.</p>}
            {of(k).slice(0, 5).map((c) => <Item key={c.id} c={c} />)}
          </section>
        ))}
        <section>
          <h2>다음 재미 콘텐츠 ({funList.length}개) <span className="muted" style={{ fontSize: 14 }}>— 일요일 14시·20시, 5개만 보여요</span></h2>
          {!funList.length && <p className="muted">창고가 비었어요.</p>}
          {funList.slice(0, 5).map((c) => <Item key={c.id} c={c} />)}
        </section>
      </div>
    </>
  );
}
