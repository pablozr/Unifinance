/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        buffer: false,
        crypto: false,
        stream: false,
        util: false,
      };
    }
    return config;
  },
  // Adicionar configuração para transpilação de módulos
  transpilePackages: ['@supabase/ssr', '@supabase/supabase-js', '@supabase/storage-js'],
};

module.exports = nextConfig;
