"use client";

import { useActionState, useState } from "react";
import { createExpense } from "@/lib/actions/expenses";

type Participant = { id: string; name: string };

const CATEGORIES = [
  ["GENERAL", "General"],
  ["FOOD", "Food & drink"],
  ["GROCERIES", "Groceries"],
  ["TRANSPORT", "Transport"],
  ["HOUSING", "Housing"],
  ["UTILITIES", "Utilities"],
  ["ENTERTAINMENT", "Entertainment"],
  ["TRAVEL", "Travel"],
  ["SHOPPING", "Shopping"],
  ["HEALTH", "Health"],
  ["OTHER", "Other"],
] as const;

const SPLIT_TYPES = [
  ["EQUAL", "Equally"],
  ["EXACT", "Unequally (amounts)"],
  ["PERCENT", "By percentage"],
  ["SHARES", "By shares"],
] as const;

export default function ExpenseForm({
  participants,
  currentUserId,
  groupId = null,
  returnTo,
  currency = "USD",
}: {
  participants: Participant[];
  currentUserId: string;
  groupId?: string | null;
  returnTo: string;
  currency?: string;
}) {
  const [state, formAction, pending] = useActionState(createExpense, {
    error: null,
  });
  const [splitType, setSplitType] = useState<string>("EQUAL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(participants.map((p) => p.id))
  );
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState(currentUserId);
  const [category, setCategory] = useState("GENERAL");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  // React resets uncontrolled/controlled form fields after every action
  // submission (success or error). Bumping this key after submit forces a
  // remount that re-syncs the DOM with our React state instead of the
  // browser's native reset value.
  const [submitCount, setSubmitCount] = useState(0);

  const toggleParticipant = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selected = participants.filter((p) => selectedIds.has(p.id));
  const defaultSplitValue = splitType === "SHARES" ? "1" : "0";

  return (
    <form
      action={formAction}
      onSubmit={() => setSubmitCount((c) => c + 1)}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="returnTo" value={returnTo} />
      {groupId && <input type="hidden" name="groupId" value={groupId} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Description
          <input
            key={submitCount}
            name="description"
            required
            defaultValue={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            placeholder="Dinner, rent, tickets…"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Amount ({currency})
          <input
            key={submitCount}
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            placeholder="0.00"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Paid by
          <select
            key={submitCount}
            name="paidById"
            defaultValue={paidById}
            onChange={(e) => setPaidById(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id === currentUserId ? "You" : p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Category
          <select
            key={submitCount}
            name="category"
            defaultValue={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            {CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Date
          <input
            key={submitCount}
            name="date"
            type="date"
            defaultValue={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
          Split
          <select
            key={submitCount}
            name="splitType"
            defaultValue={splitType}
            onChange={(e) => setSplitType(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            {SPLIT_TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {participants.length > 2 && (
        <div>
          <p className="mb-1 text-sm font-medium text-zinc-700">Split between</p>
          <div className="flex flex-wrap gap-3">
            {participants.map((p) => (
              <label key={p.id} className="flex items-center gap-1.5 text-sm text-zinc-700">
                <input
                  key={submitCount}
                  type="checkbox"
                  name="participantIds"
                  value={p.id}
                  defaultChecked={selectedIds.has(p.id)}
                  onChange={() => toggleParticipant(p.id)}
                />
                {p.id === currentUserId ? "You" : p.name}
              </label>
            ))}
          </div>
        </div>
      )}
      {participants.length <= 2 &&
        participants.map((p) => (
          <input key={p.id} type="hidden" name="participantIds" value={p.id} />
        ))}

      {splitType !== "EQUAL" && (
        <div>
          <p className="mb-1 text-sm font-medium text-zinc-700">
            {splitType === "EXACT"
              ? "Amount owed by each person"
              : splitType === "PERCENT"
              ? "Percentage owed by each person"
              : "Shares owed by each person"}
          </p>
          <div className="flex flex-col gap-2">
            {selected.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm text-zinc-700">
                <span className="w-24 shrink-0">
                  {p.id === currentUserId ? "You" : p.name}
                </span>
                <input
                  key={submitCount}
                  type="number"
                  step={splitType === "SHARES" ? "1" : "0.01"}
                  min="0"
                  name={`value_${p.id}`}
                  defaultValue={splitValues[p.id] ?? defaultSplitValue}
                  onChange={(e) =>
                    setSplitValues((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                  className="w-28 rounded-md border border-zinc-300 px-2 py-1 text-sm"
                />
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
        {pending ? "Saving…" : "Add expense"}
      </button>
    </form>
  );
}
