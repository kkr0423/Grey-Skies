"use server";

import { createClient } from "@/lib/supabase/server";

export type SubscribeState = {
  status: "idle" | "done" | "error";
  message: string | null;
};

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function subscribe(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  // Honeypot: real people never see or fill this field.
  if (formData.get("website")) {
    return { status: "done", message: null };
  }

  const raw = formData.get("email");
  const email = typeof raw === "string" ? raw.trim() : "";
  if (!email || email.length > 254 || !EMAIL.test(email)) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("signups").insert({ email });

  // 23505 = already signed up. Say nothing that reveals whether an
  // address is on the list.
  if (error && error.code !== "23505") {
    console.error("signup insert failed", error);
    return { status: "error", message: "Something went wrong. Try again later." };
  }

  return { status: "done", message: null };
}
