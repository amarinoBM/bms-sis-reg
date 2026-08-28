import { z } from "zod";
import { sendAdminOtp } from "@/server/admin/otp";
import { adminRoute } from "@/server/admin/route";
const schema = z.object({ email: z.string().trim().email().max(254) });
export async function POST(request: Request) {
  return adminRoute(request, async () => {
    const { email } = schema.parse(await request.json());
    return sendAdminOtp(email);
  });
}
