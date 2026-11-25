import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeUserNetMap } from "@/lib/balances";
import BalanceText from "@/components/BalanceText";
import AddFriendForm from "./AddFriendForm";

export default async function FriendsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    include: { userA: true, userB: true },
    orderBy: { createdAt: "desc" },
  });
  const friends = friendships.map((f) =>
    f.userAId === user.id ? f.userB : f.userA
  );

  const netMap = await computeUserNetMap(user.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Friends</h1>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-zinc-900">Add a friend</h2>
        <AddFriendForm />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5">
        {friends.length === 0 ? (
          <p className="text-sm text-zinc-500">
            You haven&apos;t added any friends yet.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {friends.map((f) => (
              <li key={f.id} className="flex items-center justify-between py-3">
                <div>
                  <Link
                    href={`/friends/${f.id}`}
                    className="font-medium text-zinc-900 hover:text-emerald-700"
                  >
                    {f.name}
                  </Link>
                  <p className="text-xs text-zinc-500">{f.email}</p>
                </div>
                <BalanceText amountCents={netMap.get(f.id) ?? 0} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
