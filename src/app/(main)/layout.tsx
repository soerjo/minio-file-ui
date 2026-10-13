import { MainLayout } from "@/components/layouts";
import { ProtectedRoute } from "@/features/auth/hooks";

export default function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <MainLayout>{children}</MainLayout>
    </ProtectedRoute>
  );
}
