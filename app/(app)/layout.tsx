import { requireUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUser();
  return (
    <div className="shell">
      <Sidebar role={u.role} name={u.fullName || u.email || "Account"} />
      <div className="main">{children}</div>
    </div>
  );
}
