import type { FlavorId } from "@/app/flavors/flavors";
import type { SpiritId } from "@/app/spirits/spirits";
import type {
  Mbti,
  SecondProfile,
  TonightEnergy,
  Zodiac,
} from "./profile";

export type MatchCandidate = {
  id: string;
  nickname: string;
  age: number;
  zodiac: Zodiac;
  mbti: Mbti;
  energy: TonightEnergy;
  spirit: SpiritId;
  flavor: FlavorId;
  drink: string;
  oneLine: string;
  opener: string;
};

export const demoMatchPool: readonly MatchCandidate[] = [
  {
    id: "mika",
    nickname: "Mika",
    age: 27,
    zodiac: "Libra",
    mbti: "ENFP",
    energy: "open",
    spirit: "gin",
    flavor: "refreshing",
    drink: "Silver Garden",
    oneLine: "Collects city stories and always notices the best song in the room.",
    opener: "Ask which city they would disappear into for one month.",
  },
  {
    id: "noah",
    nickname: "Noah",
    age: 30,
    zodiac: "Scorpio",
    mbti: "INTJ",
    energy: "curious",
    spirit: "whisky",
    flavor: "bold",
    drink: "Quiet Frequency",
    oneLine: "Builds things by day, hunts for strange little bars after dark.",
    opener: "Ask what idea has been keeping them awake lately.",
  },
  {
    id: "sora",
    nickname: "Sora",
    age: 25,
    zodiac: "Pisces",
    mbti: "INFP",
    energy: "slow",
    spirit: "rum",
    flavor: "sweet",
    drink: "Velvet Tide",
    oneLine: "A quiet observer with a soft spot for films nobody else remembers.",
    opener: "Ask for a film recommendation with no happy ending.",
  },
  {
    id: "alex",
    nickname: "Alex",
    age: 29,
    zodiac: "Gemini",
    mbti: "ENTP",
    energy: "celebrating",
    spirit: "tequila",
    flavor: "sour",
    drink: "Electric Alibi",
    oneLine: "Turns accidental conversations into ambitious weekend plans.",
    opener: "Ask what they would start if failure were impossible.",
  },
  {
    id: "lin",
    nickname: "Lin",
    age: 28,
    zodiac: "Taurus",
    mbti: "ISFJ",
    energy: "open",
    spirit: "brandy",
    flavor: "fruity",
    drink: "Afterglow Orchard",
    oneLine: "Remembers small details and knows where the city feels most human.",
    opener: "Ask which small ritual makes an ordinary week better.",
  },
  {
    id: "jules",
    nickname: "Jules",
    age: 26,
    zodiac: "Aquarius",
    mbti: "ISTP",
    energy: "curious",
    spirit: "vodka",
    flavor: "bitter",
    drink: "Cold Signal",
    oneLine: "Likes precise objects, unexpected detours, and very dry humor.",
    opener: "Ask what they have learned to repair instead of replace.",
  },
] as const;

function scoreCandidate(
  profile: SecondProfile,
  candidate: MatchCandidate,
  spirit: SpiritId,
  flavor: FlavorId,
) {
  let score = 0;
  const reasons: string[] = [];

  if (profile.mbti) {
    if (profile.mbti[0] !== candidate.mbti[0]) {
      score += 4;
      reasons.push("a complementary social rhythm");
    }
    if (profile.mbti[1] === candidate.mbti[1]) {
      score += 3;
      reasons.push("a similar way of reading the room");
    }
  }

  if (profile.zodiac && profile.zodiac === candidate.zodiac) {
    score += 2;
    reasons.push("the same zodiac energy");
  }

  if (profile.energy && profile.energy === candidate.energy) {
    score += 4;
    reasons.push("the same intention for tonight");
  }

  if (candidate.spirit !== spirit) {
    score += 2;
    reasons.push("a different drinking instinct");
  }

  if (candidate.flavor === flavor) {
    score += 3;
    reasons.push("a shared flavor wavelength");
  }

  const ageDistance = profile.age
    ? Math.abs(profile.age - candidate.age)
    : 0;
  if (profile.age && ageDistance <= 5) score += 1;

  return { score, reasons };
}

export function findTonightMatch(
  profile: SecondProfile,
  spirit: SpiritId,
  flavor: FlavorId,
) {
  const ranked = demoMatchPool
    .map((candidate) => ({
      candidate,
      ...scoreCandidate(profile, candidate, spirit, flavor),
    }))
    .sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id));
  const match = ranked[0] ?? {
    candidate: demoMatchPool[0]!,
    reasons: [],
    score: 0,
  };

  return {
    candidate: match.candidate,
    reasons: match.reasons.slice(0, 2),
  };
}
