import Link from "next/link";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Log in</h1>
      <LoginForm />
      <p className="mt-4 text-sm text-zinc-600">
        New here?{" "}
        <Link href="/signup" className="font-medium text-emerald-700">
          Create an account
        </Link>
      </p>
    </div>
  );
}
