import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/session";
import { db } from "@/lib/db";
import { CLASS_COLS, type ClassRow, type Enrollment } from "@/lib/types";
import { zoned, DAY_KO } from "@/lib/time";
import AdminTop from "../../AdminTop";
import ClassForm from "../../ClassForm";
import { updateClass, confirmPayment, dropEnrollment } from "../../actions";

const MSG: Record<string, [string, string]> = {
  created: ["반을 만들었어요. Zoom 링크와 강사를 확인해 주세요.", "ok"], saved: ["저장했어요.", "ok"],
  dropped: ["수강을 그만둠으로 바꿨어요 (기록은 남음).", "ok"], no_zoom: ["Zoom 링크가 아직 없어요. 아래에서 넣어 주세요.", "err"],
};
type Person = { tg_id: number; passport_name: string | null; tg_name: string | null; tg_username: string | null; phone: string | null };
type Att = { tg_id: number; lesson_date: string; state: "present" | "late" | "outside"; first_at: string };

// 최근 4주 동안 이 반의 수업 날짜 (반 시간대 기준)
function lessonDates(c: ClassRow, weeks = 4) {
  const out: string[] = [];
  const todayStr = zoned(c.tz).date;
  for (let i = weeks * 7; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    const z = zoned(c.tz, d);
    if (!c.days.includes(z.weekday)) continue;
    if (c.starts_on && z.date < c.starts_on) continue;
    if (c.ends_on && z.date > c.ends_on) continue;
    if (z.date <= todayStr && !out.includes(z.date)) out.push(z.date);
  }
  return out;
}

export default async function ClassPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ m?: string }> }) {
  await requireOwner();
  const { id } = await params;
  const { m } = await searchParams;
  const sb = db();
  const { data: cRow } = await sb.from("classes").select(CLASS_COLS).eq("id", id).maybeSingle();
  if (!cRow) notFound();
  const c = cRow as ClassRow;
  const [{ data: en }, { data: att }, { data: staff }] = await Promise.all([
    sb.from("enrollments").select("id,class_id,tg_id,status,proof_path,proof_at,paid_amount,paid_note,confirmed_at,created_at").eq("class_id", id).order("created_at"),
    sb.from("attendance").select("tg_id,lesson_date,state,first_at").eq("class_id", id),
    sb.from("people").select("tg_id,passport_name,tg_name").order("created_at", { ascending: false }).limit(300),
  ]);
  const enroll = (en ?? []) as Enrollment[];
  const ids = enroll.map((e) => e.tg_id);
  const { data: ppl } = ids.length ? await sb.from("people").select("tg_id,passport_name,tg_name,tg_username,phone").in("tg_id", ids) : { data: [] };
  const pmap = new Map(((ppl ?? []) as Person[]).map((p) => [p.tg_id, p]));
  const name = (tg: number) => pmap.get(tg)?.passport_name ?? pmap.get(tg)?.tg_name ?? String(tg);
  const active = enroll.filter((e) => e.status === "active").sort((a, b) => name(a.tg_id).localeCompare(name(b.tg_id)));
  const others = enroll.filter((e) => e.status !== "active");
  const dates = lessonDates(c);
  const amap = new Map(((att ?? []) as Att[]).map((a) => [`${a.tg_id}|${a.lesson_date}`, a]));
  const todayStr = zoned(c.tz).date;
  const STATE: Record<string, string> = { applied: "신청만", proof: "입금 사진 옴", active: "수강 중", dropped: "그만둠" };

  return (
    <>
      <AdminTop />
      <div className="wrap wide">
        <p><Link href="/admin">← 관리 첫 화면</Link></p>
        <h1>{c.name} <span className="muted">{c.term ?? ""} · {c.days.map((d) => DAY_KO[d]).join("·")} {c.start_time?.slice(0, 5)}</span></h1>
        {m && MSG[m] && <div className={`notice ${MSG[m][1]}`}>{MSG[m][0]}</div>}
        <p className="row"><a className="btn" href={`/join/${c.id}`} target="_blank">🎥 Zoom 열기 (대표·강사는 출석 기록 안 함)</a></p>

        <h2>출석 (최근 4주 · {c.tz === "Asia/Seoul" ? "한국" : "현지"} 날짜)</h2>
        <p className="muted">✔ 출석 · △ 지각(시작 10분 뒤) · ✕ 안 들어옴 · ○ 수업 시간 밖에 들어옴 — [수업 들어가기]를 누른 기록 기준. 실제로 끝까지 있었는지는 Zoom 화면에서 강사가 확인.</p>
        <div className="tablewrap">
          <table className="grid">
            <thead><tr><th>학생</th>{dates.map((d) => <th key={d}>{d.slice(5).replace("-", "/")}</th>)}<th>출석률</th></tr></thead>
            <tbody>
              {active.map((e) => {
                let ok = 0, past = 0;
                const cells = dates.map((d) => {
                  const a = amap.get(`${e.tg_id}|${d}`);
                  const isPast = d < todayStr;
                  if (isPast || a) past++;
                  if (a && a.state !== "outside") ok++;
                  const mark = a ? (a.state === "present" ? "✔" : a.state === "late" ? "△" : "○") : isPast ? "✕" : "";
                  return <td key={d} title={a ? new Date(a.first_at).toLocaleTimeString("ko-KR", { timeZone: c.tz, hour: "2-digit", minute: "2-digit" }) : ""} style={{ textAlign: "center", background: mark === "✕" ? "var(--bad)" : mark === "△" ? "var(--check)" : undefined }}>{mark}</td>;
                });
                return <tr key={e.id}><td>{name(e.tg_id)}</td>{cells}<td>{past ? `${Math.round((ok / past) * 100)}%` : "-"}</td></tr>;
              })}
              {!active.length && <tr><td colSpan={dates.length + 2} className="muted">수강 중인 학생이 없어요.</td></tr>}
            </tbody>
          </table>
        </div>

        <h2>명단 ({active.length}/{c.capacity})</h2>
        <div className="tablewrap">
          <table className="grid">
            <thead><tr><th>이름 (여권)</th><th>텔레그램</th><th>전화</th><th>상태</th><th>받은 금액</th><th>입금 메모</th><th>확인일</th><th></th></tr></thead>
            <tbody>
              {[...active, ...others].map((e) => {
                const p = pmap.get(e.tg_id);
                return (
                  <tr key={e.id} style={e.status === "dropped" ? { color: "var(--mute)" } : undefined}>
                    <td>{name(e.tg_id)}</td>
                    <td>{p?.tg_username ? <a href={`https://t.me/${p.tg_username}`} target="_blank">@{p.tg_username}</a> : e.tg_id}</td>
                    <td>{p?.phone ?? ""}</td>
                    <td>{STATE[e.status]}</td>
                    <td>{e.paid_amount != null ? Number(e.paid_amount).toLocaleString("ko-KR") : ""}</td>
                    <td>{e.paid_note ?? ""}</td>
                    <td>{e.confirmed_at?.slice(0, 10) ?? ""}</td>
                    <td>
                      {(e.status === "applied" || e.status === "proof") && (
                        <form action={confirmPayment} style={{ display: "inline" }}>
                          <input type="hidden" name="enrollment_id" value={e.id} />
                          <input type="hidden" name="paid_amount" value={c.fee ?? ""} />
                          <input type="hidden" name="back" value={`/admin/class/${c.id}?m=saved`} />
                          <button className="btn small primary">입금 확인</button>
                        </form>
                      )}{" "}
                      {e.status !== "dropped" && (
                        <form action={dropEnrollment} style={{ display: "inline" }}>
                          <input type="hidden" name="enrollment_id" value={e.id} />
                          <input type="hidden" name="reason" value="대표가 그만둠 처리" />
                          <button className="btn small">그만둠</button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h2>반 정보 고치기</h2>
        <ClassForm c={c} teachers={(staff ?? []) as { tg_id: number; passport_name: string | null; tg_name: string | null }[]} action={updateClass} submit="저장" />
      </div>
    </>
  );
}
