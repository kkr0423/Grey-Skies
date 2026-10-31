"use client";

import { useActionState } from "react";
import { subscribe, type SubscribeState } from "@/lib/actions/subscribe";

const initialState: SubscribeState = { status: "idle", message: null };

export function SignupForm({ id = "signup" }: { id?: string }) {
  const [state, formAction, pending] = useActionState(subscribe, initialState);

  if (state.status === "done") {
    return (
      <p role="status" className="text-sm text-slate">
        Thanks. We&apos;ll write when Looks opens.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-2">
      <label htmlFor={`${id}-email`} className="text-sm text-slate">
        Get one email when it opens.
      </label>
      <div className="flex gap-2">
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="min-w-0 flex-1 border-b border-line bg-transparent py-2 text-ink placeholder:text-slate/60 focus:border-ink"
        />
        <button type="submit" className="btn-quiet" disabled={pending}>
          {pending ? "…" : "Notify me"}
        </button>
      </div>
      {/* Honeypot, hidden from people and assistive tech. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      {state.status === "error" && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
    </form>
  );
}
