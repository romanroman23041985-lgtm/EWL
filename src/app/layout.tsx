import type { Metadata, Viewport } from "next";
import { AppStoreProvider } from "@/store/app-store";
import "./globals.css";

export const metadata: Metadata = {
  title: "Easy Weight Loss",
  description:
    "Mobile-first nutrition planner with daily macros, calendar history, and profile-based targets.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Easy Weight Loss",
  },
};

export const viewport: Viewport = {
  themeColor: "#fff8f3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-[var(--color-shell)] font-sans text-slate-900 antialiased">
        <AppStoreProvider>{children}</AppStoreProvider>
      </body>
    </html>
  );
}
