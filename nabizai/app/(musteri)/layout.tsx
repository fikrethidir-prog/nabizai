import type { ReactNode } from "react";

export const metadata = { title: "Müşteri Paneli — nabızai" };

export default function MusteriLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
