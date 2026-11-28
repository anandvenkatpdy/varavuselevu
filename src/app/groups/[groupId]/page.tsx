import Link from "next/link";
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
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/groups" className="text-zinc-400 hover:text-zinc-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
            {group.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-900">{group.name}</h1>
            <p className="text-xs text-zinc-400">{group.members.length} members</p>
          </div>
        </div>
      </div>

      {/* Total cost card */}
      <div className="rounded-2xl bg-blue-700 text-white p-5">
        <p className="text-sm opacity-80">Total trip cost</p>
        <p className="text-3xl font-bold mt-1">{formatMoney(totalExpenseCents, group.currency)}</p>
      </div>

      {/* Balances */}
      <div>
        <h2 className="font-semibold text-zinc-900 mb-3">Balances</h2>
        <div className="rounded-2xl bg-white border border-zinc-100 divide-y divide-zinc-100">
          {participants.map((p) => {
            const amount = balances.get(p.id) ?? 0;
            return (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-semibold text-sm">
                    {nameOf(p.id)[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-zinc-900">{nameOf(p.id)}</span>
                </div>
                <span className={`text-sm font-semibold ${amount === 0 ? "text-zinc-400" : amount > 0 ? "text-emerald-700" : "text-rose-600"}`}>
                  {amount === 0 ? "settled" : amount > 0 ? `owed ${formatMoney(amount, group.currency)}` : `owes ${formatMoney(Math.abs(amount), group.currency)}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simplified debts */}
      {transactions.length > 0 && (
        <div>
          <h2 className="font-semibold text-zinc-900 mb-3">Who pays whom</h2>
          <div className="rounded-2xl bg-white border border-zinc-100 divide-y divide-zinc-100">
            {transactions.map((t, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-zinc-700">
                  <span className="font-medium">{nameOf(t.fromUserId)}</span> → <span className="font-medium">{nameOf(t.toUserId)}</span>
                </span>
                <span className="text-sm font-semibold text-rose-600">{formatMoney(t.amountCents, group.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div>
        <h2 className="font-semibold text-zinc-900 mb-3">Members</h2>
        <div className="rounded-2xl bg-white border border-zinc-100 p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {participants.map((p) => (
              <span key={p.id} className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700">
                <span className="w-5 h-5 rounded-full bg-zinc-300 flex items-center justify-center text-xs font-semibold">
                  {nameOf(p.id)[0].toUpperCase()}
                </span>
                {nameOf(p.id)}
              </span>
            ))}
          </div>
          <AddMemberForm groupId={group.id} />
        </div>
      </div>

      {/* Add expense */}
      <div>
        <h2 className="font-semibold text-zinc-900 mb-3">Add an expense</h2>
        <div className="rounded-2xl bg-white border border-zinc-100 p-4">
          <ExpenseForm
            key={participants.map((p) => p.id).join(",")}
            participants={participants}
            currentUserId={user.id}
            groupId={group.id}
            returnTo={returnTo}
            currency={group.currency}
          />
        </div>
      </div>

      {/* Settle up */}
      <div>
        <h2 className="font-semibold text-zinc-900 mb-3">Settle up</h2>
        <div className="rounded-2xl bg-white border border-zinc-100 p-4">
          <SettleUpForm
            participants={participants}
            currentUserId={user.id}
            groupId={group.id}
            returnTo={returnTo}
            currency={group.currency}
          />
        </div>
      </div>

      {/* History */}
      <div>
        <h2 className="font-semibold text-zinc-900 mb-3">History</h2>
        <div className="rounded-2xl bg-white border border-zinc-100">
          <ActivityFeed items={activity} currentUserId={user.id} returnTo={returnTo} />
        </div>
      </div>
    </div>
  );
}
