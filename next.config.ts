import type { NextConfig } from "next";

/**
 * GitHub Pages project sites live at https://<user>.github.io/<repo>/.
 * For abhishek-iiit/CrackPrep set NEXT_PUBLIC_BASE_PATH=/CrackPrep (CI does this).
 * User/org sites (repo named *.github.io) leave it empty.
 */
function resolveBasePath(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
  if (fromEnv === "" || fromEnv === "/") return "";
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (process.env.GITHUB_PAGES === "true" && process.env.GITHUB_REPOSITORY) {
    const repo = process.env.GITHUB_REPOSITORY.split("/")[1] ?? "";
    if (!repo || repo.endsWith(".github.io")) return "";
    return `/${repo}`;
  }

  return "";
}

const basePath = resolveBasePath();

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(basePath
    ? {
        basePath,
        assetPrefix: basePath,
      }
    : {}),
  // Expose to client bundles (search index fetch, etc.).
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
