/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['openweathermap.org'],
  },
}

module.exports = nextConfig 