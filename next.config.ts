import type { NextConfig } from "next";

const isGitHubActionsBuild = process.env.GITHUB_ACTIONS === "true";
const repositoryBasePath = "/PurpleOS";

const nextConfig: NextConfig = {
  output: isGitHubActionsBuild ? "export" : undefined,
  trailingSlash: isGitHubActionsBuild,
  images: {
    unoptimized: true,
  },
  basePath: isGitHubActionsBuild ? repositoryBasePath : "",
  assetPrefix: isGitHubActionsBuild ? `${repositoryBasePath}/` : undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: isGitHubActionsBuild ? repositoryBasePath : "",
  },
};

export default nextConfig;
