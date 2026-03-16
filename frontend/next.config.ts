import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@cosmic-engine/shared', 'three'],
  turbopack: {
    rules: {
      '*.glsl': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
  webpack(config) {
    // GLSL shader loader (production build uses webpack)
    config.module.rules.push({
      test: /\.glsl$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
