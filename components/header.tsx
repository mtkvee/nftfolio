interface HeaderProps {
  onAdd: () => void;
}

export function Header({ onAdd }: HeaderProps) {
  return (
    <header className="surface-card rounded-lg px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400">
            NFT Trade Journal
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Flipfolio
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500 sm:text-[15px]">
            Track entries, exits, ROI, and holding periods in a clean NFT
            portfolio dashboard with a gallery-first view.
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-black px-5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Add NFT
        </button>
      </div>
    </header>
  );
}
