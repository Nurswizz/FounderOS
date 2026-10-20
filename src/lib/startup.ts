const LIMITS = { name: 80, industry: 80, description: 4000 };

const field = (form: FormData, key: keyof typeof LIMITS) => {
  const v = form.get(key);
  return typeof v === "string" ? v.trim().slice(0, LIMITS[key]) : "";
};

// Профиль стартапа из формы онбординга или настроек.
export function parseStartupProfile(form: FormData) {
  const name = field(form, "name");
  const description = field(form, "description");
  if (!name || !description) return null;
  return { name, description, industry: field(form, "industry") || null };
}
