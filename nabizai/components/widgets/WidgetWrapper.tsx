"use client";
import { ReactNode } from "react";

export default function WidgetWrapper({
  title, icon, children, loading, colSpan = 1,
}: {
  title: string; icon: string; children: ReactNode;
  loading?: boolean; colSpan?: number;
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${colSpan === 2 ? "md:col-span-2" : ""}`}>
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50/50">
        <span className="text-lg">{icon}</span>
        <h3 className="font-bold text-sm text-nabiz-dark">{title}</h3>
      </div>
      <div className="p-4 min-h-[160px]">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-nabiz-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : children}
      </div>
    </div>
  );
}
