import {
  calculateAverageHoldingDuration,
  calculateTotalProfitLoss,
  calculateWinRate,
  formatHoldingDuration,
  formatPrice
} from "@/utils/calculations";
import { NFTRecord } from "@/types/nft";

interface SummaryCardsProps {
  records: NFTRecord[];
  isHydrated: boolean;
}

export function SummaryCards({ records, isHydrated }: SummaryCardsProps) {
  const ownedCount = records.filter((record) => record.status === "owned").length;
  const soldCount = records.filter((record) => record.status === "sold").length;
  const totalProfit = calculateTotalProfitLoss(records);
  const averageHold = calculateAverageHoldingDuration(records);
  const winRate = calculateWinRate(records);

  const cards = [
    { label: "Total NFTs", value: records.length.toString() },
    { label: "Owned", value: ownedCount.toString() },
    { label: "Sold", value: soldCount.toString() },
    {
      label: "Total P/L",
      value: formatPrice(totalProfit),
      valueClass: totalProfit >= 0 ? "text-emerald-600" : "text-rose-500"
    },
    {
      label: "Avg Hold",
      value: formatHoldingDuration(Math.round(averageHold))
    },
    { label: "Win Rate", value: `${winRate.toFixed(0)}%` }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <article
          key={card.label}
          className="surface-card rounded-lg p-4 transition duration-200 hover:-translate-y-0.5 animate-fadeIn"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">
            {card.label}
          </p>
          <p className={`mt-3 text-[1.9rem] font-bold leading-none ${card.valueClass ?? "text-gray-900"}`}>
            {isHydrated ? card.value : "--"}
          </p>
        </article>
      ))}
    </section>
  );
}
