import type { Gender, GenderPreference } from "./profile";

export type MatchPreferences = {
  heightCm?: number;
  gender?: Gender;
  preferredGender?: GenderPreference;
  minPartnerHeightCm?: number;
};

function accepts(viewer: MatchPreferences, candidate: MatchPreferences) {
  if (viewer.minPartnerHeightCm && (!candidate.heightCm || candidate.heightCm < viewer.minPartnerHeightCm)) return false;
  if (viewer.preferredGender && viewer.preferredGender !== "any" && candidate.gender !== viewer.preferredGender) return false;
  return true;
}

export function mutuallyMatchesPreferences(first: MatchPreferences, second: MatchPreferences) {
  return accepts(first, second) && accepts(second, first);
}
