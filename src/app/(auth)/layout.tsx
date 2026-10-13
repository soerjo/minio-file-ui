import { APP_NAME } from "@/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Login | ${APP_NAME}`,
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
