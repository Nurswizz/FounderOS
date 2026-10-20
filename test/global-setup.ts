import { execSync } from "node:child_process";
import { Client } from "pg";
import { TEST_DATABASE_URL } from "./env";

export default async function setup() {
  const admin = new Client({ connectionString: TEST_DATABASE_URL.replace(/\/[^/]+$/, "/postgres") });
  await admin.connect();
  const { rowCount } = await admin.query("SELECT 1 FROM pg_database WHERE datname = 'founderos_test'");
  if (!rowCount) await admin.query("CREATE DATABASE founderos_test");
  await admin.end();

  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "ignore",
  });
}
