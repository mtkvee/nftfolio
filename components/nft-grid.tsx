import { NFTCard } from "@/components/nft-card";
import { NFTRecord } from "@/types/nft";

interface NFTGridProps {
  records: NFTRecord[];
  onEdit: (record: NFTRecord) => void;
  onDelete: (id: string) => void;
}

export function NFTGrid({ records, onEdit, onDelete }: NFTGridProps) {
  return (
    <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
      {records.map((record) => (
        <NFTCard
          key={record.id}
          record={record}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </section>
  );
}
