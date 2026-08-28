import { redirect } from "next/navigation";
import { RegistrationShell } from "@/app/_components/registration-shell";
import { AdminWorkspace } from "@/app/admin/_components/admin-workspace";
import { requireAdminSession } from "@/server/admin/session";
export default async function AdminPage() {
  const session = await requireAdminSession(false).catch(() => null);
  if (!session) redirect("/admin/login");
  return <RegistrationShell><AdminWorkspace issuedAt={session.issuedAt} lastSeenAt={session.lastSeenAt} /></RegistrationShell>;
}
