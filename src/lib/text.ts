// Модели OpenAI с web search иногда вставляют в текст служебные маркеры цитат
// (U+E200 cite U+E202 turn0search0 U+E201). Сопоставить их с URL нельзя — вырезаем.
const CITATION = /\s*[^]*(|$)/g;

export function stripCitations(text: string) {
  return text.replace(CITATION, "").replace(/[-]/g, "");
}

export function stripCitationsDeep<T>(value: T): T {
  if (typeof value === "string") return stripCitations(value) as T;
  if (Array.isArray(value)) return value.map(stripCitationsDeep) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, stripCitationsDeep(v)])) as T;
  }
  return value;
}
