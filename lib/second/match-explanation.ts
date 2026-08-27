import type { FlavorId } from "@/app/flavors/flavors";
import type { SecondProfile } from "./profile";
import type { CocktailSignals, MatchCandidate } from "./match-types";

export type MatchReason = { id: string; en: string; zh: string };

const flavorLabels: Record<FlavorId, { en: string; zh: string }> = {
  sour: { en: "something bright and sour", zh: "明亮偏酸的风味" },
  sweet: { en: "something soft and sweet", zh: "柔和偏甜的风味" },
  bitter: { en: "a more bitter, complex drink", zh: "更苦、更复杂的风味" },
  fruity: { en: "something fruit-forward", zh: "果香更明显的风味" },
  refreshing: { en: "something refreshing", zh: "清爽的风味" },
  bold: { en: "something bold", zh: "浓烈的风味" },
};

export function explainMatch(
  currentUserProfile: SecondProfile,
  candidateProfile: MatchCandidate,
  cocktailSignals: CocktailSignals,
): MatchReason[] {
  const reasons: MatchReason[] = [];
  if (currentUserProfile.energy && currentUserProfile.energy === candidateProfile.energy) {
    reasons.push({ id: "shared-energy", en: "You arrived with the same intention for tonight.", zh: "你们今晚带着相同的状态而来。" });
  } else if (currentUserProfile.energy) {
    reasons.push({ id: "complementary-energy", en: "Your different energies could give the conversation a useful spark.", zh: "你们不同的今晚状态，可能会让对话更有火花。" });
  }

  if (cocktailSignals.flavor === candidateProfile.flavor) {
    const flavor = flavorLabels[cocktailSignals.flavor];
    reasons.push({ id: "shared-flavor", en: `You both chose ${flavor.en}.`, zh: `你们都选择了${flavor.zh}。` });
  } else {
    reasons.push({ id: "contrasting-drinks", en: "Your drinks went in different directions — an easy place to start.", zh: "你们的酒走向不同，这正好是一个轻松的开场。" });
  }

  if (currentUserProfile.mbti && candidateProfile.mbti) {
    const sameSocialRhythm = currentUserProfile.mbti[0] === candidateProfile.mbti[0];
    if (sameSocialRhythm) reasons.push({ id: "shared-social-rhythm", en: "You may share a similar social rhythm in the room.", zh: "你们在现场可能有相近的社交节奏。" });
  }
  return reasons.slice(0, 3);
}
