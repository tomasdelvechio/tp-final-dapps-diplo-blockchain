/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // the project has type errors (e.g. third-party node_modules/ox recursion issues).
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during builds as well to prevent similar blockages
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig
