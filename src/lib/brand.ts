import {
  siAirtable, siAsana, siCalendly, siClickup, siDiscord, siDropbox, siFigma, siFramer, siGithub,
  siGitlab, siGoogle, siGoogleanalytics, siGoogledocs, siGoogledrive, siGooglesheets, siHubspot,
  siJira, siLinear, siLoom, siMiro, siMixpanel, siNotion, siPosthog, siProducthunt, siSupabase,
  siTelegram, siTrello, siVercel, siWebflow, siX, siYcombinator, siYoutube, siZoom,
  type SimpleIcon,
} from "simple-icons";

// Более специфичные домены выше общих (docs.google.com раньше google.com).
const BRANDS: [string, SimpleIcon][] = [
  ["docs.google.com/document", siGoogledocs],
  ["docs.google.com/spreadsheets", siGooglesheets],
  ["drive.google.com", siGoogledrive],
  ["analytics.google.com", siGoogleanalytics],
  ["google.com", siGoogle],
  ["github.com", siGithub],
  ["gitlab.com", siGitlab],
  ["notion.so", siNotion],
  ["notion.site", siNotion],
  ["figma.com", siFigma],
  ["linear.app", siLinear],
  ["atlassian.net", siJira],
  ["trello.com", siTrello],
  ["asana.com", siAsana],
  ["clickup.com", siClickup],
  ["miro.com", siMiro],
  ["airtable.com", siAirtable],
  ["calendly.com", siCalendly],
  ["loom.com", siLoom],
  ["dropbox.com", siDropbox],
  ["framer.com", siFramer],
  ["webflow.com", siWebflow],
  ["vercel.com", siVercel],
  ["supabase.com", siSupabase],
  ["posthog.com", siPosthog],
  ["mixpanel.com", siMixpanel],
  ["hubspot.com", siHubspot],
  ["producthunt.com", siProducthunt],
  ["ycombinator.com", siYcombinator],
  ["discord.com", siDiscord],
  ["discord.gg", siDiscord],
  ["t.me", siTelegram],
  ["youtube.com", siYoutube],
  ["zoom.us", siZoom],
  ["x.com", siX],
  ["twitter.com", siX],
];

export function brandFor(url: string | null | undefined): SimpleIcon | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  const target = host + u.pathname;
  const hit = BRANDS.find(([pattern]) => {
    const [domain] = pattern.split("/");
    const domainOk = host === domain || host.endsWith("." + domain);
    return domainOk && target.startsWith(host + pattern.slice(domain.length));
  });
  return hit?.[1] ?? null;
}

// Почти чёрные лого (GitHub, Notion, X) не видны на тёмном фоне — им нужна инверсия.
export function isDarkBrand(icon: SimpleIcon) {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(icon.hex.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 < 40;
}
