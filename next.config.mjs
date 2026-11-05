// next.config.mjs
// Served from the custom domain srisiamthaitherapyandwellness.co.uk, so basePath and assetPrefix stay empty.
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: process.env.NEXT_DIST_DIR || ".next",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
