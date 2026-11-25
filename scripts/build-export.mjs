import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const apiDir = path.join(root, "src/app/api");
const apiBackup = path.join(root, ".temp_api_backup");
const mwFile = path.join(root, "src/middleware.ts");
const mwBackup = path.join(root, ".temp_middleware_backup.ts");

try {
  if (fs.existsSync(apiDir)) {
    fs.renameSync(apiDir, apiBackup);
  }
  if (fs.existsSync(mwFile)) {
    fs.renameSync(mwFile, mwBackup);
  }
  if (fs.existsSync(path.join(root, ".next"))) {
    fs.rmSync(path.join(root, ".next"), { recursive: true, force: true });
  }
  if (fs.existsSync(path.join(root, "dist"))) {
    fs.rmSync(path.join(root, "dist"), { recursive: true, force: true });
  }

  console.log("Building static export for Wasmer Edge...");
  execSync("npm run build", {
    stdio: "inherit",
    env: { ...process.env, IS_EXPORT: "true" },
  });
  console.log("Static export successfully built in dist/!");
} finally {
  if (fs.existsSync(apiBackup)) {
    fs.renameSync(apiBackup, apiDir);
  }
  if (fs.existsSync(mwBackup)) {
    fs.renameSync(mwBackup, mwFile);
  }
}
