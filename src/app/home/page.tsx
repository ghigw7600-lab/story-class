import Link from "next/link";
import { requireMe } from "@/lib/session";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import { CLASS_COLS, type ClassRow, type Enrollment } from "@/lib/types";
import { DAY_UZ, hhmm } from "@/lib/time";
import JoinButton from "@/components/JoinButton";
import { saveProfile, setLang, applyClass, uploadProof } from "./actions";

const MSG: Record<string, { uz: string; ru: string; kind?: "ok" | "err" }> = {
  applied: { uz: "Ariza qabul qilindi. Endi to'lov chekini yuboring.", ru: "Заявка принята. Теперь отправьте чек.", kind: "ok" },
  proof: { uz: "Chek yuborildi. Tasdiqlangach botga xabar keladi.", ru: "Чек отправлен. После подтверждения придёт сообщение в бот.", kind: "ok" },
  full: { uz: "Bu guruhda joy qolmagan.", ru: "В этой группе нет мест.", kind: "err" },
  closed: { uz: "Bu guruhga yozilish yopilgan.", ru: "Запись в эту группу закрыта.", kind: "err" },
  name: { uz: "Ismni pasportdagidek lotin harflarida yozing.", ru: "Напишите имя латиницей, как в паспорте.", kind: "err" },
  nofile: { uz: "Rasmni tanlang.", ru: "Выберите фото.", kind: "err" },
  big: { uz: "Rasm juda katta (10MB gacha).", ru: "Фото слишком большое (до 10 МБ).", kind: "err" },
  upload: { uz: "Yuklashda xatolik. Qaytadan urinib ko'ring.", ru: "Ошибка загрузки. Попробуйте ещё раз.", kind: "err" },
  no_zoom: { uz: "Dars havolasi hali qo'yilmagan. Administratorga yozing.", ru: "Ссылка на урок ещё не добавлена. Напишите администратору.", kind: "err" },
  not_active: { uz: "To'lov tasdiqlangandan keyin darsga kirishingiz mumkin.", ru: "Вход на урок откроется после подтверждения оплаты.", kind: "err" },
};

const sched = (c: ClassRow, lang: string) =>
  `${c.days.map((d) => DAY_UZ[d]).join(", ")} ${hhmm(c.start_time)} (${c.minutes} min) · ${t(lang, "tashkent")}`;
const money = (c: ClassRow) => (c.fee != null ? `${Number(c.fee).toLocaleString("ru-RU")}${c.fee_note ? ` · ${c.fee_note}` : ""}` : c.fee_note ?? "—");

export default async function Home({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const me = await requireMe();
  const L = me.lang === "ru" ? "ru" : "uz";
  const { m } = await searchParams;
  const msg = m ? MSG[m] : null;

  const head = (
    <div className="top">
      <b>STORY Korean</b><span className="grow" />
      {me.role === "owner" && <Link href="/admin">관리</Link>}
      <form action={setLang}><input type="hidden" name="lang" value={L === "uz" ? "ru" : "uz"} /><button className="btn small" style={{ background: "transparent", borderColor: "#fff6" }}>{L === "uz" ? "RU" : "UZ"}</button></form>
    </div>
  );

  // 처음 들어온 학생: 여권 이름부터
  if (!me.passport_name) {
    return (
      <>{head}
        <div className="wrap">
          <h1>{t(L, "hello")}, {me.tg_name}!</h1>
          {msg && <div className={`notice ${msg.kind ?? ""}`}>{msg[L]}</div>}
          <form action={saveProfile} className="card">
            <p><b>{t(L, "profile_title")}</b></p>
            <label>{t(L, "passport_name")}<input className="input" name="passport_name" required placeholder="KARIMOV AZIZBEK" autoCapitalize="characters" /></label>
            <label>{t(L, "phone")}<input className="input" name="phone" inputMode="tel" placeholder="+998 90 123 45 67" /></label>
            <button className="btn primary big">{t(L, "save")}</button>
          </form>
        </div>
      </>
    );
  }

  const [{ data: mine }, { data: classes }] = await Promise.all([
    db().from("enrollments").select("id,class_id,tg_id,status,proof_path,proof_at,paid_amount,paid_note,confirmed_at,created_at").eq("tg_id", me.tg_id).neq("status", "dropped"),
    db().from("classes").select(CLASS_COLS).neq("status", "closed").order("starts_on", { ascending: true }),
  ]);
  const cls = new Map(((classes ?? []) as ClassRow[]).map((c) => [c.id, c]));
  const myEnroll = (mine ?? []) as Enrollment[];
  const mineIds = new Set(myEnroll.map((e) => e.class_id));
  const openList = ((classes ?? []) as ClassRow[]).filter((c) => c.status === "open" && !mineIds.has(c.id));
  // 남은 자리
  const { data: act } = openList.length
    ? await db().from("enrollments").select("class_id").in("class_id", openList.map((c) => c.id)).eq("status", "active")
    : { data: [] as { class_id: string }[] };
  const taken = new Map<string, number>();
  (act ?? []).forEach((r) => taken.set(r.class_id, (taken.get(r.class_id) ?? 0) + 1));

  return (
    <>{head}
      <div className="wrap">
        <h1>{t(L, "hello")}, {me.passport_name}!</h1>
        {msg && <div className={`notice ${msg.kind ?? ""}`}>{msg[L]}</div>}

        <h2>{t(L, "my_classes")}</h2>
        {!myEnroll.length && <p className="muted">{t(L, "no_classes")}</p>}
        {myEnroll.map((e) => {
          const c = cls.get(e.class_id);
          if (!c) return null;
          return (
            <div key={e.id} className="card">
              <div className="row">
                <b className="grow">{c.name}</b>
                <span className={`badge ${e.status === "active" ? "ok" : "check"}`}>{t(L, e.status === "active" ? "active" : e.status === "proof" ? "proof_sent" : "applied")}</span>
              </div>
              <p className="muted">{t(L, "schedule")}: {sched(c, L)}</p>
              {e.status === "active" ? (
                <>
                  <JoinButton id={c.id} className="btn primary big" label={`🎥 ${t(L, "join")}`} />
                  <p className="muted" style={{ textAlign: "center" }}>{t(L, "join_hint")}</p>
                </>
              ) : (
                <form action={uploadProof}>
                  <input type="hidden" name="enrollment_id" value={e.id} />
                  <p className="muted">{t(L, "fee")}: {money(c)}</p>
                  <label>{t(L, "upload_proof")}<input className="input" type="file" name="file" accept="image/*,application/pdf" required style={{ paddingTop: 8 }} /></label>
                  <button className="btn primary big">{t(L, "send")}</button>
                </form>
              )}
            </div>
          );
        })}

        {openList.length > 0 && <h2>{t(L, "open_classes")}</h2>}
        {openList.map((c) => {
          const left = c.capacity - (taken.get(c.id) ?? 0);
          return (
            <form key={c.id} action={applyClass} className="card">
              <input type="hidden" name="class_id" value={c.id} />
              <div className="row"><b className="grow">{c.name}</b>{c.level && <span className="badge">{c.level}</span>}</div>
              <p className="muted">
                {t(L, "schedule")}: {sched(c, L)}<br />
                {c.starts_on && <>{c.starts_on}{c.ends_on ? ` ~ ${c.ends_on}` : ""}<br /></>}
                {t(L, "fee")}: {money(c)} · {t(L, "seats")}: {Math.max(left, 0)}/{c.capacity}
              </p>
              <button className="btn primary big" disabled={left <= 0}>{left > 0 ? t(L, "apply") : t(L, "full")}</button>
            </form>
          );
        })}

        <form action="/api/auth/logout" method="post" style={{ marginTop: 32, textAlign: "center" }}>
          <button className="btn small">{t(L, "logout")}</button>
        </form>
      </div>
    </>
  );
}
