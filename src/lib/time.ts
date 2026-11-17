// 반 시간대(기본 타슈켄트) 기준 날짜·요일·분
export function zoned(tz: string, d = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" })
      .formatToParts(d).map((p) => [p.type, p.value]),
  );
  const wd = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(parts.weekday) + 1; // 1=월 … 7=일
  return { date: `${parts.year}-${parts.month}-${parts.day}`, weekday: wd, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

export const toMin = (t?: string | null) => (t ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) : null);
export const hhmm = (t?: string | null) => (t ? t.slice(0, 5) : "");

// [수업 들어가기]를 누른 때가 출석·지각·수업 외 중 무엇인지
// 출석: 시작 30분 전 ~ 시작 10분 / 지각: 시작 10분 뒤 ~ 끝 / 그 밖(요일·시간이 아님): 수업 외
export function attendState(c: { days: number[]; start_time: string | null; minutes: number; tz: string }, now = new Date()) {
  const z = zoned(c.tz, now);
  const start = toMin(c.start_time);
  if (start == null || !c.days.includes(z.weekday)) return { date: z.date, state: "outside" as const };
  if (z.minutes < start - 30 || z.minutes > start + c.minutes) return { date: z.date, state: "outside" as const };
  return { date: z.date, state: z.minutes > start + 10 ? ("late" as const) : ("present" as const) };
}

export const DAY_KO = ["", "월", "화", "수", "목", "금", "토", "일"];
export const DAY_UZ = ["", "Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
