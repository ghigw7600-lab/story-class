import { requireOwner } from "@/lib/session";
import { db } from "@/lib/db";
import { EXAM_COLS, plan, tashkentToday, type ExamEvent } from "@/lib/exams";
import AdminTop from "../AdminTop";
import { saveExam, toggleExam, postExamNow } from "./actions";

const MSG: Record<string, string> = { saved: "저장했어요.", posted: "채널에 올렸어요." };

function ExamForm({ e }: { e?: ExamEvent }) {
  return (
    <form action={saveExam} className="card">
      {e && <input type="hidden" name="id" value={e.id} />}
      <div className="row">
        <label className="grow">시험 이름 *<input className="input" name="name" defaultValue={e?.name ?? ""} placeholder="111-TOPIK (PBT)" required /></label>
        <label className="grow">장소 (우즈벡어로)<input className="input" name="place" defaultValue={e?.place ?? ""} placeholder="O‘zbekiston" /></label>
      </div>
      <div className="row">
        <label>시험일 *<input className="input" type="date" name="exam_date" defaultValue={e?.exam_date ?? ""} required /></label>
        <label>접수 시작<input className="input" type="date" name="reg_start" defaultValue={e?.reg_start ?? ""} /></label>
        <label>접수 마감<input className="input" type="date" name="reg_end" defaultValue={e?.reg_end ?? ""} /></label>
        <label>성적 발표<input className="input" type="date" name="result_date" defaultValue={e?.result_date ?? ""} /></label>
      </div>
      <label>접수·공지 링크 (선택)<input className="input" name="link" defaultValue={e?.link ?? ""} placeholder="https://www.topik.go.kr/..." /></label>
      <button className="btn primary">{e ? "고친 날짜 저장" : "시험 추가"}</button>
    </form>
  );
}

export default async function ExamsAdmin({ searchParams }: { searchParams: Promise<{ m?: string; e?: string }> }) {
  await requireOwner();
  const { m, e } = await searchParams;
  const sb = db();
  const today = tashkentToday();
  const [{ data: events, error }, { data: posts }] = await Promise.all([
    sb.from("exam_events").select(EXAM_COLS).order("exam_date"),
    sb.from("exam_posts").select("event_id,trigger,posted_at"),
  ]);
  const done = new Set((posts ?? []).map((p) => `${p.event_id}:${p.trigger}`));
  const list = (events ?? []) as ExamEvent[];

  return (
    <>
      <AdminTop />
      <div className="wrap wide">
        {m && MSG[m] && <div className="notice ok">{MSG[m]}</div>}
        {e && <div className="notice err">{e}</div>}
        {error && <div className="notice err">시험 표가 아직 없어요 — Supabase SQL Editor에서 <b>0005_exam_campaign.sql</b>을 실행해 주세요.</div>}

        <h1>📅 시험 일정 캠페인</h1>
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            시험 날짜를 넣어 두면 매일 아침(타슈켄트 10시) 그날에 맞는 글이 자동으로 올라가요:
            접수 시작 → 마감 2일 전 → D-30·14·7·3 (공부 팁) → D-1 (준비물) → 시험 당일 응원 → 다음 날 &quot;어땠어요?&quot; 투표 → 성적 발표 (상담 버튼).
            <b> 날짜는 꼭 공식 공지(topik.go.kr, 우즈벡 시행기관)로 확인</b>해서 넣어 주세요 — 우즈벡 시행일은 한국과 다를 수 있고, 한국에서만 보는 회차도 있어요(예: 2027년 1월 110회).
            우즈벡어 문구는 고정 틀이라 현지인에게 한 번 확인받으면 계속 써요.
          </p>
        </div>

        {list.map((ev) => (
          <div key={ev.id} className="card">
            <div className="row">
              <span className={`badge ${ev.active ? "ok" : ""}`}>{ev.active ? "켜짐" : "꺼짐"}</span>
              <b className="grow">{ev.name} {ev.place && <span className="muted">· {ev.place}</span>}</b>
              <form action={toggleExam}><input type="hidden" name="id" value={ev.id} /><input type="hidden" name="active" value={ev.active ? "0" : "1"} /><button className="btn small">{ev.active ? "끄기" : "켜기"}</button></form>
            </div>
            <table className="grid">
              <thead><tr><th>날짜</th><th>글</th><th>상태</th><th></th></tr></thead>
              <tbody>{plan(ev).map((p) => {
                const sent = done.has(`${ev.id}:${p.trigger}`);
                return (
                  <tr key={p.trigger}>
                    <td>{p.date}{p.date === today ? " (오늘)" : ""}</td>
                    <td title={p.text}>{p.label}</td>
                    <td>{sent ? "✅ 올림" : p.date < today ? "지남" : "예정"}</td>
                    <td>{!sent && <form action={postExamNow}><input type="hidden" name="id" value={ev.id} /><input type="hidden" name="trigger" value={p.trigger} /><button className="btn small">지금 올리기</button></form>}</td>
                  </tr>
                );
              })}</tbody>
            </table>
            <details><summary className="muted">날짜 고치기</summary><ExamForm e={ev} /></details>
          </div>
        ))}

        <h2>시험 추가</h2>
        <ExamForm />
      </div>
    </>
  );
}
