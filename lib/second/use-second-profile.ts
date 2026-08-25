"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  readSecondProfileRaw,
  sanitizeProfile,
  secondProfileCookieKey,
  secondProfileStorageKey,
  writeTemporaryCookie,
  type SecondProfile,
} from "./profile";

const profileEvent = "second-profile-change";

function subscribe(callback: () => void) {
  const interval = window.setInterval(callback, 1000);
  window.addEventListener(profileEvent, callback);
  window.addEventListener("storage", callback);
  window.addEventListener("focus", callback);
  return () => {
    window.clearInterval(interval);
    window.removeEventListener(profileEvent, callback);
    window.removeEventListener("storage", callback);
    window.removeEventListener("focus", callback);
  };
}

function getSnapshot() {
  return readSecondProfileRaw();
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
  useEffect(() => {
    if (readSecondProfileRaw()) return;
    const legacy = window.sessionStorage.getItem(secondProfileStorageKey);
    if (!legacy) return;
    writeTemporaryCookie(secondProfileCookieKey, legacy);
    window.sessionStorage.removeItem(secondProfileStorageKey);
    window.dispatchEvent(new Event(profileEvent));
  }, []);
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
