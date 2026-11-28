import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeUserNetMap, computeGroupMemberBalances } from "@/lib/balances";
import { getRecentActivity } from "@/lib/activity";
import { formatMoney } from "@/lib/money";
import BalanceText from "@/components/BalanceText";
import ActivityFeed from "@/components/ActivityFeed";
import { logout } from "@/lib/actions/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const netMap = await computeUserNetMap(user.id);
  const overallCents = [...netMap.values()].reduce((a, b) => a + b, 0);

  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    include: { userA: true, userB: true },
  });
  const friends = friendships.map((f) =>
    f.userAId === user.id ? f.userB : f.userA
  );

  const groupMemberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    include: { group: true },
  });

  const groupBalances = await Promise.all(
    groupMemberships.map(async (m) => {
      const balances = await computeGroupMemberBalances(m.groupId);
      return { group: m.group, myBalance: balances.get(user.id) ?? 0 };
    })
  );

  const activity = await getRecentActivity(user.id, 10);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Welcome back</p>
          <h1 className="text-xl font-bold text-zinc-900">{user.name}</h1>
        </div>
        <form action={logout}>
          <button className="text-xs text-zinc-400 hover:text-zinc-600 px-3 py-1 rounded-full border border-zinc-200">
            Log out
          </button>
        </form>
      </div>

      {/* Overall balance card */}
      <div
        className={`rounded-2xl p-5 text-white ${
          overallCents === 0
            ? "bg-zinc-600"
            : overallCents > 0
            ? "bg-emerald-700"
            : "bg-rose-600"
        }`}
      >
        <p className="text-sm opacity-80">Overall balance</p>
        <p className="mt-1 text-3xl font-bold">
          {overallCents === 0
            ? "All settled up"
            : overallCents > 0
            ? formatMoney(overallCents)
            : `-${formatMoney(Math.abs(overallCents))}`}
        </p>
        <p className="mt-1 text-sm opacity-70">
          {overallCents > 0 ? "you are owed" : overallCents < 0 ? "you owe" : ""}
        </p>
      </div>

      {/* Friends */}
      {friends.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-zinc-900">Friends</h2>
            <Link href="/friends" className="text-xs text-emerald-700 font-medium">View all</Link>
          </div>
          <div className="rounded-2xl bg-white border border-zinc-100 divide-y divide-zinc-100">
            {friends.slice(0, 5).map((f) => (
              <Link
                key={f.id}
                href={`/friends/${f.id}`}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm">
                    {f.name[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-zinc-900">{f.name}</span>
                </div>
                <BalanceText amountCents={netMap.get(f.id) ?? 0} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Groups */}
      {groupBalances.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-zinc-900">Groups</h2>
            <Link href="/groups" className="text-xs text-emerald-700 font-medium">View all</Link>
          </div>
          <div className="rounded-2xl bg-white border border-zinc-100 divide-y divide-zinc-100">
            {groupBalances.map(({ group, myBalance }) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                    {group.name[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-zinc-900">{group.name}</span>
                </div>
                <BalanceText amountCents={myBalance} currency={group.currency} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <h2 className="font-semibold text-zinc-900 mb-3">Recent activity</h2>
        <div className="rounded-2xl bg-white border border-zinc-100">
          <ActivityFeed items={activity} currentUserId={user.id} returnTo="/dashboard" />
        </div>
      </div>
    </div>
  );
}
