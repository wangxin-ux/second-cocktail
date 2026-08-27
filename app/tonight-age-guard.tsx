"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { isAgeConfirmed, tonightSessionChangeEvent } from "@/lib/second/tonight-privacy";

export function useAgeConfirmation() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener(tonightSessionChangeEvent, callback);
      return () => window.removeEventListener(tonightSessionChangeEvent, callback);
    },
    isAgeConfirmed,
    () => false,
  );
}

export default function TonightAgeGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const confirmed = useAgeConfirmation();

  useEffect(() => {
    if (pathname !== "/" && !confirmed) router.replace("/");
  }, [confirmed, pathname, router]);

  if (pathname !== "/" && !confirmed) return null;
  return children;
}
