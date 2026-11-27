import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-5 py-12 sm:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute -left-28 -top-36 h-96 w-96 rounded-full bg-indigo-100/70 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-violet-100/60 blur-3xl" />
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center text-slate-950">
          <span className="text-brand font-semibold tracking-tight">Nexora</span>
        </Link>
        <Card className="gap-0 border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-slate-200/60 backdrop-blur sm:p-8">
          {children}
        </Card>
      </div>
    </main>
  );
}
