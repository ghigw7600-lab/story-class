import MiniAppLogin from "./MiniAppLogin";

// 봇의 [수업 홈] 버튼이 여는 주소. 텔레그램이 넣어 준 정보로 자동 로그인 후 내 화면으로.
export default async function MiniAppEntry({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const { to } = await searchParams;
  return <MiniAppLogin to={to?.startsWith("/") ? to : ""} />;
}
