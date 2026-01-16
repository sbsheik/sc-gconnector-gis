import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const allowedParentDomains = [
      "https://marketplace-app.sitecorecloud.io",
      "https://pages.sitecorecloud.io",
      "https://xmapps.sitecorecloud.io",
    ];

    // All domains needed for Google Picker to work
    const trustedDomains = [
      "https://*.google.com",
      "https://*.googleapis.com",
      "https://*.gstatic.com",
      "https://*.googleusercontent.com",
      "https://*.googlevideo.com",
      "https://*.ytimg.com",
      "https://*.ggpht.com",
      "https://*.sitecorecloud.io",
      "https://*.sitecore.io",
    ].join(" ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              `frame-ancestors 'self' ${allowedParentDomains.join(" ")} ${trustedDomains}`,
              `frame-src 'self' ${trustedDomains}`,
              `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${trustedDomains}`,
              `connect-src 'self' ${trustedDomains}`,
              `img-src 'self' data: blob: ${trustedDomains}`,
              `style-src 'self' 'unsafe-inline' ${trustedDomains}`,
              `font-src 'self' data: ${trustedDomains}`,
            ].join("; "),
          }
        ],
      },
    ];
  },
};

export default nextConfig;
