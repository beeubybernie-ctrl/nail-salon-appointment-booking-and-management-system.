import { execSync } from "node:child_process";
import path from "node:path";

const dbUrl = `file:${path.resolve("tests/test.db").replace(/\\/g, "/")}`;
const env = { ...process.env, DATABASE_URL: dbUrl };

execSync("npx prisma db push --skip-generate --force-reset", {
  stdio: "inherit",
  env,
});
execSync("npx tsx tests/availability.test.ts", { stdio: "inherit", env });