import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Only Looks needs a Supabase session. Journal pages stay static and skip
// the auth round-trip.
export const config = {
  matcher: ["/looks/:path*", "/auth/:path*"],
};
