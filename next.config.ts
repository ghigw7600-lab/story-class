import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // 입금 사진(폰 사진) 올리기 — 기본 1MB라 늘림
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
