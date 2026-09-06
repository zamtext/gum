import type {NextConfig} from 'next';

const isGithubPages = process.env.GITHUB_PAGES === 'true' || process.env.BUILD_TARGET === 'static';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  ...(isGithubPages
    ? {
        output: 'export',
        basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
        images: { unoptimized: true },
      }
    : {
        output: 'standalone',
        images: {
          remotePatterns: [
            {
              protocol: 'https',
              hostname: 'picsum.photos',
              port: '',
              pathname: '/**',
            },
          ],
        },
      }),
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
