import { RegistrationShell } from "@/app/_components/registration-shell";
import { AdminLogin } from "@/app/admin/_components/admin-login";
import { adminAccessEnabled } from "@/server/admin/config";
export default function AdminLoginPage() {
  return <RegistrationShell>
    <h1 className="text-title font-semibold text-foreground">Admin sign in</h1>
    {adminAccessEnabled() ? <AdminLogin /> : <p className="mt-4 text-body text-muted-foreground">Admin access is not enabled yet.</p>}
  </RegistrationShell>;
}
