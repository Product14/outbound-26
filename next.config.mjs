/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://converse-staging.spyne.xyz https://*.spyne.xyz https://spyne.xyz"
          }
        ]
      }
    ]
  }
}

export default nextConfig
