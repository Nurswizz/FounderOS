import type { Stage } from "./stages";

export type DraftItem = { stage: Stage; title: string; description: string };

export const ROADMAP_TEMPLATE: DraftItem[] = [
  { stage: "IDEA", title: "Сформулировать проблему одним предложением", description: "Кто страдает, от чего и как решает сейчас." },
  { stage: "IDEA", title: "Описать идеального клиента (ICP)", description: "Сегмент, роль, размер компании, где его найти." },
  { stage: "IDEA", title: "Разобрать 5 конкурентов и альтернатив", description: "Цена, позиционирование, слабые места." },
  { stage: "IDEA", title: "Оценить рынок (TAM/SAM/SOM)", description: "Грубая оценка снизу вверх, без красивых цифр." },
  { stage: "IDEA", title: "Сформулировать ключевые гипотезы", description: "Проблема, готовность платить, канал привлечения." },

  { stage: "VALIDATION", title: "Провести 15 проблемных интервью", description: "Спрашивать о прошлом поведении, не продавать." },
  { stage: "VALIDATION", title: "Собрать лендинг с ценностным предложением", description: "Одна страница, один CTA, подключить аналитику." },
  { stage: "VALIDATION", title: "Собрать 50 заявок в лист ожидания", description: "Проверка канала и интереса." },
  { stage: "VALIDATION", title: "Получить первые предоплаты или LOI", description: "Деньги — самый честный сигнал." },
  { stage: "VALIDATION", title: "Решение: продолжать, менять или закрыть", description: "Зафиксировать выводы по гипотезам." },

  { stage: "MVP", title: "Определить минимальный набор функций", description: "Только то, что решает ключевую проблему." },
  { stage: "MVP", title: "Выбрать стек и собрать MVP", description: "No-code, если можно. Срок — недели, не месяцы." },
  { stage: "MVP", title: "Настроить продуктовую аналитику", description: "Активация, удержание, ключевое действие." },
  { stage: "MVP", title: "Запустить закрытую бету с 10 пользователями", description: "Созвоны и наблюдение за использованием." },
  { stage: "MVP", title: "Зарегистрировать компанию и разделить доли", description: "Вестинг для кофаундеров, базовые документы." },

  { stage: "LAUNCH", title: "Определить цену и модель монетизации", description: "Протестировать минимум два ценовых варианта." },
  { stage: "LAUNCH", title: "Подключить приём платежей", description: "Оферта, политика конфиденциальности, чеки." },
  { stage: "LAUNCH", title: "Публичный запуск", description: "Product Hunt, профильные сообщества, личная сеть." },
  { stage: "LAUNCH", title: "Получить первых 10 платящих клиентов", description: "Вручную, не масштабируя." },
  { stage: "LAUNCH", title: "Настроить канал обратной связи", description: "Чат поддержки, регулярные интервью." },

  { stage: "GROWTH", title: "Найти повторяемый канал привлечения", description: "CAC < LTV/3 хотя бы на одном канале." },
  { stage: "GROWTH", title: "Выйти на месячный рост 15–20%", description: "Еженедельный трекинг ключевой метрики." },
  { stage: "GROWTH", title: "Собрать дашборд метрик для инвесторов", description: "MRR, retention, burn, runway." },
  { stage: "GROWTH", title: "Подготовить питч-дек и data room", description: "Финмодель, cap table, юридические документы." },
  { stage: "GROWTH", title: "Нанять первых ключевых сотрудников", description: "Роли, которые разгружают основателя." },
];
