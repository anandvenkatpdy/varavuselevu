import Link from "next/link";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 -mt-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-700 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
            ₹
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">VaravuSelavu</h1>
          <p className="text-sm text-zinc-500 mt-1">Split expenses, stay friends</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">Log in</h2>
          <LoginForm />
        </div>
        <p className="mt-4 text-sm text-zinc-500 text-center">
          New here?{" "}
          <Link href="/signup" className="font-medium text-emerald-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
