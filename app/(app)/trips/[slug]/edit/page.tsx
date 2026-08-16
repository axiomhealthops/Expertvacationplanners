import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { STAFF } from "@/lib/roles";
import { supabaseServer } from "@/lib/supabase/server";
import { updateTrip } from "@/lib/actions/trips";
import TripBuilderForm from "@/components/TripBuilderForm";

export const dynamic = "force-dynamic";

export default async function EditTrip({ params }: { params: { slug: string } }) {
  await requireRole(STAFF);
  const sb = supabaseServer();

  const { data: trip } = await sb.from("trips").select("*").eq("slug", params.slug).single();
  if (!trip) notFound();

  const [{ data: items }, { data: clients }] = await Promise.all([
    sb.from("trip_items").select("*").eq("trip_id", trip.id).order("sort"),
    sb.from("clients").select("id,first_name,last_name,email").order("first_name"),
  ]);

  return (
    <TripBuilderForm
      clients={(clients || []).map((c) => ({
        id: c.id,
        name: `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.email || "Client",
      }))}
      preselect=""
      trip={trip}
      items={items || []}
      action={updateTrip}
    />
  );
}
