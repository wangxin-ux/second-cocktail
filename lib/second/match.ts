import type { FlavorId } from "@/app/flavors/flavors";
import type { SpiritId } from "@/app/spirits/spirits";
import { demoMatchPool } from "./demo-match-service";
import type { MatchCandidate } from "./match-types";
import type { SecondProfile } from "./profile";

function scoreCandidate(profile: SecondProfile, candidate: MatchCandidate, spirit: SpiritId, flavor: FlavorId) {
  let score = 0;
  if (profile.energy && profile.energy === candidate.energy) score += 4;
  if (candidate.flavor === flavor) score += 3;
  if (candidate.spirit !== spirit) score += 2;
  if (profile.mbti && profile.mbti[0] === candidate.mbti?.[0]) score += 2;
  if (profile.age && Math.abs(profile.age - candidate.age) <= 5) score += 1;
  return score;
}

export function rankDemoCandidates(profile: SecondProfile, spirit: SpiritId, flavor: FlavorId) {
  return [...demoMatchPool].sort((a, b) =>
    scoreCandidate(profile, b, spirit, flavor) - scoreCandidate(profile, a, spirit, flavor)
    || a.id.localeCompare(b.id),
  );
}
