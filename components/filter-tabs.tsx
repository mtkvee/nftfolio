import clsx from "clsx";
import { NFTFilter } from "@/types/nft";

interface FilterTabsProps {
  activeFilter: NFTFilter;
  onChange: (filter: NFTFilter) => void;
}

const tabs: { label: string; value: NFTFilter }[] = [
  { label: "All", value: "all" },
  { label: "Owned", value: "owned" },
  { label: "Sold", value: "sold" }
];

export function FilterTabs({ activeFilter, onChange }: FilterTabsProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={clsx(
            "rounded-lg px-4 py-2 text-sm font-medium transition",
            activeFilter === tab.value
              ? "bg-gray-100 text-gray-900"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
