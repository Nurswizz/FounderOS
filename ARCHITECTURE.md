# FounderOS — архитектура

Монолит Next.js 16 (App Router, server actions). Один пользователь = один стартап.

## Слои

```
Next.js (app/: страницы, server actions)        worker.ts (отдельный процесс)
  │  ставит задачи в очередь ──► pg-boss ◄──── забирает задачи, cron-расписания
  └─ lib/                                         └─ lib/agents/runner.ts
       ├─ prisma.ts ──► Postgres (данные + очередь pg-boss в схеме pgboss)
       ├─ roadmap-ai.ts ──► OpenAI API (fallback: roadmap-template.ts)
       ├─ agents/ ──► OpenAI Agents SDK (@openai/agents) ──► OpenAI API, web search
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
| `agents/` | Команда AI-агентов, см. ниже |
| `queue.ts` | pg-boss: продюсер (Next) и воркер, `enqueueRun` |
| `startup.ts` | Валидация профиля стартапа (онбординг, настройки) |
| `session.ts` | `requireUserId` / `requireStartup` — защита страниц и actions |

Все мутации — `src/app/actions.ts`, каждая проверяет сессию и фильтрует по `startupId`.

## Команда AI-агентов (`lib/agents`)
- Агент = файл с `AgentDef` (инструкции, tools, расписание): `chief-of-staff.ts`, `market-researcher.ts`, `customer-discovery.ts`, `cto.ts`; реестр — `index.ts`.
- `tools.ts` — tools для SDK, тонкие обёртки над `ops.ts` (доступ к данным, всегда со `startupId` из контекста запуска).
- `runner.ts` — выполняет `AgentRun`: контекст стартапа + бриф → `run()` SDK в режиме стрима. Шаги пишет в `AgentStep`, живой статус — в `AgentRun.activity` (что делает сейчас) и `AgentRun.draft` (ответ по ходу генерации). Источники: хуки инструментов и сырые события OpenAI (`steps.ts::rawEventActivity` — веб-поиск, размышление), записи идут одной очередью. UI опрашивает раз в секунду.
- Внешние действия (GitHub issue, комментарий к PR) не выполняются агентом: создаётся `PendingAction`, после одобрения в `/inbox` его исполняет `pending.ts`.
- Делегирование: Chief of Staff создаёт дочерний `AgentRun` (`parentRunId`) и ставит его в очередь.
- Расписание: cron агента регистрирует воркер; по тику создаются запуски для стартапов с включённым `AgentSetting`.
- Новый агент: значение в enum `AgentKey` → файл с `AgentDef` → строка в `AGENTS` → иконка в `components/agent-ui.tsx`.

## Идейный скаут (`lib/ideas`)
- Для основателя без идеи: чат `/ideas` (до создания стартапа, данные привязаны к `User`).
- `scout.ts` — агент (web search + tool `save_idea` → `IdeaCandidate`), `turn.ts` — один ход диалога в воркере (очередь `idea-turn`): история SDK хранится в `IdeaSession.history`, текст ответа и текущее действие пишутся в `IdeaMessage` по ходу стрима, UI опрашивает.
- «Выбрать» → `/onboarding?idea=…` с предзаполненной формой; при создании стартапа исследование сохраняется в хаб.

## Данные (Prisma)
`User/Account/Session` (Auth.js) → `Startup` → `RoadmapItem`, `HubEntry`, `Metric` (снапшоты), `Integration` (config JSON), `AgentRun` → `AgentStep`, `PendingAction`; `AgentSetting` (расписания). `User` → `IdeaSession` → `IdeaMessage`, `IdeaCandidate`. Токен GitHub берётся из `Account`, собственные секреты не храним.

## Инфраструктура
- Postgres 17 — `docker-compose.yml` (порт 5442).
- Процессы: `next` (веб) и `npm run worker` (агенты, очередь и cron на pg-boss).
- Внешние: GitHub OAuth + REST API, OpenAI API (роадмап, агенты, web search).
- UI: Tailwind 4, `lucide-react` (иконки), `simple-icons` (лого брендов).

## UI-состояния
- Загрузка страниц — `loading.tsx` в каждом роуте `(app)` со скелетонами (`components/skeleton.tsx`).
- Формы — `SubmitButton` / `IconAction` (`components/submit-button.tsx`, `useFormStatus`): спиннер и блокировка на время action.
- Отметка задач — `useOptimistic` в `roadmap-item.tsx`, UI меняется до ответа сервера.
- Тема — `next-themes` (класс `.dark`, выбор в localStorage), переключатель `components/theme-toggle.tsx`. Тёмные лого брендов инвертируются (`isDarkBrand`).
- Навигация — `useLinkStatus` в `nav-link.tsx`. Анимации (`fade-up`, `grow`) в `globals.css`, только под `motion-safe`.

## Новая интеграция
Значение в enum `Provider` → файл `lib/integrations/<name>.ts` → строка в `INTEGRATIONS`.
