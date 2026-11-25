import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";

export default async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold text-emerald-700">
          VaravuSelavu
        </Link>
        {user && (
          <nav className="flex items-center gap-5 text-sm font-medium text-zinc-600">
            <Link href="/dashboard" className="hover:text-emerald-700">
              Dashboard
            </Link>
            <Link href="/friends" className="hover:text-emerald-700">
              Friends
            </Link>
            <Link href="/groups" className="hover:text-emerald-700">
              Groups
            </Link>
            <span className="text-zinc-400">|</span>
            <span className="text-zinc-500">{user.name}</span>
            <form action={logout}>
              <button className="hover:text-emerald-700" type="submit">
                Log out
              </button>
            </form>
          </nav>
        )}
      </div>
    </header>
  );
}
