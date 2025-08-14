/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOW-FROM https://converse-staging.spyne.xyz'
          }
        ]
      }
    ]
  }
}

export default nextConfig
