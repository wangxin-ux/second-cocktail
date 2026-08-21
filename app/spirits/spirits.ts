export const spirits = [
  { id: "gin", name: "Gin", profile: "Botanical · Crisp" },
  { id: "vodka", name: "Vodka", profile: "Clean · Smooth" },
  { id: "rum", name: "Rum", profile: "Sweet · Tropical" },
  { id: "tequila", name: "Tequila", profile: "Earthy · Bright" },
  { id: "whisky", name: "Whisky", profile: "Warm · Bold" },
  { id: "brandy", name: "Brandy", profile: "Rich · Velvety" },
] as const;

export type SpiritId = (typeof spirits)[number]["id"];
export type Spirit = (typeof spirits)[number];

export function getSpirit(id: string | undefined) {
  return spirits.find((spirit) => spirit.id === id);
}
