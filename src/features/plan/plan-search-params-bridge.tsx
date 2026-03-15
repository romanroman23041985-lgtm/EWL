"use client";

import { useSearchParams } from "next/navigation";
import { PlanScreen } from "@/features/plan/plan-screen";

export function PlanSearchParamsBridge() {
  const searchParams = useSearchParams();

  return <PlanScreen initialDateParam={searchParams.get("date") ?? undefined} />;
}
