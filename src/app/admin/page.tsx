import Link from "next/link";
import { requireOwner } from "@/lib/session";
import { db } from "@/lib/db";
import { CLASS_COLS, type ClassRow } from "@/lib/types";
import { DAY_KO, hhmm, zoned } from "@/lib/time";
import AdminTop from "./AdminTop";
import ClassForm from "./ClassForm";
import { createClass, confirmPayment } from "./actions";

const MSG: Record<string, string> = { confirmed: "입금 확인 — 학생에게 봇으로 알렸어요.", noname: "반 이름을 써 주세요.", err: "저장하지 못했어요. 다시 해 주세요." };
type Pending = { id: string; tg_id: number; status: string; proof_path: string | null; proof_at: string | null; created_at: string; class_id: string };
type Person = { tg_id: number; passport_name: string | null; tg_name: string | null; tg_username: string | null; phone: string | null; role: string };

export default async function Admin({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  await requireOwner();
  const { m } = await searchParams;
  const sb = db();
  const [{ data: classes }, { data: pend }, { data: active }, { data: staff }] = await Promise.all([
    sb.from("classes").select(CLASS_COLS).order("created_at", { ascending: false }),
    sb.from("enrollments").select("id,tg_id,status,proof_path,proof_at,created_at,class_id").in("status", ["applied", "proof"]).order("proof_at", { ascending: false, nullsFirst: false }),
    sb.from("enrollments").select("class_id").eq("status", "active"),
    sb.from("people").select("tg_id,passport_name,tg_name").order("created_at", { ascending: false }).limit(300),
  ]);
  const cls = (classes ?? []) as ClassRow[];
  const cmap = new Map(cls.map((c) => [c.id, c]));
  const pending = (pend ?? []) as Pending[];
  const ids = [...new Set(pending.map((p) => p.tg_id))];
  const { data: ppl } = ids.length ? await sb.from("people").select("tg_id,passport_name,tg_name,tg_username,phone,role").in("tg_id", ids) : { data: [] };
  const pmap = new Map(((ppl ?? []) as Person[]).map((p) => [p.tg_id, p]));
  // 입금 사진 10분 링크
  const links = new Map<string, string>();
  await Promise.all(pending.filter((p) => p.proof_path).map(async (p) => {
    const { data } = await sb.storage.from("proofs").createSignedUrl(p.proof_path!, 600);
    if (data?.signedUrl) links.set(p.id, data.signedUrl);
  }));
  const count = new Map<string, number>();
  (active ?? []).forEach((r) => count.set(r.class_id, (count.get(r.class_id) ?? 0) + 1));
  // 오늘 수업 (각 반 시간대 기준)
  const today = cls.filter((c) => c.status !== "closed" && c.days.includes(zoned(c.tz).weekday));
  const STATUS: Record<string, string> = { open: "모집 중", running: "수업 중", closed: "끝남" };

  return (
    <>
      <AdminTop />
      <div className="wrap wide">
        {m && MSG[m] && <div className={`notice ${m === "confirmed" ? "ok" : "err"}`}>{MSG[m]}</div>}

        <h1>오늘</h1>
        <div className="row" style={{ alignItems: "stretch" }}>
          <div className="card grow"><div className="muted">입금 확인 대기</div><b style={{ fontSize: 24 }}>{pending.filter((p) => p.status === "proof").length}명</b><div className="muted">신청만 함 {pending.filter((p) => p.status === "applied").length}명</div></div>
          <div className="card grow"><div className="muted">수강 중 학생</div><b style={{ fontSize: 24 }}>{(active ?? []).length}명</b><div className="muted">반 {cls.filter((c) => c.status !== "closed").length}개</div></div>
          <div className="card grow"><div className="muted">오늘 수업</div><b style={{ fontSize: 24 }}>{today.length}개</b><div className="muted">{today.map((c) => `${c.name} ${hhmm(c.start_time)}`).join(" · ") || "없음"}</div></div>
        </div>

        <h2>입금 확인 대기 · 신청</h2>
        {!pending.length && <p className="muted">없어요.</p>}
        {pending.map((p) => {
          const who = pmap.get(p.tg_id);
          const c = cmap.get(p.class_id);
          return (
            <form key={p.id} action={confirmPayment} className="card">
              <input type="hidden" name="enrollment_id" value={p.id} />
              <div className="row">
                <b>{who?.passport_name ?? who?.tg_name ?? p.tg_id}</b>
                {who?.tg_username && <a href={`https://t.me/${who.tg_username}`} target="_blank">@{who.tg_username}</a>}
                {who?.phone && <span className="muted">{who.phone}</span>}
                <span className="grow" />
                <span>{c?.name}</span>
                <span className={`badge ${p.status === "proof" ? "check" : ""}`}>{p.status === "proof" ? "입금 사진 옴" : "신청만"}</span>
              </div>
              {links.get(p.id) && (
                <p><a href={links.get(p.id)} target="_blank"><img src={links.get(p.id)} alt="입금 사진" style={{ maxWidth: 240, maxHeight: 240, border: "1px solid var(--line)", borderRadius: 8 }} /></a></p>
              )}
              <div className="row">
                <input className="input" name="paid_amount" inputMode="numeric" placeholder={`받은 금액 (수강료 ${c?.fee ?? "-"})`} defaultValue={c?.fee ?? ""} style={{ maxWidth: 200 }} />
                <input className="input" name="paid_note" placeholder="예: 국내 이체 · 해외송금 · 가족이 대신 냄" style={{ maxWidth: 320 }} />
                <button className="btn primary">✔ 입금 확인</button>
              </div>
            </form>
          );
        })}

        <h2>반</h2>
        <div className="tablewrap">
          <table className="grid">
            <thead><tr><th>반</th><th>기수</th><th>요일·시간</th><th>기간</th><th>인원</th><th>수강료</th><th>Zoom</th><th>상태</th></tr></thead>
            <tbody>
              {cls.map((c) => (
                <tr key={c.id}>
                  <td><Link href={`/admin/class/${c.id}`}><b>{c.name}</b></Link></td>
                  <td>{c.term ?? ""}</td>
                  <td>{c.days.map((d) => DAY_KO[d]).join("·")} {hhmm(c.start_time)} ({c.tz === "Asia/Seoul" ? "한국" : c.tz === "Asia/Bishkek" ? "비슈케크" : "타슈켄트"})</td>
                  <td>{c.starts_on ?? ""}{c.ends_on ? ` ~ ${c.ends_on}` : ""}</td>
                  <td>{count.get(c.id) ?? 0}/{c.capacity}</td>
                  <td>{c.fee != null ? Number(c.fee).toLocaleString("ko-KR") : ""} {c.fee_note ?? ""}</td>
                  <td>{c.zoom_url ? "✔" : <span className="badge check">없음</span>}</td>
                  <td>{STATUS[c.status]}</td>
                </tr>
              ))}
              {!cls.length && <tr><td colSpan={8} className="muted" style={{ textAlign: "center" }}>아직 반이 없어요. 아래에서 만들어 주세요.</td></tr>}
            </tbody>
          </table>
        </div>

        <h2>반 만들기</h2>
        <ClassForm teachers={(staff ?? []) as { tg_id: number; passport_name: string | null; tg_name: string | null }[]} action={createClass} submit="반 만들기" />
      </div>
    </>
  );
}
