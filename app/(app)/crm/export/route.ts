import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isStaff } from "@/lib/roles";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const HEADERS = [
  "First Name", "Last Name", "Email", "Mobile Phone",
  "Address", "City", "State", "Zip", "Tags", "Notes",
];

const esc = (v: any) => {
  const s = (v ?? "").toString().replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
};

export async function GET() {
  const u = await getSessionUser();
  if (!u || !isStaff(u.role)) {
    return new NextResponse("Not authorized", { status: 403 });
  }
  const sb = supabaseServer();
  const { data: contacts } = await sb.from("contacts").select("*");

  const rows = (contacts || []).map((c) => {
    const addr = (c.addr || {}) as Record<string, string>;
    const first = c.first_name || (c.player_name ? c.player_name.split(" ")[0] : "");
    const last = c.last_name || (c.player_name ? c.player_name.split(" ").slice(1).join(" ") : "");
    const tags = [c.group_tag, c.team, c.role].filter(Boolean).join("; ");
    return [
      first, last, c.email, c.mobile,
      addr.line1 || addr.address || "", addr.city || "", addr.state || "", addr.zip || "",
      tags, c.dietary ? `Dietary: ${c.dietary}` : "",
    ].map(esc).join(",");
  });

  const csv = [HEADERS.join(","), ...rows].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="EVP_Fora_Contacts.csv"`,
    },
  });
}
