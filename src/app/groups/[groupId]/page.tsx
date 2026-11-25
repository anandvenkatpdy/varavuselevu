import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeGroupMemberBalances, simplifyDebts } from "@/lib/balances";
import { getGroupActivity } from "@/lib/activity";
import { formatMoney } from "@/lib/money";
import ActivityFeed from "@/components/ActivityFeed";
import ExpenseForm from "@/components/ExpenseForm";
import SettleUpForm from "@/components/SettleUpForm";
import AddMemberForm from "./AddMemberForm";

export default async function GroupDetailPage({
  params,
}: PageProps<"/groups/[groupId]">) {
  const { groupId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: { include: { user: true } } },
  });
  if (!group) notFound();
  if (!group.members.some((m) => m.userId === user.id)) notFound();

  const balances = await computeGroupMemberBalances(groupId);
  const transactions = simplifyDebts(balances);
  const activity = await getGroupActivity(groupId, user.id);

  const totalExpenseCents = await prisma.expense.aggregate({
    where: { groupId },
    _sum: { amountCents: true },
  }).then((r) => r._sum.amountCents ?? 0);
  const returnTo = `/groups/${group.id}`;

  const participants = group.members.map((m) => ({
    id: m.userId,
    name: m.user.name,
  }));
  const nameById = new Map(participants.map((p) => [p.id, p.name]));
  const nameOf = (id: string) => (id === user.id ? "You" : nameById.get(id) ?? "");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <p className="text-sm text-zinc-500">
          {group.members.length} members · {group.currency}
        </p>
        <p className="mt-1 text-sm font-medium text-zinc-700">
          Total trip cost: {formatMoney(totalExpenseCents, group.currency)}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-zinc-900">Balances</h2>
        <ul className="divide-y divide-zinc-100">
          {participants.map((p) => {
            const amount = balances.get(p.id) ?? 0;
            return (
              <li key={p.id} className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-zinc-900">
                  {nameOf(p.id)}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    amount === 0
                      ? "text-zinc-400"
                      : amount > 0
                      ? "text-emerald-700"
                      : "text-rose-600"
                  }`}
                >
                  {amount === 0
                    ? "settled up"
                    : amount > 0
                    ? `is owed ${formatMoney(amount, group.currency)}`
                    : `owes ${formatMoney(Math.abs(amount), group.currency)}`}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-zinc-900">Simplified debts</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-zinc-500">Everyone is settled up.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm text-zinc-800">
            {transactions.map((t, i) => (
              <li key={i}>
                <span className="font-medium">{nameOf(t.fromUserId)}</span> owes{" "}
                <span className="font-medium">{nameOf(t.toUserId)}</span>{" "}
                {formatMoney(t.amountCents, group.currency)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-zinc-900">Members</h2>
        <ul className="mb-4 flex flex-wrap gap-2 text-sm text-zinc-700">
          {participants.map((p) => (
            <li key={p.id} className="rounded-full bg-zinc-100 px-3 py-1">
              {nameOf(p.id)}
            </li>
          ))}
        </ul>
        <AddMemberForm groupId={group.id} />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-zinc-900">Add an expense</h2>
        <ExpenseForm
          key={participants.map((p) => p.id).join(",")}
          participants={participants}
          currentUserId={user.id}
          groupId={group.id}
          returnTo={returnTo}
          currency={group.currency}
        />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-zinc-900">Settle up</h2>
        <SettleUpForm
          participants={participants}
          currentUserId={user.id}
          groupId={group.id}
          returnTo={returnTo}
          currency={group.currency}
        />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-zinc-900">History</h2>
        <ActivityFeed items={activity} currentUserId={user.id} returnTo={returnTo} />
      </div>
    </div>
  );
}
