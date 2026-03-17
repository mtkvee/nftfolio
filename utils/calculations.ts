import { NFTRecord } from "@/types/nft";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function calculateProfitLoss(
  buyPrice: number,
  sellPrice?: number
): number | null {
  if (typeof sellPrice !== "number") {
    return null;
  }

  return sellPrice - buyPrice;
}

export function calculateROI(
  buyPrice: number,
  sellPrice?: number
): number | null {
  if (typeof sellPrice !== "number" || buyPrice === 0) {
    return null;
  }

  return ((sellPrice - buyPrice) / buyPrice) * 100;
}

export function calculateHoldingDuration(
  buyDate: string,
  sellDate?: string
): number {
  const start = new Date(buyDate);
  const end = new Date(sellDate ?? new Date().toISOString());

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY));
}

export function formatHoldingDuration(days: number): string {
  if (days < 30) {
    return `${days}d`;
  }

  const months = Math.floor(days / 30);
  const remainingDays = days % 30;

  return remainingDays > 0 ? `${months}m ${remainingDays}d` : `${months}m`;
}

export function formatPrice(price?: number | null): string {
  if (typeof price !== "number" || Number.isNaN(price)) {
    return "--";
  }

  return `${price.toFixed(2)} ETH`;
}

export function formatDate(date?: string): string {
  if (!date) {
    return "--";
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function calculateWinRate(records: NFTRecord[]): number {
  const sold = records.filter((record) => record.status === "sold");
  if (sold.length === 0) {
    return 0;
  }

  const wins = sold.filter((record) => {
    const profit = calculateProfitLoss(record.buyPrice, record.sellPrice);
    return typeof profit === "number" && profit > 0;
  });

  return (wins.length / sold.length) * 100;
}

export function calculateAverageHoldingDuration(records: NFTRecord[]): number {
  if (records.length === 0) {
    return 0;
  }

  const totalDays = records.reduce((sum, record) => {
    return sum + calculateHoldingDuration(record.buyDate, record.sellDate);
  }, 0);

  return totalDays / records.length;
}

export function calculateTotalProfitLoss(records: NFTRecord[]): number {
  return records.reduce((sum, record) => {
    const profit = calculateProfitLoss(record.buyPrice, record.sellPrice);
    return sum + (profit ?? 0);
  }, 0);
}
