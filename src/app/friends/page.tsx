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
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-zinc-900">Friends</h1>

      <div className="rounded-2xl bg-white border border-zinc-100 p-4">
        <h2 className="text-sm font-semibold text-zinc-700 mb-3">Add a friend</h2>
        <AddFriendForm />
      </div>

      {friends.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-8">No friends yet. Add one above.</p>
      ) : (
        <div className="rounded-2xl bg-white border border-zinc-100 divide-y divide-zinc-100">
          {friends.map((f) => (
            <Link
              key={f.id}
              href={`/friends/${f.id}`}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
                  {f.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{f.name}</p>
                  <p className="text-xs text-zinc-400">{f.email}</p>
                </div>
              </div>
              <BalanceText amountCents={netMap.get(f.id) ?? 0} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
