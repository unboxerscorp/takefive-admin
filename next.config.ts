import type { NextConfig } from "next";

const build = process.env.BUILD ? true : false;

const nextConfig: NextConfig = {
  serverExternalPackages: ["tunnel-ssh"],
  distDir: build ? "./out" : "./.next",
};

export default nextConfig;
