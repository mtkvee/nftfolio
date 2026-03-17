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
  isLoaded: boolean;
}

interface SummaryCardData {
  label: string;
  value: string;
  valueClass?: string;
}

export function SummaryCards({ records, isLoaded }: SummaryCardsProps) {
  const ownedCount = records.filter((record) => record.status === "owned").length;
  const soldCount = records.filter((record) => record.status === "sold").length;
  const totalProfit = calculateTotalProfitLoss(records);
  const averageHold = calculateAverageHoldingDuration(records);
  const winRate = calculateWinRate(records);

  const cards: SummaryCardData[] = [
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

  const [totalCard, ownedCard, soldCard, profitCard, avgHoldCard, winRateCard] = cards;

  return (
    <>
      <section className="space-y-4 sm:hidden">
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard card={totalCard} isLoaded={isLoaded} compact />
          <SummaryCard card={ownedCard} isLoaded={isLoaded} compact />
          <SummaryCard card={soldCard} isLoaded={isLoaded} compact />
        </div>

        <div className="grid grid-cols-1 gap-3">
          <SummaryCard card={profitCard} isLoaded={isLoaded} prominent />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SummaryCard card={avgHoldCard} isLoaded={isLoaded} />
          <SummaryCard card={winRateCard} isLoaded={isLoaded} />
        </div>
      </section>

      <section className="hidden gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-6">
        {cards.map((card) => (
          <SummaryCard key={card.label} card={card} isLoaded={isLoaded} />
        ))}
      </section>
    </>
  );
}

interface SummaryCardProps {
  card: SummaryCardData;
  isLoaded: boolean;
  compact?: boolean;
  prominent?: boolean;
}

function SummaryCard({
  card,
  isLoaded,
  compact = false,
  prominent = false
}: SummaryCardProps) {
  return (
    <article className="surface-card flex h-full min-h-[104px] flex-col justify-between rounded-lg p-4 transition duration-200 hover:-translate-y-0.5 animate-fadeIn">
      <p
        className={compact
          ? "text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400"
          : "text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400"}
      >
        {card.label}
      </p>
      <p
        className={`${prominent ? "text-[2rem]" : compact ? "text-[1.55rem]" : "text-[1.9rem]"} mt-3 font-bold leading-none ${card.valueClass ?? "text-gray-900"}`}
      >
        {isLoaded ? card.value : "--"}
      </p>
    </article>
  );
}
