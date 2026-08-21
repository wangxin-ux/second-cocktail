export const flavors = [
  {
    id: "sour",
    name: "Sour",
    description: "Bright · Citrus",
    glow: "rgba(208, 218, 139, 0.3)",
  },
  {
    id: "sweet",
    name: "Sweet",
    description: "Smooth · Indulgent",
    glow: "rgba(211, 139, 135, 0.28)",
  },
  {
    id: "bitter",
    name: "Bitter",
    description: "Complex · Grown-up",
    glow: "rgba(154, 119, 91, 0.32)",
  },
  {
    id: "fruity",
    name: "Fruity",
    description: "Juicy · Aromatic",
    glow: "rgba(156, 94, 123, 0.3)",
  },
  {
    id: "refreshing",
    name: "Refreshing",
    description: "Light · Crisp",
    glow: "rgba(115, 170, 167, 0.28)",
  },
  {
    id: "bold",
    name: "Bold",
    description: "Strong · Intense",
    glow: "rgba(142, 76, 57, 0.34)",
  },
] as const;

export type FlavorId = (typeof flavors)[number]["id"];

export function getFlavor(id: string | undefined) {
  return flavors.find((flavor) => flavor.id === id);
}
