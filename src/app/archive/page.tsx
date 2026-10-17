import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { lookImageUrl, type LookImage } from "@/lib/images";
import { ensureProfile } from "@/lib/profile";
import { LogoutButton } from "@/components/logout-button";
import { UploadLookForm } from "@/components/upload-look-form";

type LookRow = {
  id: string;
  caption: string | null;
  worn_on: string;
  look_images: (LookImage & { position: number })[];
};

export default async function ArchivePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureProfile(supabase, user);

  const { data: looks } = await supabase
    .from("looks")
    .select("id, caption, worn_on, look_images(public_id, version, width, height, position)")
    .eq("user_id", user.id)
    .order("worn_on", { ascending: false })
    .returns<LookRow[]>();

  const items = (looks ?? []).map((look) => {
    const image = [...look.look_images].sort(
      (x, y) => x.position - y.position,
    )[0];
    return { ...look, image };
  });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:px-10">
      <header className="flex items-baseline justify-between">
        <h1 className="text-4xl font-light tracking-tight">Archive</h1>
        <LogoutButton />
      </header>

      <details className="mt-8 max-w-md border-b border-line pb-6">
        <summary className="btn-quiet inline-block list-none">Add a look</summary>
        <div className="mt-6">
          <UploadLookForm />
        </div>
      </details>

      {items.length === 0 ? (
        <p className="mt-16 max-w-sm text-slate">
          Nothing here yet. Add your first look with the button above.
        </p>
      ) : (
        <ul className="mt-10 columns-2 gap-x-5 md:columns-3">
          {items.map((look) => (
            <li key={look.id} className="mb-8 break-inside-avoid">
              {look.image && (
                // Cloudinary delivers sized/auto-format variants; width/height
                // reserve space so the layout does not shift (CLS).
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lookImageUrl(look.image, 480)}
                  srcSet={`${lookImageUrl(look.image, 480)} 480w, ${lookImageUrl(look.image, 960)} 960w`}
                  sizes="(min-width: 768px) 33vw, 50vw"
                  width={look.image.width ?? undefined}
                  height={look.image.height ?? undefined}
                  alt={look.caption ?? `Look worn on ${look.worn_on}`}
                  loading="lazy"
                  className="h-auto w-full rounded-sm bg-cloud"
                />
              )}
              <p className="mt-3 text-lg font-light">{formatDate(look.worn_on)}</p>
              {look.caption && (
                <p className="text-sm text-slate">{look.caption}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function formatDate(day: string) {
  return new Date(day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
