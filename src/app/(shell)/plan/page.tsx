import { Suspense } from "react";
import { PlanScreen } from "@/features/plan/plan-screen";
import { PlanSearchParamsBridge } from "@/features/plan/plan-search-params-bridge";

export default function PlanPage() {
  return (
    <Suspense fallback={<PlanScreen />}>
      <PlanSearchParamsBridge />
    </Suspense>
  );
}
