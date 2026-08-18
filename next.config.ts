import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseUrl
      ? ["trick-media", "profile-media"].map((bucket) => ({
          protocol: supabaseUrl.protocol === "http:" ? "http" : "https",
          hostname: supabaseUrl.hostname,
          port: supabaseUrl.port,
          pathname: `/storage/v1/object/public/${bucket}/**`,
        }))
      : [],
  },
};

export default nextConfig;
