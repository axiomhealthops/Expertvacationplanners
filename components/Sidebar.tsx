"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/roles";
import { ROLE_LABEL, isStaff, isAdmin } from "@/lib/roles";
import SignOutButton from "./SignOutButton";
import Globe from "./Globe";

type Item = { href: string; label: string };
type Group = { title: string; items: Item[] };

function navFor(role: Role): Group[] {
  if (isStaff(role)) {
    const ops: Item[] = [
      { href: "/pipeline", label: "Pipeline" },
      { href: "/trips/new", label: "Trip Builder" },
      { href: "/clients", label: "Clients" },
      { href: "/crm", label: "CRM & Contacts" },
    ];
    const money: Item[] = [{ href: "/fora", label: "Commissions & Fora" }];
    const groups: Group[] = [
      { title: "Operations", items: ops },
      { title: "Money", items: money },
    ];
    if (isAdmin(role)) {
      groups.push({ title: "Admin", items: [{ href: "/settings", label: "Settings" }] });
    }
    return groups;
  }
  if (role === "sport_club") {
    return [{ title: "Club", items: [{ href: "/club", label: "Our Trips & Teams" }] }];
  }
  return [{ title: "My Travel", items: [{ href: "/myportal", label: "My Trips" }] }];
}

export default function Sidebar({ role, name }: { role: Role; name: string }) {
  const path = usePathname();
  const groups = navFor(role);
  return (
    <aside className="side">
      <div className="brand">
        <span className="mk">
          <img src="/brand/globe.png" alt="EVP" />
        </span>
        <span>
          <div className="co">Expert Vacation<br />Planners</div>
          <div className="sub">Command 26</div>
        </span>
      </div>
      <nav className="nav">
        <Link href="/dashboard" className={path === "/dashboard" ? "active" : ""}>
          Home
        </Link>
        {groups.map((g) => (
          <div key={g.title}>
            <div className="grp">{g.title}</div>
            {g.items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={path === it.href || path.startsWith(it.href + "/") ? "active" : ""}
              >
                {it.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="who">
        <div className="nm">{name}</div>
        <div className="rl">{ROLE_LABEL[role]}</div>
        <SignOutButton />
      </div>
    </aside>
  );
}
