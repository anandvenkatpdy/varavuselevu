import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPairwiseBalance } from "@/lib/balances";
import { getPairActivity } from "@/lib/activity";
import BalanceText from "@/components/BalanceText";
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{friend.name}</h1>
        <p className="text-sm text-zinc-500">{friend.email}</p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <p className="text-sm text-zinc-500">Balance</p>
        <p className="mt-1 text-xl">
          <BalanceText amountCents={balance} />
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-zinc-900">Add an expense</h2>
        <ExpenseForm
          participants={participants}
          currentUserId={user.id}
          returnTo={returnTo}
        />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-zinc-900">Settle up</h2>
        <SettleUpForm
          participants={participants}
          currentUserId={user.id}
          defaultFromId={balance < 0 ? user.id : friend.id}
          defaultToId={balance < 0 ? friend.id : user.id}
          returnTo={returnTo}
        />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-zinc-900">History</h2>
        <ActivityFeed items={activity} currentUserId={user.id} returnTo={returnTo} />
      </div>
    </div>
  );
}
