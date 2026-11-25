"use client";

import { useActionState } from "react";
import { recordPayment } from "@/lib/actions/payments";

type Participant = { id: string; name: string };

export default function SettleUpForm({
  participants,
  currentUserId,
  defaultFromId,
  defaultToId,
  groupId = null,
  returnTo,
  currency = "USD",
}: {
  participants: Participant[];
  currentUserId: string;
  defaultFromId?: string;
  defaultToId?: string;
  groupId?: string | null;
  returnTo: string;
  currency?: string;
}) {
  const [state, formAction, pending] = useActionState(recordPayment, {
    error: null,
  });

  const label = (id: string) => (id === currentUserId ? "You" : participants.find((p) => p.id === id)?.name ?? "");

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="currency" value={currency} />
      {groupId && <input type="hidden" name="groupId" value={groupId} />}

      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        From
        <select
          name="fromUserId"
          defaultValue={defaultFromId ?? currentUserId}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {label(p.id)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        To
        <select
          name="toUserId"
          defaultValue={defaultToId ?? participants.find((p) => p.id !== currentUserId)?.id}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        >
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {label(p.id)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Amount ({currency})
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          className="w-32 rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
        Note (optional)
        <input
          name="note"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          placeholder="Cash, Venmo…"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900 disabled:opacity-60"
      >
        {pending ? "Recording…" : "Settle up"}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
