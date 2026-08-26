import { AppError } from "@/core/app-error";
import { getParentSession } from "@/server/auth/parent-session";

export async function requireParentApiSession(leadId: string): Promise<void> {
  const session = await getParentSession();

  if (!session.isLoggedIn || !session.leadId || session.leadId !== leadId) {
    throw new AppError({
      code: "UNAUTHENTICATED",
      message: "Please sign in with your one-time code to continue.",
    });
  }
}
