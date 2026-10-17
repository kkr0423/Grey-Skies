import { cloudinary } from "@/lib/cloudinary";

export type LookImage = {
  public_id: string;
  version: number | null;
  width: number | null;
  height: number | null;
};

// Only the public_id/version are stored; delivery URLs are built here so
// sizes and formats can change without touching any rows.
// Note: sign_url prevents tampering but does not expire (requirements §5.3).
export function lookImageUrl(image: LookImage, width: number) {
  return cloudinary.url(image.public_id, {
    type: "authenticated",
    sign_url: true,
    secure: true,
    version: image.version ?? undefined,
    transformation: [
      { width, crop: "limit", fetch_format: "auto", quality: "auto" },
    ],
  });
}
