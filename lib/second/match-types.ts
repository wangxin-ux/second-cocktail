import type { FlavorId } from "@/app/flavors/flavors";
import type { SpiritId } from "@/app/spirits/spirits";
import type { Mbti, TonightEnergy, Zodiac } from "./profile";

export type MatchStage =
  | "intro"
  | "consent"
  | "searching"
  | "empty"
  | "candidate"
  | "waiting_for_other"
  | "mutual_match"
  | "meeting_area"
  | "five_minute_connection"
  | "ended"
  | "error";

export type MatchCandidate = {
  id: string;
  nickname: string;
  age: number;
  zodiac?: Zodiac;
  mbti?: Mbti;
  energy: TonightEnergy;
  spirit: SpiritId;
  flavor: FlavorId;
  drink: string;
  personalitySignal: string;
  personalitySignalZh: string;
};

export type CocktailSignals = { name: string; spirit: SpiritId; flavor: FlavorId };
export type MatchAvailability = { onlineCount: number; source: "demo" | "realtime" };
export type MatchSearchResult =
  | { status: "candidate"; candidate: MatchCandidate }
  | { status: "empty" };

export interface MatchService {
  getAvailability(): Promise<MatchAvailability>;
  findCandidate(excludedCandidateIds: readonly string[]): Promise<MatchSearchResult>;
  passCandidate(candidateId: string): Promise<{ otherPartyMessage: "candidate_unavailable" }>;
  acceptCandidate(candidateId: string): Promise<void>;
  waitForMutualAcceptance(candidateId: string): Promise<boolean>;
}
