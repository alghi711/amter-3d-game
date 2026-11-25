import type { NextConfig } from "next";

const isExport = process.env.IS_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(isExport
    ? {
        output: "export",
        distDir: "dist",
        trailingSlash: true,
      }
    : {
        cacheComponents: true,
        partialPrefetching: true,
      }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
