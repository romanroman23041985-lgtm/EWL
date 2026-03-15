import { BottomNav } from "@/components/bottom-nav";

export default function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-5">
      <div className="min-h-[calc(100vh-8rem)]">{children}</div>
      <BottomNav />
    </div>
  );
}
