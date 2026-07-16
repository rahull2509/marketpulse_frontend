/** @type {import('next').NextConfig} */
const nextConfig = {
  // API proxy — route /api/* calls to the FastAPI backend
  // This avoids CORS issues during development and enables
  // seamless migration to Vercel (just change the rewrite target)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
