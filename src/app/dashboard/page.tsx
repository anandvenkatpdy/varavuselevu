import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeUserNetMap, computeGroupMemberBalances } from "@/lib/balances";
import { getRecentActivity } from "@/lib/activity";
import { formatMoney } from "@/lib/money";
import BalanceText from "@/components/BalanceText";
import ActivityFeed from "@/components/ActivityFeed";

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
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-500">Overall balance</p>
        <p
          className={`mt-1 text-3xl font-bold ${
            overallCents === 0
              ? "text-zinc-700"
              : overallCents > 0
              ? "text-emerald-700"
              : "text-rose-600"
          }`}
        >
          {overallCents === 0
            ? "You're all settled up"
            : overallCents > 0
            ? `You are owed ${formatMoney(overallCents)}`
            : `You owe ${formatMoney(Math.abs(overallCents))}`}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900">Friends</h2>
            <Link href="/friends" className="text-sm text-emerald-700">
              View all
            </Link>
          </div>
          {friends.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No friends yet.{" "}
              <Link href="/friends" className="text-emerald-700">
                Add one
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {friends.map((f) => (
                <li key={f.id} className="flex items-center justify-between py-2">
                  <Link
                    href={`/friends/${f.id}`}
                    className="text-sm font-medium text-zinc-900 hover:text-emerald-700"
                  >
                    {f.name}
                  </Link>
                  <BalanceText amountCents={netMap.get(f.id) ?? 0} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900">Groups</h2>
            <Link href="/groups" className="text-sm text-emerald-700">
              View all
            </Link>
          </div>
          {groupBalances.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No groups yet.{" "}
              <Link href="/groups" className="text-emerald-700">
                Create one
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {groupBalances.map(({ group, myBalance }) => (
                <li key={group.id} className="flex items-center justify-between py-2">
                  <Link
                    href={`/groups/${group.id}`}
                    className="text-sm font-medium text-zinc-900 hover:text-emerald-700"
                  >
                    {group.name}
                  </Link>
                  <BalanceText amountCents={myBalance} currency={group.currency} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-zinc-900">Recent activity</h2>
        <ActivityFeed items={activity} currentUserId={user.id} returnTo="/dashboard" />
      </div>
    </div>
  );
}
