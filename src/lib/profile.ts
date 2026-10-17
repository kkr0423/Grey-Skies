import type { SupabaseClient, User } from "@supabase/supabase-js";

// F-02: create the profiles row on first login. Idempotent.
export async function ensureProfile(supabase: SupabaseClient, user: User) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return;

  const base =
    (user.user_metadata?.username as string | undefined)?.trim() ||
    user.id.slice(0, 8);

  // username is unique; retry once with a suffix if it is taken.
  for (const username of [base, `${base}-${user.id.slice(0, 4)}`]) {
    const { error } = await supabase
      .from("profiles")
      .insert({ id: user.id, username });
    if (!error || error.code !== "23505") return;
  }
}
