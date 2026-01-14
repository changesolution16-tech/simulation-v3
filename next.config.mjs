/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration for AWS Amplify SSR deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
