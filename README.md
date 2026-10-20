# FounderOS

Роадмап стартапа по стадиям, хаб критичной информации и трекинг прогресса.

## Запуск

```bash
cp .env.example .env          # заполнить AUTH_SECRET (npx auth secret), AUTH_GITHUB_*, опционально OPENAI_API_KEY
docker compose up -d
npm install
npx prisma migrate dev
npm run dev
npm run worker   # во втором терминале: AI-агенты и расписания
```

GitHub OAuth App: callback `http://localhost:3000/api/auth/callback/github`.

## Тесты

```bash
npm test   # нужен запущенный Postgres: интеграционные тесты создают базу founderos_test
```

Архитектура — [ARCHITECTURE.md](ARCHITECTURE.md).
