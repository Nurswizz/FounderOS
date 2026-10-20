import type { SimpleIcon } from "simple-icons";
import { isDarkBrand } from "@/lib/brand";

export function BrandIcon({ icon, size = 16, mono = false }: { icon: SimpleIcon; size?: number; mono?: boolean }) {
  return (
    <svg
      role="img"
      aria-label={icon.title}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={mono ? "currentColor" : `#${icon.hex}`}
      className={!mono && isDarkBrand(icon) ? "dark:fill-zinc-100" : undefined}
    >
      <path d={icon.path} />
    </svg>
  );
}
