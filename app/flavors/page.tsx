"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSpirit } from "../spirits/spirits";
import FlavorSelection from "./flavor-selection";
import { useI18n } from "@/lib/i18n";

function RoutingState() {
  const { t } = useI18n();
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[#070707] px-6">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/45">
        {t("openingBar")}
      </p>
    </main>
  );
}

function FlavorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spiritId = searchParams.get("spirit") ?? undefined;
  const selectedSpirit = getSpirit(spiritId);

  useEffect(() => {
    if (!selectedSpirit) router.replace("/spirits");
  }, [router, selectedSpirit]);

  if (!selectedSpirit) return <RoutingState />;

  return <FlavorSelection spirit={selectedSpirit} />;
}

export default function FlavorPage() {
  return (
    <Suspense fallback={<RoutingState />}>
      <FlavorPageContent />
    </Suspense>
  );
}
