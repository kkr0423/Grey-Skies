"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? "Sign-in failed. Please try again." : null,
  );

  async function handleGoogle() {
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    // On success the browser navigates away to Google.
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" className="btn" onClick={handleGoogle} disabled={loading}>
        {loading ? "Redirecting…" : "Continue with Google"}
      </button>
      {error && <p role="alert" className="mt-5 text-sm text-danger">{error}</p>}
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="mb-8 text-4xl font-light tracking-tight">Log in</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="mt-8 text-sm text-slate">
        New here? Continuing with Google creates your account.
      </p>
    </main>
  );
}
