import "@/app/globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KMENT ERP",
  description: "사내 거래처 · 계약 · 관리업무 관리를 위한 ERP",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko" className={inter.className}>
      <body className="bg-background text-slate-900">{children}</body>
    </html>
  );
}
