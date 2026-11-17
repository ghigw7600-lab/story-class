import Link from "next/link";

export default function AdminTop() {
  return (
    <div className="top">
      <Link href="/admin" style={{ textDecoration: "none" }}><b>STORY CONSULTING · 수업 관리</b></Link>
      <span className="grow" />
      <Link href="/home">학생 화면</Link>
      <form action="/api/auth/logout" method="post"><button className="btn small" style={{ background: "transparent", borderColor: "#fff6" }}>로그아웃</button></form>
    </div>
  );
}
