/** @type {import('next').NextConfig} */
const api = process.env.CULTURE_API_URL || 'http://127.0.0.1:8580';
const nextConfig = {
  transpilePackages: ['@culture-context/ui', '@culture-context/domain', '@culture-context/sdk'],
  async rewrites() {
    return [
      { source: '/v1/:path*', destination: `${api}/v1/:path*` },
      { source: '/health', destination: `${api}/health` },
    ];
  },
};
export default nextConfig;
