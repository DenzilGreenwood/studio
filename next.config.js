/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Allow cross-origin requests from local network IPs during development
  experimental: {
    allowedDevOrigins: [
      '192.168.4.51',
      '192.168.1.*', // Allow all IPs in common local network ranges
      '192.168.0.*',
      '10.0.0.*',
      '172.16.*.*',
      'localhost',
      '127.0.0.1',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Node.js modules from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        process: false,
        'child_process': false,
        'worker_threads': false,
        'perf_hooks': false,
      };
      
      // Ignore specific problematic modules
      config.externals = config.externals || [];
      config.externals.push({
        '@google-cloud/logging': 'commonjs @google-cloud/logging',
        '@google/generative-ai/dist/server/index.js': 'commonjs @google/generative-ai/dist/server/index.js',
        '@grpc/grpc-js': 'commonjs @grpc/grpc-js',
        '@opentelemetry/winston-transport': 'commonjs @opentelemetry/winston-transport',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
