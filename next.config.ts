import type { NextConfig } from "next";

// GitHub Pages では https://masa0980-sudo.github.io/typing_quotes/ のように
// リポジトリ名がサブパスになるため、GitHub Actions のビルド時だけ basePath を付ける。
// ローカル開発時は空のままなので http://localhost:3000/ で普段通り確認できる。
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoName = "typing_quotes";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGithubPages ? `/${repoName}` : "",
  assetPrefix: isGithubPages ? `/${repoName}/` : "",
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: isGithubPages ? `/${repoName}` : "" },
};

export default nextConfig;
