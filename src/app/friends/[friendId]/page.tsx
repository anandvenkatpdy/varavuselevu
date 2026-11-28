import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPairwiseBalance } from "@/lib/balances";
import { getPairActivity } from "@/lib/activity";
import { formatMoney } from "@/lib/money";
import ActivityFeed from "@/components/ActivityFeed";
import ExpenseForm from "@/components/ExpenseForm";
import SettleUpForm from "@/components/SettleUpForm";

export default async function FriendDetailPage({
  params,
}: PageProps<"/friends/[friendId]">) {
  const { friendId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const friend = await prisma.user.findUnique({ where: { id: friendId } });
  if (!friend) notFound();

  const balance = await getPairwiseBalance(user.id, friend.id);
  const activity = await getPairActivity(user.id, friend.id);
  const returnTo = `/friends/${friend.id}`;

  const participants = [
    { id: user.id, name: user.name },
    { id: friend.id, name: friend.name },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/friends" className="text-zinc-400 hover:text-zinc-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
            {friend.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-900">{friend.name}</h1>
            <p className="text-xs text-zinc-400">{friend.email}</p>
          </div>
        </div>
      </div>

      {/* Balance card */}
      <div className={`rounded-2xl p-5 text-white ${balance === 0 ? "bg-zinc-600" : balance > 0 ? "bg-emerald-700" : "bg-rose-600"}`}>
        <p className="text-sm opacity-80">Balance</p>
        <p className="text-3xl font-bold mt-1">
          {balance === 0 ? "Settled up" : formatMoney(Math.abs(balance))}
        </p>
        <p className="text-sm opacity-70 mt-1">
          {balance > 0 ? `${friend.name} owes you` : balance < 0 ? `You owe ${friend.name}` : ""}
        </p>
      </div>

      {/* Add expense */}
      <div>
        <h2 className="font-semibold text-zinc-900 mb-3">Add an expense</h2>
        <div className="rounded-2xl bg-white border border-zinc-100 p-4">
          <ExpenseForm
            participants={participants}
            currentUserId={user.id}
            returnTo={returnTo}
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
            defaultFromId={balance < 0 ? user.id : friend.id}
            defaultToId={balance < 0 ? friend.id : user.id}
            returnTo={returnTo}
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
