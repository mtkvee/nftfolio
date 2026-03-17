interface EmptyStateProps {
  onAdd: () => void;
  hasAnyNFTs: boolean;
}

export function EmptyState({ onAdd, hasAnyNFTs }: EmptyStateProps) {
  return (
    <section className="surface-card flex min-h-[280px] flex-col items-center justify-center rounded-lg px-6 py-12 text-center">
      <h2 className="text-2xl font-semibold text-gray-900">
        {hasAnyNFTs ? "No matches found" : "Start your NFT journal"}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">
        {hasAnyNFTs
          ? "Try a different search or switch filters to surface your NFTs."
          : "Add your first NFT trade to build a visual record of your portfolio, profits, and hold times."}
      </p>
    </section>
  );
}
