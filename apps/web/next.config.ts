import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking — deny all iframe embedding
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Control referrer information leakage
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Enable DNS prefetching for performance
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Force HTTPS for 2 years + subdomains
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Disable unused browser features
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Content Security Policy — strict but functional
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requires unsafe-inline for styles; unsafe-eval only for dev HMR
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      // Allow images from Supabase storage, data URIs (inline SVG), and blob (community images)
      "img-src 'self' blob: data: https://*.supabase.co",
      // Allow connections to Supabase REST + Realtime + YouTube embeds
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "font-src 'self'",
      // Allow YouTube/Vimeo embeds for knowledge articles with video
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
      // Prevent the page from being embedded
      "frame-ancestors 'none'",
      // Only allow forms to submit to self
      "form-action 'self'",
      // Restrict base URI to self
      "base-uri 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
