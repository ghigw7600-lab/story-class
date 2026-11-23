import { requireOwner } from "@/lib/session";
import { db } from "@/lib/db";
import { EXAM_COLS, plan, tashkentToday, type ExamEvent } from "@/lib/exams";
import AdminTop from "../AdminTop";
import { saveExam, toggleExam, postExamNow, confirmExam, postScheduleNow } from "./actions";

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
      <label>접수·공지 링크 (선택)<input className="input" name="link" defaultValue={e?.link ?? ""} placeholder="https://topiktashkec.uz" /></label>
      <label>메모 (대표만 봄)<input className="input" name="note" defaultValue={e?.note ?? ""} /></label>
      <label style={{ flexDirection: "row", alignItems: "center", gap: 8, display: "flex" }}>
        <input type="checkbox" name="confirmed" value="1" defaultChecked={e ? e.confirmed : true} /> 공식 공지로 확인함 (체크해야 채널에 자동 글이 올라가요)
      </label>
      <button className="btn primary">{e ? "고친 날짜 저장" : "시험 추가"}</button>
    </form>
  );
}

export default async function ExamsAdmin({ searchParams }: { searchParams: Promise<{ m?: string; e?: string; ok?: string }> }) {
  await requireOwner();
  const { m, e, ok } = await searchParams;
  const sb = db();
  const today = tashkentToday();
  const [{ data: events, error }, { data: posts }] = await Promise.all([
    sb.from("exam_events").select(EXAM_COLS).gte("exam_date", new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10)).order("exam_date"),
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
        {ok && <div className="notice ok">{ok}</div>}
        {error && <div className="notice err">시험 표가 아직 없거나 새 칸이 없어요 — Supabase SQL Editor에서 <b>0005</b>, <b>0006_exam_confirm.sql</b>을 실행해 주세요.</div>}

        <h1>📅 시험 일정 캠페인</h1>
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            시험 날짜를 넣어 두면 매일 아침(타슈켄트 10시) 그날에 맞는 글이 자동으로 올라가요:
            접수 시작 → 마감 2일 전 → D-30·14·7·3 (공부 팁) → D-1 (준비물) → 시험 당일 응원 → 다음 날 &quot;어땠어요?&quot; 투표 → 성적 발표 (상담 버튼).
            <b> 날짜는 꼭 공식 공지(topik.go.kr, 우즈벡 시행기관)로 확인</b>해서 넣어 주세요 — 우즈벡 시행일은 한국과 다를 수 있고, 한국에서만 보는 회차도 있어요(예: 2027년 1월 110회).
            우즈벡어 문구는 고정 틀이라 현지인에게 한 번 확인받으면 계속 써요.
          </p>
        </div>

        <h2>📌 채널 고정용 일정표 카드</h2>
        <div className="card">
          <div className="row" style={{ alignItems: "flex-start" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <a href="/admin/exams/card?year=2027" target="_blank"><img src={`/admin/exams/card?year=2027&v=${list.map((x) => `${x.id}${x.confirmed ? 1 : 0}${x.exam_date}`).join("")}`} alt="2027 일정표" width={216} height={270} style={{ borderRadius: 12 }} /></a>
            <div className="grow">
              <p className="muted" style={{ marginTop: 0 }}>
                아래 일정으로 자동으로 그려져요. 예상 일정은 그림에 <b>TAXMINIY(예상)</b>, 공식 확인한 건 <b>RASMIY</b>로 표시돼요.
                올리면 채널 맨 위에 고정까지 해요(봇에 고정 권한이 없으면 직접 고정 안내). 날짜를 고치거나 공식 확인하면 다시 올려 주세요.
              </p>
              <form action={postScheduleNow}><input type="hidden" name="year" value="2027" /><button className="btn primary">📌 2027 일정표 채널에 올리고 고정</button></form>
            </div>
          </div>
        </div>

        {list.map((ev) => (
          <div key={ev.id} className="card">
            <div className="row">
              <span className={`badge ${ev.active ? "ok" : ""}`}>{ev.active ? "켜짐" : "꺼짐"}</span>
              <span className={`badge ${ev.confirmed ? "ok" : ""}`}>{ev.confirmed ? "공식 확인" : "예상"}</span>
              <b className="grow">{ev.name} {ev.place && <span className="muted">· {ev.place}</span>} <span className="muted">· {ev.exam_date}</span></b>
              <form action={confirmExam}><input type="hidden" name="id" value={ev.id} /><input type="hidden" name="confirmed" value={ev.confirmed ? "0" : "1"} /><button className={`btn small${ev.confirmed ? "" : " primary"}`}>{ev.confirmed ? "예상으로 되돌리기" : "✔ 공식 확인함"}</button></form>
              <form action={toggleExam}><input type="hidden" name="id" value={ev.id} /><input type="hidden" name="active" value={ev.active ? "0" : "1"} /><button className="btn small">{ev.active ? "끄기" : "켜기"}</button></form>
            </div>
            {ev.note && <p className="muted" style={{ margin: "6px 0" }}>📝 {ev.note}</p>}
            {!ev.confirmed && <p className="muted" style={{ margin: "6px 0" }}>⏸ 예상 일정이라 자동 글은 쉬고 있어요. topiktashkec.uz에 이 회차가 올라오면 날짜·접수 기간을 맞추고 [✔ 공식 확인함]을 눌러 주세요.</p>}
            <table className="grid">
              <thead><tr><th>날짜</th><th>글</th><th>상태</th><th></th></tr></thead>
              <tbody>{plan(ev).map((p) => {
                const sent = done.has(`${ev.id}:${p.trigger}`);
                return (
                  <tr key={p.trigger}>
                    <td>{p.date}{p.date === today ? " (오늘)" : ""}</td>
                    <td title={p.text}>{p.label}</td>
                    <td>{sent ? "✅ 올림" : p.date < today ? "지남" : ev.confirmed ? "예정" : "⏸ 확인 후"}</td>
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
