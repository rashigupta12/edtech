/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["your-domain.com"],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizeCss: true,
    // Removed fontLoaders - it's not valid in Next.js 15
    // Font optimization is now automatic with next/font
  },
  headers: async () => [
    {
      source: "/api/:path*",
      headers: [
        { key: "Cache-Control", value: "s-maxage=60, stale-while-revalidate=30" },
      ],
    },
  ],
};

export default nextConfig;