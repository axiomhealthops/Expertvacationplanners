export type Role =
  | "super_admin"
  | "admin"
  | "agent"
  | "travel_client"
  | "sport_club"
  | "sport_client";

export const STAFF: Role[] = ["super_admin", "admin", "agent"];
export const ADMINS: Role[] = ["super_admin", "admin"];

export const isStaff = (r?: Role | null) => !!r && STAFF.includes(r);
export const isAdmin = (r?: Role | null) => !!r && ADMINS.includes(r);
export const seesMoney = (r?: Role | null) => isStaff(r); // hard money rule

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  agent: "Agent",
  travel_client: "Travel Client",
  sport_club: "Sport Club",
  sport_client: "Sport Client",
};

// Where each role lands after login.
export function homeFor(role?: Role | null): string {
  if (isStaff(role)) return "/pipeline";
  if (role === "sport_club") return "/club";
  return "/myportal"; // travel_client + sport_client
}
