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

## UI-состояния
- Загрузка страниц — `loading.tsx` в каждом роуте `(app)` со скелетонами (`components/skeleton.tsx`).
- Формы — `SubmitButton` / `IconAction` (`components/submit-button.tsx`, `useFormStatus`): спиннер и блокировка на время action.
- Отметка задач — `useOptimistic` в `roadmap-item.tsx`, UI меняется до ответа сервера.
- Тема — `next-themes` (класс `.dark`, выбор в localStorage), переключатель `components/theme-toggle.tsx`. Тёмные лого брендов инвертируются (`isDarkBrand`).
- Навигация — `useLinkStatus` в `nav-link.tsx`. Анимации (`fade-up`, `grow`) в `globals.css`, только под `motion-safe`.

## Новая интеграция
Значение в enum `Provider` → файл `lib/integrations/<name>.ts` → строка в `INTEGRATIONS`.
