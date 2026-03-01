/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // Libera fotos do GitHub
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',    // Libera fotos do Google
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com', // Libera fotos do Firebase Storage
      },
    ],
  },
};

export default nextConfig;