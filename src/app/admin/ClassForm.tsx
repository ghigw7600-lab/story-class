import type { ClassRow } from "@/lib/types";
import { DAY_KO, hhmm } from "@/lib/time";

type Teacher = { tg_id: number; passport_name: string | null; tg_name: string | null };

// 반 만들기·고치기 — 같은 칸
export default function ClassForm({ c, teachers, action, submit }: { c?: ClassRow; teachers: Teacher[]; action: (f: FormData) => Promise<void>; submit: string }) {
  return (
    <form action={action} className="card">
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="form-grid">
        <label>반 이름 *<input className="input" name="name" required defaultValue={c?.name} placeholder="TOPIK 3급 완성반" /></label>
        <label>레벨<input className="input" name="level" defaultValue={c?.level ?? ""} placeholder="2급→3급" /></label>
        <label>기수<input className="input" name="term" defaultValue={c?.term ?? ""} placeholder="1기" /></label>
        <label>시작 시각 (학생 시간대)<input className="input" type="time" name="start_time" defaultValue={hhmm(c?.start_time)} /></label>
        <label>수업 길이 (분)<input className="input" name="minutes" inputMode="numeric" defaultValue={c?.minutes ?? 90} /></label>
        <label>시간대<select className="input" name="tz" defaultValue={c?.tz ?? "Asia/Tashkent"}>
          <option value="Asia/Tashkent">우즈벡 (타슈켄트, 한국보다 4시간 늦음)</option>
          <option value="Asia/Bishkek">키르기스 (비슈케크, 3시간 늦음)</option>
          <option value="Asia/Seoul">한국</option>
        </select></label>
        <label>개강일<input className="input" type="date" name="starts_on" defaultValue={c?.starts_on ?? ""} /></label>
        <label>종강일<input className="input" type="date" name="ends_on" defaultValue={c?.ends_on ?? ""} /></label>
        <label>정원<input className="input" name="capacity" inputMode="numeric" defaultValue={c?.capacity ?? 15} /></label>
        <label>수강료 (숫자)<input className="input" name="fee" inputMode="numeric" defaultValue={c?.fee ?? ""} placeholder="300000" /></label>
        <label>수강료 설명<input className="input" name="fee_note" defaultValue={c?.fee_note ?? ""} placeholder="원 · 4주" /></label>
        <label>상태<select className="input" name="status" defaultValue={c?.status ?? "open"}>
          <option value="open">모집 중 (학생 화면에 보임)</option>
          <option value="running">수업 중 (신청 마감)</option>
          <option value="closed">끝남</option>
        </select></label>
      </div>
      <label>수업 요일
        <span className="row" style={{ marginTop: 6 }}>
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <span key={d} className="row" style={{ gap: 4 }}><input type="checkbox" name="days" value={d} defaultChecked={c?.days.includes(d)} /> {DAY_KO[d]}</span>
          ))}
        </span>
      </label>
      <label>Zoom 회의 링크 (학생에겐 안 보이고 [수업 들어가기]로만 열림)<input className="input" name="zoom_url" defaultValue={c?.zoom_url ?? ""} placeholder="https://us06web.zoom.us/j/…" /></label>
      <label>강사 (한 번 로그인한 사람 중에서)<select className="input" name="teacher_tg" defaultValue={c?.teacher_tg ?? ""}>
        <option value="">— 없음 —</option>
        {teachers.map((p) => <option key={p.tg_id} value={p.tg_id}>{p.passport_name ?? p.tg_name} ({p.tg_id})</option>)}
      </select></label>
      <button className="btn primary">{submit}</button>
    </form>
  );
}
