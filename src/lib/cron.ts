import "server-only";

// Vercel 예약 실행인지 확인: 환경변수 CRON_SECRET 값을 "Authorization: Bearer <값>"으로 붙여 보냄
export function cronOk(req: Request) {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  return !!secret && req.headers.get("authorization") === `Bearer ${secret}`;
}
