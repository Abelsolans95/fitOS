export interface MarketplaceProduct {
  id: string;
  trainer_id: string;
  title: string;
  description: string;
  price_cents: number;
  currency: string;
  category: string;
  cover_image_url: string | null;
  downloads: number;
  created_at: string;
  trainer_name: string;
}

export const MARKETPLACE_CATEGORIES = [
  { value: "hipertrofia", label: "Hipertrofia" },
  { value: "fuerza", label: "Fuerza" },
  { value: "perdida_peso", label: "Perdida de peso" },
  { value: "funcional", label: "Funcional" },
  { value: "calistenia", label: "Calistenia" },
  { value: "otro", label: "Otro" },
] as const;

export type MarketplaceCategory = (typeof MARKETPLACE_CATEGORIES)[number]["value"];

export function formatPrice(cents: number, currency: string): string {
  if (cents === 0) return "Gratis";
  const amount = (cents / 100).toFixed(2);
  const symbol = currency === "EUR" ? "\u20AC" : currency === "USD" ? "$" : currency;
  return `${amount}${symbol}`;
}

export function categoryLabel(value: string): string {
  const found = MARKETPLACE_CATEGORIES.find((c) => c.value === value);
  return found?.label ?? value;
}
