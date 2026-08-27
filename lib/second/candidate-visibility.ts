import type { MatchCandidate } from "./match-types";
import type { MatchReason } from "./match-explanation";
import type { OpeningPrompt } from "./opening-prompt";

export type CandidatePreview = {
  nickname: string;
  age: number;
  energy: MatchCandidate["energy"];
  personalitySignal: string;
  personalitySignalZh: string;
  reasons: readonly MatchReason[];
  openingPrompt: OpeningPrompt;
};

export function projectCandidatePreview(
  candidate: MatchCandidate,
  reasons: readonly MatchReason[],
  openingPrompt: OpeningPrompt,
): CandidatePreview {
  return {
    nickname: candidate.nickname,
    age: candidate.age,
    energy: candidate.energy,
    personalitySignal: candidate.personalitySignal,
    personalitySignalZh: candidate.personalitySignalZh,
    reasons,
    openingPrompt,
  };
}
