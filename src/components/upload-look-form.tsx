"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadLook } from "@/lib/actions/upload-look";

export function UploadLookForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [wornOn, setWornOn] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [status, setStatus] = useState<"idle" | "uploading">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose an image.");
      return;
    }

    setStatus("uploading");

    const formData = new FormData();
    formData.set("image", file);
    formData.set("worn_on", wornOn);
    if (caption) formData.set("caption", caption);

    const { error: uploadError } = await uploadLook(formData);

    if (uploadError) {
      setError(uploadError);
      setStatus("idle");
      return;
    }

    setCaption("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setStatus("idle");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="field">
        <label htmlFor="image">Image</label>
        <input id="image" type="file" accept="image/*" ref={fileInputRef} required />
      </div>
      <div className="field">
        <label htmlFor="worn_on">Worn on</label>
        <input
          id="worn_on"
          type="date"
          value={wornOn}
          onChange={(e) => setWornOn(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="caption">Caption</label>
        <input
          id="caption"
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button type="submit" className="btn self-start" disabled={status === "uploading"}>
        {status === "uploading" ? "Uploading…" : "Add look"}
      </button>
    </form>
  );
}
