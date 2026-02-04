import { AppSidebar } from "@/components/layout/app-sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="pl-64">{children}</div>
    </div>
  );
}
