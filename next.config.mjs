/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  // iyzipay kendi "resources" klasörünü çalışma zamanında fs.readdirSync
  // ile dinamik okuyor. Next.js bunu webpack ile paketlerse (bundle),
  // gerçek dosya yapısı .next çıktısında bozuluyor ve "ENOENT ... resources"
  // hatası veriyor. Bu ayar, iyzipay'i paketlemeden native require ile
  // kullanmasını sağlıyor — node_modules'teki gerçek dosya yapısı korunur.
  experimental: {
    serverComponentsExternalPackages: ["iyzipay"],
  },
};

export default nextConfig;
