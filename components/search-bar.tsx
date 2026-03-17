interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <label className="flex w-full max-w-lg items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 transition focus-within:border-gray-300">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
        <circle cx="11" cy="11" r="6" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by NFT or collection"
        className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
      />
    </label>
  );
}
