"use client";

import { useEffect, useMemo, useState } from "react";
import { useNFTStore } from "@/store/nft-store";
import { NFTFormValues, NFTRecord } from "@/types/nft";

interface NFTFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues: NFTRecord | null;
}

const defaultValues: NFTFormValues = {
  name: "",
  collection: "",
  image: "",
  buyPrice: "",
  sellPrice: "",
  buyDate: "",
  sellDate: "",
  status: "owned",
  notes: ""
};

function toFormValues(record: NFTRecord | null): NFTFormValues {
  if (!record) {
    return defaultValues;
  }

  return {
    name: record.name,
    collection: record.collection,
    image: record.image,
    buyPrice: String(record.buyPrice),
    sellPrice: typeof record.sellPrice === "number" ? String(record.sellPrice) : "",
    buyDate: record.buyDate,
    sellDate: record.sellDate ?? "",
    status: record.status,
    notes: record.notes ?? ""
  };
}

export function NFTFormModal({
  isOpen,
  onClose,
  initialValues
}: NFTFormModalProps) {
  const { addNFT, updateNFT } = useNFTStore();
  const [form, setForm] = useState<NFTFormValues>(defaultValues);
  const [errors, setErrors] = useState<Partial<Record<keyof NFTFormValues, string>>>({});

  useEffect(() => {
    if (isOpen) {
      setForm(toFormValues(initialValues));
      setErrors({});
    }
  }, [initialValues, isOpen]);

  const modalTitle = useMemo(
    () => (initialValues ? "Edit NFT record" : "Add NFT record"),
    [initialValues]
  );

  const setField = <K extends keyof NFTFormValues>(key: K, value: NFTFormValues[K]) => {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof NFTFormValues, string>> = {};

    if (!form.name.trim()) nextErrors.name = "NFT name is required.";
    if (!form.collection.trim()) nextErrors.collection = "Collection is required.";
    if (!form.image.trim()) nextErrors.image = "Image URL is required.";
    if (!form.buyPrice.trim() || Number(form.buyPrice) <= 0) {
      nextErrors.buyPrice = "Enter a valid buy price.";
    }
    if (!form.buyDate) nextErrors.buyDate = "Buy date is required.";

    if (form.status === "sold") {
      if (!form.sellPrice.trim() || Number(form.sellPrice) <= 0) {
        nextErrors.sellPrice = "Enter a valid sell price.";
      }
      if (!form.sellDate) {
        nextErrors.sellDate = "Sell date is required for sold NFTs.";
      }
    }

    if (form.sellDate && form.buyDate && new Date(form.sellDate) < new Date(form.buyDate)) {
      nextErrors.sellDate = "Sell date cannot be before buy date.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const nextRecord: NFTRecord = {
      id: initialValues?.id ?? crypto.randomUUID(),
      name: form.name.trim(),
      collection: form.collection.trim(),
      image: form.image.trim(),
      buyPrice: Number(form.buyPrice),
      sellPrice: form.status === "sold" ? Number(form.sellPrice) : undefined,
      buyDate: form.buyDate,
      sellDate: form.status === "sold" ? form.sellDate : undefined,
      status: form.status,
      notes: form.notes.trim() || undefined
    };

    if (initialValues) {
      updateNFT(initialValues.id, nextRecord);
    } else {
      addNFT(nextRecord);
    }

    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/10 p-4">
      <div className="surface-card max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg p-5 sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">
              Portfolio Entry
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">{modalTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="NFT name"
              error={errors.name}
              input={
                <input
                  value={form.name}
                  onChange={(event) => setField("name", event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-300"
                  placeholder="CloneX #4021"
                />
              }
            />

            <FormField
              label="Collection"
              error={errors.collection}
              input={
                <input
                  value={form.collection}
                  onChange={(event) => setField("collection", event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-300"
                  placeholder="RTFKT CloneX"
                />
              }
            />

            <FormField
              label="Image URL"
              error={errors.image}
              className="sm:col-span-2"
              input={
                <input
                  value={form.image}
                  onChange={(event) => setField("image", event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-300"
                  placeholder="https://..."
                />
              }
            />

            <FormField
              label="Buy price"
              error={errors.buyPrice}
              input={
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.buyPrice}
                  onChange={(event) => setField("buyPrice", event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-300"
                  placeholder="2.50"
                />
              }
            />

            <FormField
              label="Status"
              input={
                <select
                  value={form.status}
                  onChange={(event) =>
                    setField("status", event.target.value as NFTFormValues["status"])
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-300"
                >
                  <option value="owned">Owned</option>
                  <option value="sold">Sold</option>
                </select>
              }
            />

            <FormField
              label="Buy date"
              error={errors.buyDate}
              input={
                <input
                  type="date"
                  value={form.buyDate}
                  onChange={(event) => setField("buyDate", event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-300"
                />
              }
            />

            <FormField
              label="Sell price"
              error={errors.sellPrice}
              input={
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.sellPrice}
                  onChange={(event) => setField("sellPrice", event.target.value)}
                  disabled={form.status === "owned"}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-300 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="4.10"
                />
              }
            />

            <FormField
              label="Sell date"
              error={errors.sellDate}
              input={
                <input
                  type="date"
                  value={form.sellDate}
                  onChange={(event) => setField("sellDate", event.target.value)}
                  disabled={form.status === "owned"}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-300 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                />
              }
            />

            <FormField
              label="Notes"
              className="sm:col-span-2"
              input={
                <textarea
                  value={form.notes}
                  onChange={(event) => setField("notes", event.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-300"
                  placeholder="What was the thesis, entry setup, or reason for the exit?"
                />
              }
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              {initialValues ? "Save changes" : "Add record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  input: React.ReactNode;
  error?: string;
  className?: string;
}

function FormField({ label, input, error, className }: FormFieldProps) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-medium text-gray-500">{label}</span>
      {input}
      {error ? <span className="mt-2 block text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}
