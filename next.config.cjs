/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
        'async_hooks': false,
        'dgram': false,
        'diagnostics_channel': false,
        'http2': false,
        'dns': false,
        'http': false,
        'https': false,
        'url': false,
        'querystring': false,
        'path': false,
        'os': false,
      };
      
      // Ignore specific problematic modules
      config.externals = config.externals || [];
      config.externals.push({
        '@google-cloud/logging': 'commonjs @google-cloud/logging',
        '@google/generative-ai/dist/server/index.js': 'commonjs @google/generative-ai/dist/server/index.js',
        '@grpc/grpc-js': 'commonjs @grpc/grpc-js',
        '@opentelemetry/winston-transport': 'commonjs @opentelemetry/winston-transport',
        'genkit': 'commonjs genkit',
        '@genkit-ai/core': 'commonjs @genkit-ai/core',
        '@genkit-ai/firebase': 'commonjs @genkit-ai/firebase',
        '@genkit-ai/google-cloud': 'commonjs @genkit-ai/google-cloud',
        '@opentelemetry/context-async-hooks': 'commonjs @opentelemetry/context-async-hooks',
        '@opentelemetry/sdk-trace-node': 'commonjs @opentelemetry/sdk-trace-node',
        '@opentelemetry/sdk-node': 'commonjs @opentelemetry/sdk-node',
        '@opentelemetry/exporter-jaeger': 'commonjs @opentelemetry/exporter-jaeger',
        '@opentelemetry/instrumentation-undici': 'commonjs @opentelemetry/instrumentation-undici',
        'googleapis-common': 'commonjs googleapis-common',
      });

      // Prevent bundling of AI flows on client side
      config.module = config.module || {};
      config.module.rules = config.module.rules || [];
      config.module.rules.push({
        test: /src\/ai\/flows\/.*\.ts$/,
        use: 'ignore-loader',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
