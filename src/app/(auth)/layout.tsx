import { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 text-slate-800">
      <header className="flex items-center justify-between bg-brand-dark px-10 py-6 text-white">
        <div className="text-lg font-semibold tracking-wide">KMENT</div>
        <div className="text-sm text-white/70">{formattedDate}</div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12 md:px-8">
        <div className="w-full" style={{ maxWidth: "1440px" }}>
          {children}
        </div>
      </main>
      <footer className="bg-brand-dark px-4 py-5 text-xs text-white/50">
        © KMENT Corp.
      </footer>
    </div>
  );
}
