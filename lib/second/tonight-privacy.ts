import { cocktailSessionStorageKey, tonightSeedStorageKey } from "@/lib/cocktails/tonight-session";
import { secondProfileStorageKey } from "./profile";

export const ageConfirmationStorageKey = "second:age-confirmed:v1";
export const blockedCandidatesStorageKey = "second:blocked-candidates:v1";
export const currentMatchStorageKey = "second:current-match:v1";
export const dismissedEndedPairStorageKey = "second:dismissed-ended-pair:v1";
export const tonightSessionChangeEvent = "second-tonight-session-change";

export type CurrentMatchSnapshot = {
  stage: string;
  candidateId?: string;
  meetingAreaId?: string;
};

function notifyTonightSessionChange() {
  window.dispatchEvent(new Event(tonightSessionChangeEvent));
}

export function isAgeConfirmed() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(ageConfirmationStorageKey) === "yes";
}

export function confirmAgeForTonight() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ageConfirmationStorageKey, "yes");
  notifyTonightSessionChange();
}

export function readBlockedCandidateIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(blockedCandidatesStorageKey) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function blockCandidateForTonight(candidateId: string) {
  if (typeof window === "undefined") return;
  const next = Array.from(new Set([...readBlockedCandidateIds(), candidateId]));
  window.sessionStorage.setItem(blockedCandidatesStorageKey, JSON.stringify(next));
  notifyTonightSessionChange();
}

export function writeCurrentMatchSnapshot(snapshot: CurrentMatchSnapshot) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(currentMatchStorageKey, JSON.stringify(snapshot));
}

export function clearCurrentMatchSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(currentMatchStorageKey);
  notifyTonightSessionChange();
}

export function dismissEndedPair(pairId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(dismissedEndedPairStorageKey, pairId);
}

export function wasEndedPairDismissed(pairId: string | undefined) {
  if (typeof window === "undefined" || !pairId) return false;
  return window.sessionStorage.getItem(dismissedEndedPairStorageKey) === pairId;
}

export function clearTonightSession() {
  if (typeof window === "undefined") return;
  [
    secondProfileStorageKey,
    cocktailSessionStorageKey,
    tonightSeedStorageKey,
    ageConfirmationStorageKey,
    blockedCandidatesStorageKey,
    currentMatchStorageKey,
    dismissedEndedPairStorageKey,
  ].forEach((key) => window.sessionStorage.removeItem(key));
  window.dispatchEvent(new Event("second-profile-change"));
  notifyTonightSessionChange();
}
