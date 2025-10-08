import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',           // 정적 사이트로 내보내기
  images: { unoptimized: true },
};

export default nextConfig;
