import { formatMoney } from "@/lib/money";
import type { ActivityItem } from "@/lib/activity";
import { deleteExpense } from "@/lib/actions/expenses";

const CATEGORY_LABEL: Record<string, string> = {
  GENERAL: "General",
  FOOD: "Food & drink",
  GROCERIES: "Groceries",
  TRANSPORT: "Transport",
  HOUSING: "Housing",
  UTILITIES: "Utilities",
  ENTERTAINMENT: "Entertainment",
  TRAVEL: "Travel",
  SHOPPING: "Shopping",
  HEALTH: "Health",
  OTHER: "Other",
};

export default function ActivityFeed({
  items,
  currentUserId,
  returnTo,
}: {
  items: ActivityItem[];
  currentUserId: string;
  returnTo?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">No activity yet.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-100">
      {items.map((item) => (
        <li key={`${item.type}-${item.id}`} className="flex items-center justify-between py-3">
          {item.type === "expense" ? (
            <>
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {item.description}
                </p>
                <p className="text-xs text-zinc-500">
                  {item.paidById === currentUserId ? "You" : item.paidByName}{" "}
                  paid {formatMoney(item.amountCents, item.currency)}
                  {item.groupName ? ` · ${item.groupName}` : ""} ·{" "}
                  {CATEGORY_LABEL[item.category] ?? item.category} ·{" "}
                  {item.date.toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-semibold ${
                    item.paidById === currentUserId
                      ? "text-emerald-700"
                      : "text-rose-600"
                  }`}
                >
                  {item.paidById === currentUserId
                    ? `+${formatMoney(
                        item.amountCents - item.myShareCents,
                        item.currency
                      )}`
                    : `-${formatMoney(item.myShareCents, item.currency)}`}
                </span>
                {returnTo && (
                  <form action={deleteExpense}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button
                      type="submit"
                      className="text-xs text-zinc-400 hover:text-rose-600"
                      title="Delete expense"
                    >
                      delete
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {item.fromUserId === currentUserId ? "You" : item.fromUserName}{" "}
                  paid{" "}
                  {item.toUserId === currentUserId ? "you" : item.toUserName}
                </p>
                <p className="text-xs text-zinc-500">
                  Payment{item.groupName ? ` · ${item.groupName}` : ""} ·{" "}
                  {item.date.toLocaleDateString()}
                </p>
              </div>
              <span className="text-sm font-semibold text-zinc-600">
                {formatMoney(item.amountCents, item.currency)}
              </span>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
