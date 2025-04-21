/** @type {import('next').NextConfig} */

process.env.NEXT_PUBLIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "";
process.env.NEXT_PUBLIC_PORT = process.env.PORT || 3000;

const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_API_BASE_URL,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9000"
        }/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
