import type { SimpleIcon } from "simple-icons";

export function BrandIcon({ icon, size = 16 }: { icon: SimpleIcon; size?: number }) {
  return (
    <svg role="img" aria-label={icon.title} viewBox="0 0 24 24" width={size} height={size} fill={`#${icon.hex}`}>
      <path d={icon.path} />
    </svg>
  );
}
