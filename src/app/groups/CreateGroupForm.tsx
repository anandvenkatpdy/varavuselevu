"use client";

import { useActionState } from "react";
import { createGroup } from "@/lib/actions/groups";

type Friend = { id: string; name: string };

export default function CreateGroupForm({ friends }: { friends: Friend[] }) {
  const [state, formAction, pending] = useActionState(createGroup, {
    error: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="currency" value="INR" />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Group name
          <input
            name="name"
            required
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            placeholder="Roommates, Goa trip…"
          />
        </label>
      </div>

      {friends.length > 0 && (
        <div>
          <p className="mb-1 text-sm font-medium text-zinc-700">
            Add friends to this group
          </p>
          <div className="flex flex-wrap gap-3">
            {friends.map((f) => (
              <label key={f.id} className="flex items-center gap-1.5 text-sm text-zinc-700">
                <input type="checkbox" name="memberIds" value={f.id} />
                {f.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create group"}
      </button>
    </form>
  );
}
