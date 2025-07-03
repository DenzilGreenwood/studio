const nextConfig = {
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
  // Enable experimental features for better Genkit support
  experimental: {
    serverComponentsExternalPackages: ['genkit', 'handlebars', '@genkit-ai/core', 'dotprompt'],
  },
  // Ensure proper environment variable handling
  env: {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  },
  // Handle webpack configuration for dependencies
  webpack: (config, { isServer }) => {
    // Resolve the handlebars/webpack compatibility issue
    config.resolve.alias = {
      ...config.resolve.alias,
      handlebars: 'handlebars/dist/handlebars.js',
    };
    
    // Add fallbacks for Node.js modules that aren't available in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
