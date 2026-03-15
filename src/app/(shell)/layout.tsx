import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { CottageCheeseHelper } from "@/components/cottage-cheese-helper";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-4 pb-[calc(11rem+env(safe-area-inset-bottom))] pt-5">
      <ThemeSwitcher />
      <div className="min-h-[calc(100vh-11rem)]">{children}</div>
      <Suspense fallback={null}>
        <CottageCheeseHelper />
      </Suspense>
      <BottomNav />
    </div>
  );
}
