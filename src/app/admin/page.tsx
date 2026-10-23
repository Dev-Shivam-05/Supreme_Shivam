import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/admin-app";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  // No top padding: /admin renders without the public nav, so the deck owns the
  // whole viewport (see components/layout/chrome.tsx).
  return <AdminApp />;
}
