# FounderOS — архитектура

Монолит Next.js 16 (App Router, server actions). Один пользователь = один стартап.

## Слои

```
app/ (страницы, server actions)
  └─ lib/ (доменная логика, чистые функции)
       ├─ prisma.ts ──► Postgres
       ├─ roadmap-ai.ts ──► OpenAI API (fallback: roadmap-template.ts)
       └─ integrations/ ──► GitHub API
auth.ts (Auth.js, GitHub OAuth, сессии в БД)
```

## Модули `src/lib`
| Модуль | Назначение |
|---|---|
| `stages.ts` | Стадии стартапа (IDEA → GROWTH), подписи |
| `onboarding.ts` | Опросник → стадия (`detectStage`) |
| `roadmap-template.ts` | Статический роадмап по стадиям |
| `roadmap-ai.ts` | Персональный роадмап через OpenAI (structured output); без ключа/при ошибке — шаблон |
| `progress.ts` | % по стадиям, текущая стадия, следующие шаги |
| `metrics.ts` | Группировка снапшотов метрик |
| `brand.ts` | URL → лого сервиса (simple-icons) |
| `integrations/` | `index.ts` — реестр `Provider → sync`; `github.ts` — коммиты, issues, звёзды |
| `session.ts` | `requireUserId` / `requireStartup` — защита страниц и actions |

Все мутации — `src/app/actions.ts`, каждая проверяет сессию и фильтрует по `startupId`.

## Данные (Prisma)
`User/Account/Session` (Auth.js) → `Startup` → `RoadmapItem`, `HubEntry`, `Metric` (снапшоты), `Integration` (config JSON). Токен GitHub берётся из `Account`, собственные секреты не храним.

## Инфраструктура
- Postgres 17 — `docker-compose.yml` (порт 5442).
- Внешние: GitHub OAuth + REST API, OpenAI API (опционально).
- UI: Tailwind 4, `lucide-react` (иконки), `simple-icons` (лого брендов).

## Новая интеграция
Значение в enum `Provider` → файл `lib/integrations/<name>.ts` → строка в `INTEGRATIONS`.
