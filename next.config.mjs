/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'quatermaster-coral.vercel.app'],
    },
  },
  serverExternalPackages: ['better-sqlite3', '@modelcontextprotocol/sdk'],
  transpilePackages: ['@splinetool/react-spline', '@splinetool/runtime'],
};

export default nextConfig;
