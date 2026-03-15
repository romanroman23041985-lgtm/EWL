import { PlanScreen } from "@/features/plan/plan-screen";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  return <PlanScreen initialDateParam={resolvedSearchParams.date} />;
}
