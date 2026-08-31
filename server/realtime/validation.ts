import { randomBytes, createHash, randomUUID } from "node:crypto";

const energies = ["open", "curious", "slow", "celebrating"] as const;
const mbtis = ["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"] as const;
const spirits = ["gin", "vodka", "rum", "tequila", "whisky", "brandy"] as const;
const flavors = ["sour", "sweet", "bitter", "fruity", "refreshing", "bold"] as const;

function string(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export type TonightSignals = {
  nickname: string;
  age: number;
  meetingLocation: string;
  ageBand: number;
  energy: (typeof energies)[number];
  mbti?: (typeof mbtis)[number];
  spirit: (typeof spirits)[number];
  flavor: (typeof flavors)[number];
  cocktailId: string;
  cocktailName: string;
};

export function validateTonightSignals(value: unknown): TonightSignals | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const nickname = string(input.nickname, 24);
  const meetingLocation = string(input.meetingLocation, 80);
  const cocktailId = string(input.cocktailId, 128);
  const cocktailName = string(input.cocktailName, 120);
  const age = typeof input.age === "number" && Number.isInteger(input.age) ? input.age : 0;
  const energy = energies.find((item) => item === input.energy);
  const spirit = spirits.find((item) => item === input.spirit);
  const flavor = flavors.find((item) => item === input.flavor);
  const mbti = mbtis.find((item) => item === input.mbti);
  if (!nickname || !meetingLocation || age < 18 || age > 99 || !energy || !spirit || !flavor || !cocktailId || !cocktailName) return null;
  return { nickname, age, meetingLocation, ageBand: Math.floor(age / 5) * 5, energy, ...(mbti ? { mbti } : {}), spirit, flavor, cocktailId, cocktailName };
}

export function createRawSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export { randomUUID };
