export const CARD_COLORS = [
  { label: "Slate",   value: "slate",   style: "linear-gradient(135deg, #334155, #0f172a)" },
  { label: "Modrá",   value: "blue",    style: "linear-gradient(135deg, #2563eb, #1e3a8a)" },
  { label: "Zelená",  value: "green",   style: "linear-gradient(135deg, #10b981, #065f46)" },
  { label: "Fialová", value: "purple",  style: "linear-gradient(135deg, #9333ea, #3b0764)" },
  { label: "Červená", value: "red",     style: "linear-gradient(135deg, #f43f5e, #9f1239)" },
  { label: "Zlatá",   value: "gold",    style: "linear-gradient(135deg, #fbbf24, #b45309)" },
];

export function getCardGradient(value?: string | null): string {
  return CARD_COLORS.find((c) => c.value === value)?.style
    ?? "linear-gradient(135deg, #334155, #0f172a)";
}