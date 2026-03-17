/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import { NFTRecord } from "@/types/nft";
import {
  calculateHoldingDuration,
  calculateProfitLoss,
  calculateROI,
  formatDate,
  formatHoldingDuration,
  formatPrice
} from "@/utils/calculations";

interface NFTCardProps {
  record: NFTRecord;
  onEdit: (record: NFTRecord) => void;
  onDelete: (id: string) => void;
}

export function NFTCard({ record, onEdit, onDelete }: NFTCardProps) {
  const profit = calculateProfitLoss(record.buyPrice, record.sellPrice);
  const roi = calculateROI(record.buyPrice, record.sellPrice);
  const holdingDays = calculateHoldingDuration(record.buyDate, record.sellDate);
  const profitTone =
    typeof profit !== "number"
      ? "text-gray-500"
      : profit >= 0
        ? "text-emerald-600"
        : "text-rose-500";

  return (
    <article className="surface-card group rounded-lg p-3 transition duration-200 hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100">
        <img
          src={record.image}
          alt={record.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />
        <span
          className={clsx(
            "absolute left-3 top-3 rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
            record.status === "sold"
              ? "border-green-200 bg-green-50 text-green-600"
              : "border-blue-200 bg-blue-50 text-blue-600"
          )}
        >
          {record.status}
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{record.name}</h3>
            <p className="mt-1 text-sm text-gray-500">{record.collection}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(record)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-black"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(record.id)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-black"
            >
              Delete
            </button>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-gray-400">Buy Price</dt>
            <dd className="mt-1 font-medium text-gray-900">{formatPrice(record.buyPrice)}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Sell Price</dt>
            <dd className="mt-1 font-medium text-gray-900">{formatPrice(record.sellPrice)}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Profit / Loss</dt>
            <dd className={clsx("mt-1 font-medium", profitTone)}>
              {formatPrice(profit)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">ROI</dt>
            <dd className={clsx("mt-1 font-medium", profitTone)}>
              {typeof roi === "number" ? `${roi.toFixed(1)}%` : "--"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">Holding Duration</dt>
            <dd className="mt-1 font-medium text-gray-900">
              {formatHoldingDuration(holdingDays)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">Trade Window</dt>
            <dd className="mt-1 font-medium text-gray-900">
              {formatDate(record.buyDate)}
              {record.sellDate ? ` -> ${formatDate(record.sellDate)}` : " -> Today"}
            </dd>
          </div>
        </dl>

        {record.notes ? (
          <p className="border-t border-gray-200 pt-3 text-sm leading-6 text-gray-500">
            {record.notes.length > 110 ? `${record.notes.slice(0, 110)}...` : record.notes}
          </p>
        ) : null}
      </div>
    </article>
  );
}
