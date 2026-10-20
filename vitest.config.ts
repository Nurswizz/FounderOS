import { defineConfig } from "vitest/config";
import path from "node:path";
import { TEST_DATABASE_URL } from "./test/env";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    include: ["src/**/*.test.ts"],
    globalSetup: ["test/global-setup.ts"],
    env: { DATABASE_URL: TEST_DATABASE_URL, OPENAI_API_KEY: "", OPENAI_AGENTS_DISABLE_TRACING: "1" },
    // Интеграционные тесты делят одну БД.
    fileParallelism: false,
  },
});
