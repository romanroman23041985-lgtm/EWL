"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/today");
  }, [router]);

  return <div className="app-card rounded-[2rem] p-6 text-sm text-slate-500">Перехожу к сегодняшнему дню...</div>;
}
