import { requireRole } from "@/lib/auth";
import { STAFF } from "@/lib/roles";
import { supabaseServer } from "@/lib/supabase/server";
import TripBuilderForm from "@/components/TripBuilderForm";

export const dynamic = "force-dynamic";

export default async function NewTrip({ searchParams }: { searchParams: { client?: string } }) {
  await requireRole(STAFF);
  const sb = supabaseServer();
  const { data: clients } = await sb
    .from("clients").select("id,first_name,last_name,email").order("first_name");
  return (
    <TripBuilderForm
      clients={(clients || []).map((c) => ({ id: c.id, name: `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.email || "Client" }))}
      preselect={searchParams.client || ""}
    />
  );
}
