"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getFlavor } from "../flavors";
import { getSpirit } from "../../spirits/spirits";
import VariantSelection from "./variant-selection";
import { useI18n } from "@/lib/i18n";

function LoadingState() {
  const { t } = useI18n();
  return <main className="flex min-h-dvh items-center justify-center bg-[#080808] px-6 text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/45">{t("preparing")}</main>;
}

function VariantPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const spirit = getSpirit(params.get("spirit") ?? undefined);
  const flavor = getFlavor(params.get("flavor") ?? undefined);

  useEffect(() => {
    if (!spirit) router.replace("/spirits");
    else if (!flavor) router.replace(`/flavors?spirit=${spirit.id}`);
  }, [flavor, router, spirit]);

  if (!spirit || !flavor) return <LoadingState />;
  return <VariantSelection spirit={spirit} flavor={flavor} />;
}

export default function VariantPage() {
  return <Suspense fallback={<LoadingState />}><VariantPageContent /></Suspense>;
}
