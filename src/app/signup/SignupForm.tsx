"use client";

import { useActionState } from "react";
import { signup } from "@/lib/actions/auth";

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, {
    error: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Name
        <input
          name="name"
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          placeholder="Ada Lovelace"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Email
        <input
          name="email"
          type="email"
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          placeholder="you@example.com"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>
      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
