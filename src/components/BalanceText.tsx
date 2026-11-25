import { formatMoney } from "@/lib/money";

/** amountCents > 0 means they owe you; < 0 means you owe them. */
export default function BalanceText({
  amountCents,
  currency = "INR",
}: {
  amountCents: number;
  currency?: string;
}) {
  if (amountCents === 0) {
    return <span className="text-sm text-zinc-400">settled up</span>;
  }
  const owesYou = amountCents > 0;
  return (
    <span
      className={`text-sm font-semibold ${
        owesYou ? "text-emerald-700" : "text-rose-600"
      }`}
    >
      {owesYou ? "owes you " : "you owe "}
      {formatMoney(Math.abs(amountCents), currency)}
    </span>
  );
}
