/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Applies to every route. Deliberately stops short of a strict
        // Content-Security-Policy here: the app embeds a keyless Google
        // Maps iframe (property GPS preview) and an inline theme-detection
        // script in the root layout, both of which a locked-down CSP would
        // need explicit exceptions for. Add one once those are finalized
        // for your deployment domain.
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
