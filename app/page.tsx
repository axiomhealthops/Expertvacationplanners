import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { homeFor } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function Root() {
  const u = await getSessionUser();
  if (!u) redirect("/login");
  redirect(homeFor(u.role));
}
