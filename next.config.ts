/** @type {import('next').NextConfig} */
const nextConfig = {
  // API proxy — route /api/* calls to the FastAPI backend
  // This avoids CORS issues during development and enables
  // seamless migration to Vercel (just change the BACKEND_URL environment variable)
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
