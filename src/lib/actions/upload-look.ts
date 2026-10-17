"use server";

import { revalidatePath } from "next/cache";
import type { UploadApiResponse } from "cloudinary";
import { createClient } from "@/lib/supabase/server";
import { cloudinary } from "@/lib/cloudinary";
import { ensureProfile } from "@/lib/profile";

const MAX_BYTES = 10 * 1024 * 1024;

export async function uploadLook(
  formData: FormData,
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not logged in." };
  }

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "File must be an image." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Image must be 10MB or smaller." };
  }

  const wornOn = formData.get("worn_on");
  if (typeof wornOn !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(wornOn)) {
    return { error: "Worn-on date is required." };
  }

  const captionField = formData.get("caption");
  const caption =
    typeof captionField === "string" && captionField.trim()
      ? captionField.trim()
      : null;

  await ensureProfile(supabase, user);

  // is_public is left at its default (false): looks start private.
  const { data: look, error: lookError } = await supabase
    .from("looks")
    .insert({ user_id: user.id, caption, worn_on: wornOn })
    .select("id")
    .single();

  if (lookError || !look) {
    return { error: lookError?.message ?? "Could not create look." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let uploaded: UploadApiResponse;
  try {
    uploaded = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: `looks/${user.id}/${look.id}`, type: "authenticated" },
          (error, result) => {
            if (error || !result) reject(error ?? new Error("Upload failed."));
            else resolve(result);
          },
        )
        .end(buffer);
    });
  } catch (err) {
    await supabase.from("looks").delete().eq("id", look.id);
    return {
      error: err instanceof Error ? err.message : "Image upload failed.",
    };
  }

  const { error: imageError } = await supabase.from("look_images").insert({
    look_id: look.id,
    public_id: uploaded.public_id,
    version: uploaded.version,
    format: uploaded.format,
    width: uploaded.width,
    height: uploaded.height,
    position: 0,
  });

  if (imageError) {
    // Don't leave an imageless look or an orphaned upload behind.
    await supabase.from("looks").delete().eq("id", look.id);
    await cloudinary.uploader
      .destroy(uploaded.public_id, { type: "authenticated" })
      .catch(() => {});
    return { error: imageError.message };
  }

  revalidatePath("/archive");
  return { error: null };
}
