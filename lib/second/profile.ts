export const zodiacOptions = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

export const mbtiOptions = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
] as const;

export const energyOptions = [
  { id: "open", label: "Open to something new" },
  { id: "curious", label: "Curious & observant" },
  { id: "slow", label: "Taking it slow" },
  { id: "celebrating", label: "Here to celebrate" },
] as const;

export type Zodiac = (typeof zodiacOptions)[number];
export type Mbti = (typeof mbtiOptions)[number];
export type TonightEnergy = (typeof energyOptions)[number]["id"];

export type SecondProfile = {
  nickname?: string;
  age?: number;
  zodiac?: Zodiac;
  mbti?: Mbti;
  energy?: TonightEnergy;
};

export const secondProfileStorageKey = "second:profile:v1";

function optionalNumber(value: unknown, min: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const rounded = Math.round(value);
  return rounded >= min && rounded <= max ? rounded : undefined;
}

export function sanitizeProfile(value: unknown): SecondProfile {
  if (typeof value !== "object" || value === null) return {};
  const profile = value as Record<string, unknown>;
  const nickname =
    typeof profile.nickname === "string"
      ? profile.nickname.trim().slice(0, 24)
      : "";
  const zodiac = zodiacOptions.find((item) => item === profile.zodiac);
  const mbti = mbtiOptions.find((item) => item === profile.mbti);
  const energy = energyOptions.find((item) => item.id === profile.energy)?.id;

  return {
    ...(nickname ? { nickname } : {}),
    ...(optionalNumber(profile.age, 18, 99) !== undefined
      ? { age: optionalNumber(profile.age, 18, 99) }
      : {}),
    ...(zodiac ? { zodiac } : {}),
    ...(mbti ? { mbti } : {}),
    ...(energy ? { energy } : {}),
  };
}

export function readSecondProfile(): SecondProfile {
  if (typeof window === "undefined") return {};

  try {
    const stored = window.sessionStorage.getItem(secondProfileStorageKey);
    return stored ? sanitizeProfile(JSON.parse(stored)) : {};
  } catch {
    return {};
  }
}

export function writeSecondProfile(profile: SecondProfile) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    secondProfileStorageKey,
    JSON.stringify(sanitizeProfile(profile)),
  );
  window.dispatchEvent(new Event("second-profile-change"));
}

function fnv1a(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function profileSignature(profile: SecondProfile) {
  const ageBand = profile.age ? Math.floor(profile.age / 5) * 5 : "x";
  const signal = [
    ageBand,
    profile.zodiac ?? "x",
    profile.mbti ?? "x",
    profile.energy ?? "x",
  ].join("|");

  return fnv1a(signal);
}

export function cocktailProfileSignature(profile: SecondProfile) {
  return fnv1a([profile.energy ?? "x", profile.mbti ?? "x"].join("|"));
}

const zodiacElements: Record<Zodiac, string> = {
  Aries: "Fire",
  Taurus: "Earth",
  Gemini: "Air",
  Cancer: "Water",
  Leo: "Fire",
  Virgo: "Earth",
  Libra: "Air",
  Scorpio: "Water",
  Sagittarius: "Fire",
  Capricorn: "Earth",
  Aquarius: "Air",
  Pisces: "Water",
};

export function profileAura(profile: SecondProfile) {
  const traits: string[] = [];
  if (profile.mbti) {
    traits.push(profile.mbti.startsWith("I") ? "Introspective" : "Magnetic");
  }
  if (profile.zodiac) traits.push(zodiacElements[profile.zodiac]);
  if (profile.energy) {
    traits.push(
      {
        open: "Open",
        curious: "Curious",
        slow: "Unhurried",
        celebrating: "Electric",
      }[profile.energy],
    );
  }
  return traits.slice(0, 2);
}

export function completedProfileFields(profile: SecondProfile) {
  return Object.values(profile).filter(
    (value) => value !== undefined && value !== "",
  ).length;
}
