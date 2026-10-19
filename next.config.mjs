/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: [
    "192.168.1.46",
    "192.168.1.46:3001",
    "localhost:3001",
    "flammable-thank-jurist.ngrok-free.dev",
    "*.ngrok-free.dev",
    "techwhizz.onrender.com",
    "*.onrender.com"
  ],
};

export default nextConfig;
