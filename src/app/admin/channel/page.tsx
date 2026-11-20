import { requireOwner } from "@/lib/session";
import { db } from "@/lib/db";
import { CHANNEL, NUM, POST_COLS, channelCheck, type ChannelPost } from "@/lib/channel";
import AdminTop from "../AdminTop";
import { addPost, skipPost, runNow, recapNow } from "./actions";

const MSG: Record<string, [string, string]> = {
  added: ["ok", "창고에 넣었어요."],
  skipped: ["ok", "그 문제는 안 올리기로 했어요."],
  need: ["err", "문제와 보기 2개 이상은 꼭 써 주세요."],
  correct: ["err", "정답 번호가 보기 개수와 맞지 않아요."],
  long: ["err", "글자 수가 넘었어요 — 문제 300자 · 보기 100자 · 짧은 해설 200자까지."],
  err: ["err", "저장하지 못했어요. Supabase에 0002 SQL을 실행했는지 확인해 주세요."],
};
const STATUS: Record<string, string> = { queued: "대기", posted: "문제 올림", answered: "주간 모음에 넣음", skipped: "안 올림" };
const fmt = (s: string | null) => (s ? new Date(s).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "");

export default async function ChannelAdmin({ searchParams }: { searchParams: Promise<{ m?: string; r?: string }> }) {
  await requireOwner();
  const { m, r } = await searchParams;
  const sb = db();
  const [check, { data: queued, error }, { data: done }] = await Promise.all([
    channelCheck(),
    sb.from("channel_posts").select(POST_COLS).eq("status", "queued").order("sort").order("id"),
    sb.from("channel_posts").select(POST_COLS).neq("status", "queued").order("posted_at", { ascending: false, nullsFirst: false }).limit(30),
  ]);
  const q = (queued ?? []) as ChannelPost[];
  const d = (done ?? []) as ChannelPost[];

  return (
    <>
      <AdminTop />
      <div className="wrap wide">
        {m && MSG[m] && <div className={`notice ${MSG[m][0]}`}>{MSG[m][1]}</div>}
        {r && <div className="notice ok">실행 결과: {r}</div>}
        {error && <div className="notice err">채널 글 표가 아직 없어요 — Supabase SQL Editor에서 <b>0002_channel_posts.sql</b>을 실행해 주세요.</div>}

        <h1>📢 채널 자동 글</h1>
        <div className="card">
          <div className="row">
            <b>{check.title ?? CHANNEL}</b>
            <a href={`https://t.me/${CHANNEL.replace(/^@/, "")}`} target="_blank">{CHANNEL}</a>
            <span className={`badge ${check.ok ? "ok" : "bad"}`}>{check.ok ? "봇 연결 ✅" : `연결 안 됨 — ${check.error}`}</span>
          </div>
          <p className="muted">월~토 저녁 6시(타슈켄트) · 한국 밤 10시쯤 창고 맨 위 문제 1개를 퀴즈로 올려요 — 학생이 누르면 바로 정답·짧은 해설이 보여요. 일요일엔 퀴즈 대신 &quot;이번 주 문제 정답·해설 모음&quot; 1개가 올라가요. 창고에 남은 문제: <b>{q.length}개</b>{q.length < 7 && " — 일주일치(7개) 이상 채워 두세요"}</p>
          <div className="row">
            <form action={runNow}><button className="btn">▶ 퀴즈 지금 올리기</button></form>
            <form action={recapNow}><button className="btn">📚 주간 정답 모음 지금 올리기</button></form>
          </div>
        </div>

        <h2>창고 (올릴 순서)</h2>
        {!q.length && <p className="muted">비어 있어요. 아래에서 문제를 추가해 주세요.</p>}
        {q.map((p, i) => (
          <div key={p.id} className="card">
            <div className="row">
              <b>{i + 1}.</b><span className="grow">{p.question}</span>
              {p.source && <span className="muted">{p.source}</span>}
              <form action={skipPost}><input type="hidden" name="id" value={p.id} /><button className="btn small">안 올리기</button></form>
            </div>
            <div className="muted">{p.options.map((o, j) => `${NUM[j]} ${o}${j === p.correct ? " ✔" : ""}`).join("   ")}</div>
          </div>
        ))}

        <h2>문제 추가</h2>
        <form action={addPost} className="card">
          <div className="row">
            <label className="grow">출처 (꼭 쓰기)<input className="input" name="source" placeholder="제00회 TOPIK I 읽기 00번 / STORY Korean 연습문제" /></label>
            <label>레벨<input className="input" name="level" placeholder="TOPIK I" /></label>
            <label>순서<input className="input" name="sort" inputMode="numeric" placeholder="0" style={{ maxWidth: 80 }} /></label>
          </div>
          <label>지문 (선택 — 길면 퀴즈 앞에 글로 먼저 올라가요)<textarea className="input" name="passage" rows={3} /></label>
          <label>문제 * (300자까지)<input className="input" name="question" required maxLength={300} placeholder="( )에 알맞은 것을 고르십시오. 저는 ( )에서 책을 빌려요." /></label>
          <div className="row">
            {[0, 1, 2, 3].map((i) => (
              <label key={i} className="grow">
                <span><input type="radio" name="correct" value={i} defaultChecked={i === 0} /> 보기 {NUM[i]} {i < 2 ? "*" : ""} (정답이면 동그라미)</span>
                <input className="input" name={`opt${i}`} maxLength={100} required={i < 2} />
              </label>
            ))}
          </div>
          <label>짧은 해설 (답을 누르면 바로 보임 · 200자까지 · 우즈벡어)<input className="input" name="explain_short" maxLength={200} placeholder="도서관 = kutubxona" /></label>
          <label>자세한 해설 (한국어 + 우즈벡어, 참고용)<textarea className="input" name="explain_full" rows={4} /></label>
          <button className="btn primary">창고에 넣기</button>
        </form>

        <h2>올린 기록</h2>
        {!d.length && <p className="muted">아직 없어요.</p>}
        {!!d.length && (
          <table className="grid">
            <thead><tr><th>문제</th><th>상태</th><th>문제 올린 때</th><th>주간 모음</th></tr></thead>
            <tbody>{d.map((p) => (
              <tr key={p.id}><td>{p.question}</td><td>{STATUS[p.status]}</td><td>{fmt(p.posted_at)}</td><td>{fmt(p.answered_at)}</td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </>
  );
}
