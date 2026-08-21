"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  sanitizeProfile,
  secondProfileStorageKey,
  type SecondProfile,
} from "./profile";

const profileEvent = "second-profile-change";

function subscribe(callback: () => void) {
  window.addEventListener(profileEvent, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(profileEvent, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot() {
  return window.sessionStorage.getItem(secondProfileStorageKey) ?? "";
}

function getServerSnapshot() {
  return "";
}

function subscribeToHydration() {
  return () => undefined;
}

export function notifySecondProfileChange() {
  window.dispatchEvent(new Event(profileEvent));
}

export function useSecondProfile(): {
  profile: SecondProfile;
  isHydrated: boolean;
} {
  const rawProfile = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const profile = useMemo(() => {
    if (!rawProfile) return {};
    try {
      return sanitizeProfile(JSON.parse(rawProfile));
    } catch {
      return {};
    }
  }, [rawProfile]);

  return { profile, isHydrated };
}
