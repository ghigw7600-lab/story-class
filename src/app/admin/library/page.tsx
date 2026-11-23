import { requireOwner } from "@/lib/session";
import { db } from "@/lib/db";
import { CAT_KO } from "@/lib/botflow";
import { BOT_USERNAME } from "@/lib/env";
import AdminTop from "../AdminTop";
import { saveItem, toggleItem, addLink } from "./actions";

type Item = { id: number; category: string; title: string; description: string | null; file_type: string; url: string | null; sort: number; active: boolean; downloads: number };
const TYPE: Record<string, string> = { document: "📄 파일", audio: "🎧 음원", video: "🎬 영상", photo: "🖼 사진", link: "🔗 링크" };

export default async function LibraryAdmin({ searchParams }: { searchParams: Promise<{ m?: string; e?: string }> }) {
  await requireOwner();
  const { m, e } = await searchParams;
  const sb = db();
  const [{ data: items, error }, users, subs, week] = await Promise.all([
    sb.from("library_items").select("id,category,title,description,file_type,url,sort,active,downloads").order("category").order("sort").order("id", { ascending: false }),
    sb.from("bot_users").select("tg_id", { count: "exact", head: true }),
    sb.from("bot_users").select("tg_id", { count: "exact", head: true }).eq("subscribed", true),
    sb.from("bot_users").select("tg_id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 7 * 86400_000).toISOString()),
  ]);
  const list = (items ?? []) as Item[];

  return (
    <>
      <AdminTop />
      <div className="wrap wide">
        {m && <div className="notice ok">{m === "added" ? "링크 자료를 넣었어요." : "저장했어요."}</div>}
        {e && <div className="notice err">{e}</div>}
        {error && <div className="notice err">도서관 표가 아직 없어요 — Supabase SQL Editor에서 <b>0007_bot_library.sql</b>을 실행하고, 맨 위 [🤖 봇 연결]을 한 번 눌러 주세요.</div>}

        <h1>📦 봇 자료실 (@{BOT_USERNAME || "storykorean_bot"})</h1>
        <div className="row">
          <div className="card grow"><div className="muted">봇을 연 사람</div><b style={{ fontSize: 28 }}>{users.count ?? 0}명</b><div className="muted">최근 7일 +{week.count ?? 0}</div></div>
          <div className="card grow"><div className="muted">채널 구독 확인됨</div><b style={{ fontSize: 28 }}>{subs.count ?? 0}명</b></div>
          <div className="card grow"><div className="muted">자료</div><b style={{ fontSize: 28 }}>{list.filter((x) => x.active).length}개</b><div className="muted">받은 횟수 {list.reduce((s, x) => s + x.downloads, 0)}</div></div>
        </div>

        <div className="card">
          <b>자료 넣는 법 (가장 쉬움)</b>
          <p className="muted" style={{ margin: "6px 0 0" }}>
            휴대폰 텔레그램에서 <b>@{BOT_USERNAME || "storykorean_bot"}</b>에게 파일(PDF·음원·영상·사진)을 보내면서 캡션에 분류와 제목을 쓰세요.<br />
            <code>#tests 자체 모의고사 1회</code> · <code>#writing 쓰기 54번 패턴 모음</code> · <code>#words TOPIK I 필수 단어 300</code> · <code>#guide 개인 캐비닛 만드는 법</code><br />
            봇이 &quot;✅ 도서관에 저장했어요&quot;라고 답하면 끝. 학생은 채널 구독이 확인돼야 받을 수 있어요.<br />
            ⚠️ <b>직접 만든 자료</b>만 올려 주세요. 시중 교재 PDF·영화·남의 음원은 저작권 문제가 있어요. 공식 기출은 파일 대신 <b>topik.go.kr 링크</b>로 넣는 게 안전해요.
          </p>
        </div>

        <h2>자료 목록</h2>
        {!list.length && <p className="muted">아직 없어요.</p>}
        {list.map((it) => (
          <form key={it.id} action={saveItem} className="card">
            <input type="hidden" name="id" value={it.id} />
            <div className="row">
              <span className={`badge ${it.active ? "ok" : ""}`}>{it.active ? "보임" : "숨김"}</span>
              <span className="muted">{TYPE[it.file_type] ?? it.file_type} · 받은 횟수 {it.downloads}</span>
              <span className="grow" />
              <button className="btn small" formAction={toggleItem} name="active" value={it.active ? "0" : "1"}>{it.active ? "숨기기" : "보이기"}</button>
            </div>
            <div className="row">
              <label className="grow">제목 (학생에게 보이는 버튼 이름)<input className="input" name="title" defaultValue={it.title} maxLength={120} /></label>
              <label>분류<select className="input" name="category" defaultValue={it.category}>{Object.entries(CAT_KO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
              <label>순서<input className="input" name="sort" defaultValue={it.sort} inputMode="numeric" style={{ maxWidth: 70 }} /></label>
            </div>
            <label>설명 (우즈벡어, 선택)<input className="input" name="description" defaultValue={it.description ?? ""} maxLength={600} /></label>
            {it.url && <p className="muted" style={{ margin: 0 }}>🔗 {it.url}</p>}
            <button className="btn">저장</button>
          </form>
        ))}

        <h2>링크 자료 추가</h2>
        <form action={addLink} className="card">
          <div className="row">
            <label className="grow">제목 *<input className="input" name="title" placeholder="TOPIK rasmiy sayti — o‘tgan yillar testlari" /></label>
            <label>분류<select className="input" name="category" defaultValue="tests">{Object.entries(CAT_KO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          </div>
          <label>링크 *<input className="input" name="url" placeholder="https://www.topik.go.kr/..." /></label>
          <label>설명 (우즈벡어, 선택)<input className="input" name="description" /></label>
          <button className="btn primary">넣기</button>
        </form>
      </div>
    </>
  );
}
