"use client";

import { useActionState } from "react";
import { addFriend } from "@/lib/actions/friends";

export default function AddFriendForm() {
  const [state, formAction, pending] = useActionState(addFriend, {
    error: null,
  });

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Name
        <input
          name="name"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          placeholder="Jordan"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Email
        <input
          name="email"
          type="email"
          required
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          placeholder="jordan@example.com"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add friend"}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {!state?.error && state?.success && (
        <p className="w-full text-sm text-emerald-700">Friend added!</p>
      )}
    </form>
  );
}
