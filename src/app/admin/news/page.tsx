import { requireOwner } from "@/lib/session";
import { db } from "@/lib/db";
import { NEWS_COLS, hasClaude, type NewsItem } from "@/lib/news";
import AdminTop from "../AdminTop";
import { approveNews, postNewsNow, rejectNews, collectNow, addFromLink, addSource, toggleSource } from "./actions";

export const maxDuration = 120; // [지금 모으기]는 Claude 요약 때문에 1분쯤 걸릴 수 있음

const MSG: Record<string, string> = {
  approved: "승인했어요 — 다음 게시 시간(한국 오후 4시쯤)에 하나씩 올라가요.",
  posted: "채널에 올렸어요.", rejected: "버렸어요.", drafted: "초안을 만들었어요 — 아래에서 확인해 주세요.",
  source: "가져올 곳을 바꿨어요.", gone: "이미 올라간 글이에요.",
};
const KIND: Record<string, string> = { topik: "TOPIK", visa: "비자", study: "유학·장학금", culture: "한국 생활·문화" };
const fmt = (s: string | null) => (s ? new Date(s).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
type Source = { id: number; name: string; url: string; active: boolean };

function Draft({ n }: { n: NewsItem }) {
  return (
    <form className="card">
      <input type="hidden" name="id" value={n.id} />
      <div className="row">
        {n.kind && <span className="badge">{KIND[n.kind] ?? n.kind}</span>}
        {n.status === "approved" && <span className="badge ok">승인됨 · 게시 대기</span>}
        <b className="grow">{n.title_ko ?? n.title}</b>
        <span className="muted">{n.source_name} {fmt(n.published_at ?? n.created_at)}</span>
      </div>
      <p style={{ margin: "6px 0" }}>{n.summary_ko}</p>
      <p className="muted" style={{ margin: "0 0 8px" }}>원문: <a href={n.url} target="_blank">{n.title ?? n.url}</a></p>
      <label>우즈벡어 제목 (채널에 올라가는 글)<input className="input" name="title_uz" defaultValue={n.title_uz ?? ""} maxLength={120} /></label>
      <label>우즈벡어 본문<textarea className="input" name="body_uz" rows={4} defaultValue={n.body_uz ?? ""} maxLength={700} /></label>
      <div className="row">
        <select className="input" name="cta" defaultValue={n.cta} style={{ maxWidth: 280 }}>
          <option value="class">아래 버튼: 📚 STORY Korean 수업</option>
          <option value="consult">아래 버튼: 🎓 STORY CONSULTING 상담</option>
        </select>
        <span className="grow" />
        <button className="btn" formAction={rejectNews}>버리기</button>
        <button className="btn" formAction={postNewsNow}>지금 올리기</button>
        <button className="btn primary" formAction={approveNews}>✔ 승인</button>
      </div>
    </form>
  );
}

export default async function NewsAdmin({ searchParams }: { searchParams: Promise<{ m?: string; e?: string; r?: string }> }) {
  await requireOwner();
  const { m, e, r } = await searchParams;
  const sb = db();
  const [{ data: open, error }, { data: posted }, { data: src }] = await Promise.all([
    sb.from("news_items").select(NEWS_COLS).in("status", ["draft", "approved"]).order("created_at", { ascending: false }).limit(50),
    sb.from("news_items").select(NEWS_COLS).eq("status", "posted").order("posted_at", { ascending: false }).limit(15),
    sb.from("news_sources").select("id,name,url,active").order("id"),
  ]);
  const items = (open ?? []) as NewsItem[];
  const drafts = items.filter((n) => n.status === "draft");
  const approved = items.filter((n) => n.status === "approved");

  return (
    <>
      <AdminTop />
      <div className="wrap wide">
        {m && MSG[m] && <div className="notice ok">{MSG[m]}</div>}
        {r && <div className="notice ok">모으기 결과: {r}</div>}
        {e && <div className="notice err">{e}</div>}
        {error && <div className="notice err">소식 표가 아직 없어요 — Supabase SQL Editor에서 <b>0003_news.sql</b>을 실행해 주세요.</div>}
        {!hasClaude() && <div className="notice err">ANTHROPIC_API_KEY가 없어서 요약을 못 해요 — Vercel 환경변수에 넣고 다시 배포해 주세요.</div>}

        <h1>📰 채널 소식 (확인 후 게시)</h1>
        <div className="card">
          <p className="muted" style={{ marginTop: 0 }}>
            매일 한국 낮 12시쯤 자동으로 소식을 모아 Claude가 우즈벡어 초안을 만들고 봇으로 알려 드려요.
            [✔ 승인]한 글은 한국 오후 4시쯤 하루 1개씩 채널에 올라가요. 급한 소식은 [지금 올리기].
            요약은 원문에 있는 내용만 쓰게 했지만, <b>날짜·숫자는 원문 링크로 꼭 확인</b>해 주세요. 우즈벡어도 가능하면 현지인 확인.
          </p>
          <form action={collectNow}><button className="btn">🔄 지금 소식 모으기</button> <span className="muted">1분쯤 걸려요</span></form>
        </div>

        <h2>확인 대기 {drafts.length}개</h2>
        {!drafts.length && <p className="muted">없어요.</p>}
        {drafts.map((n) => <Draft key={n.id} n={n} />)}

        {!!approved.length && (<><h2>승인됨 · 게시 대기 {approved.length}개</h2>{approved.map((n) => <Draft key={n.id} n={n} />)}</>)}

        <h2>링크로 직접 초안 만들기</h2>
        <form action={addFromLink} className="card">
          <p className="muted" style={{ marginTop: 0 }}>TOPIK 공식 공지·하이코리아 공지처럼 자동으로 못 가져오는 글은 링크를 넣어 주세요. 페이지를 못 읽으면 본문을 복사해 붙여 넣으면 돼요.</p>
          <label>링크 *<input className="input" name="url" placeholder="https://www.topik.go.kr/..." required /></label>
          <label>본문 (선택)<textarea className="input" name="text" rows={3} /></label>
          <button className="btn primary">초안 만들기</button>
        </form>

        <h2>최근 올린 소식</h2>
        {!(posted ?? []).length && <p className="muted">아직 없어요.</p>}
        {!!(posted ?? []).length && (
          <table className="grid">
            <thead><tr><th>제목</th><th>올린 때</th></tr></thead>
            <tbody>{((posted ?? []) as NewsItem[]).map((n) => <tr key={n.id}><td>{n.title_ko ?? n.title}</td><td>{fmt(n.posted_at)}</td></tr>)}</tbody>
          </table>
        )}

        <h2>가져올 곳 (RSS)</h2>
        <div className="card">
          {((src ?? []) as Source[]).map((s) => (
            <form key={s.id} action={toggleSource} className="row" style={{ marginBottom: 6 }}>
              <input type="hidden" name="id" value={s.id} /><input type="hidden" name="active" value={s.active ? "0" : "1"} />
              <span className={`badge ${s.active ? "ok" : ""}`}>{s.active ? "켜짐" : "꺼짐"}</span>
              <span className="grow">{s.name}</span>
              <button className="btn small">{s.active ? "끄기" : "켜기"}</button>
            </form>
          ))}
          <form action={addSource} className="row" style={{ marginTop: 10 }}>
            <input className="input" name="name" placeholder="이름 (예: 연합뉴스 사회)" style={{ maxWidth: 220 }} />
            <input className="input grow" name="url" placeholder="RSS 주소 https://..." />
            <button className="btn">추가</button>
          </form>
        </div>
      </div>
    </>
  );
}
