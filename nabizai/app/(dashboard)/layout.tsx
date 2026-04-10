import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      {/* Main content area */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 pb-24 lg:pb-6">{children}</main>
      </div>
    </div>
  );
}
