import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  images: {
    unoptimized: true,
  },
};

if (process.env.NEXT_PUBLIC_MATCH_MODE === "demo") {
  const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
  nextConfig.output = "export";
  nextConfig.trailingSlash = true;
  nextConfig.basePath = process.env.GITHUB_ACTIONS && repositoryName ? `/${repositoryName}` : undefined;
}

export default nextConfig;
