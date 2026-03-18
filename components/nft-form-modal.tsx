"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faChevronDown,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import clsx from "clsx";
import { useAuth } from "@/hooks/use-auth";
import { useNFTStore } from "@/store/nft-store";
import { NFTCreateInput, NFTFormValues, NFTRecord } from "@/types/nft";

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
  notes: "",
};

const statusOptions: Array<{ value: NFTFormValues["status"]; label: string }> = [
  { value: "owned", label: "Owned" },
  { value: "sold", label: "Sold" },
];

function toFormValues(record: NFTRecord | null): NFTFormValues {
  if (!record) {
    return defaultValues;
  }

  return {
    name: record.name,
    collection: record.collection,
    image: record.image,
    buyPrice: String(record.buyPrice),
    sellPrice:
      typeof record.sellPrice === "number" ? String(record.sellPrice) : "",
    buyDate: record.buyDate,
    sellDate: record.sellDate ?? "",
    status: record.status,
    notes: record.notes ?? "",
  };
}

export function NFTFormModal({
  isOpen,
  onClose,
  initialValues,
}: NFTFormModalProps) {
  const { user } = useAuth();
  const { addNFT, updateNFT } = useNFTStore();
  const [form, setForm] = useState<NFTFormValues>(defaultValues);
  const [errors, setErrors] = useState<
    Partial<Record<keyof NFTFormValues, string>>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(toFormValues(initialValues));
      setErrors({});
      setSubmitError(null);
      setIsSubmitting(false);
      setIsStatusOpen(false);
    }
  }, [initialValues, isOpen]);

  useEffect(() => {
    if (!isStatusOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!statusMenuRef.current?.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsStatusOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isStatusOpen]);

  const modalTitle = useMemo(
    () => (initialValues ? "Edit NFT record" : "Add NFT record"),
    [initialValues],
  );

  const setField = <K extends keyof NFTFormValues>(
    key: K,
    value: NFTFormValues[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleStatusSelect = (value: NFTFormValues["status"]) => {
    setField("status", value);
    setIsStatusOpen(false);
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof NFTFormValues, string>> = {};

    if (!form.name.trim()) nextErrors.name = "NFT name is required.";
    if (!form.collection.trim()) {
      nextErrors.collection = "Collection is required.";
    }
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

    if (
      form.sellDate &&
      form.buyDate &&
      new Date(form.sellDate) < new Date(form.buyDate)
    ) {
      nextErrors.sellDate = "Sell date cannot be before buy date.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    if (!user) {
      setSubmitError("Sign in to save NFT records.");
      return;
    }

    const nextRecord: NFTCreateInput = {
      name: form.name.trim(),
      collection: form.collection.trim(),
      image: form.image.trim(),
      buyPrice: Number(form.buyPrice),
      sellPrice: form.status === "sold" ? Number(form.sellPrice) : null,
      buyDate: form.buyDate,
      sellDate: form.status === "sold" ? form.sellDate : null,
      status: form.status,
      notes: form.notes.trim(),
    };

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (initialValues) {
        await updateNFT(user.uid, initialValues.id, nextRecord);
      } else {
        await addNFT(user.uid, nextRecord);
      }

      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to save this NFT right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="surface-card hide-scrollbar max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg p-5 sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-400">
              Portfolio Entry
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">
              {modalTitle}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            title="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
          >
            <FontAwesomeIcon icon={faXmark} className="text-base" />
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 md:gap-5">
            <FormField
              label="NFT name"
              error={errors.name}
              input={
                <input
                  value={form.name}
                  onChange={(event) => setField("name", event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-300"
                  placeholder="Peepo #3286"
                />
              }
            />

            <FormField
              label="Collection"
              error={errors.collection}
              input={
                <input
                  value={form.collection}
                  onChange={(event) =>
                    setField("collection", event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-300"
                  placeholder="Peepo"
                />
              }
            />
          </div>

          <FormField
            label="Image URL"
            error={errors.image}
            input={
              <input
                value={form.image}
                onChange={(event) => setField("image", event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-300"
                placeholder="https://opensea.io/"
              />
            }
          />

          <div className="grid grid-cols-2 gap-4 md:gap-5">
            <FormField
              label="Buy price"
              error={errors.buyPrice}
              input={
                <input
                  type="number"
                  min="0"
                  step="0.000005"
                  value={form.buyPrice}
                  onChange={(event) => setField("buyPrice", event.target.value)}
                  className="hide-number-spin w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-300"
                  placeholder="0.005"
                />
              }
            />

            <FormField
              label="Buy date"
              error={errors.buyDate}
              input={
                <InputAdornmentField icon={faCalendarDays}>
                  <input
                    type="date"
                    value={form.buyDate}
                    onChange={(event) =>
                      setField("buyDate", event.target.value)
                    }
                    className="form-select-like form-date-input w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pr-11 text-gray-900 outline-none transition focus:border-gray-300"
                  />
                </InputAdornmentField>
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-5">
            <FormField
              label="Sell price"
              error={errors.sellPrice}
              input={
                <input
                  type="number"
                  min="0"
                  step="0.000005"
                  value={form.sellPrice}
                  onChange={(event) =>
                    setField("sellPrice", event.target.value)
                  }
                  disabled={form.status === "owned"}
                  className="hide-number-spin w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-300 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="0.01"
                />
              }
            />

            <FormField
              label="Status"
              input={
                <StatusDropdown
                  isOpen={isStatusOpen}
                  value={form.status}
                  onOpen={() => setIsStatusOpen(true)}
                  onClose={() => setIsStatusOpen(false)}
                  onSelect={handleStatusSelect}
                  menuRef={statusMenuRef}
                />
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-5">
            <FormField
              label="Sell date"
              error={errors.sellDate}
              input={
                <InputAdornmentField icon={faCalendarDays}>
                  <input
                    type="date"
                    value={form.sellDate}
                    onChange={(event) =>
                      setField("sellDate", event.target.value)
                    }
                    disabled={form.status === "owned"}
                    className="form-select-like form-date-input w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pr-11 text-gray-900 outline-none transition focus:border-gray-300 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </InputAdornmentField>
              }
            />

            <div className="block" />
          </div>

          <FormField
            label="Notes"
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

          {submitError ? (
            <p className="text-sm text-rose-600">{submitError}</p>
          ) : null}

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
              disabled={isSubmitting}
              className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? initialValues
                  ? "Saving..."
                  : "Adding..."
                : initialValues
                  ? "Save changes"
                  : "Add record"}
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
    <div className={clsx("min-w-0 w-full", className)}>
      <span className="mb-2 block text-sm font-medium text-gray-500">
        {label}
      </span>
      {input}
      {error ? (
        <span className="mt-2 block text-xs text-rose-600">{error}</span>
      ) : null}
    </div>
  );
}

function InputAdornmentField({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon: typeof faChevronDown;
}) {
  return (
    <div className="relative min-w-0 w-full">
      {children}
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
        <FontAwesomeIcon icon={icon} />
      </span>
    </div>
  );
}

interface StatusDropdownProps {
  isOpen: boolean;
  value: NFTFormValues["status"];
  onOpen: () => void;
  onClose: () => void;
  onSelect: (value: NFTFormValues["status"]) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

function StatusDropdown({
  isOpen,
  value,
  onOpen,
  onClose,
  onSelect,
  menuRef,
}: StatusDropdownProps) {
  const activeLabel =
    statusOptions.find((option) => option.value === value)?.label ?? "Owned";

  return (
    <div className="relative min-w-0 w-full" ref={menuRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          if (isOpen) {
            onClose();
            return;
          }

          onOpen();
        }}
        className={clsx(
          "flex w-full items-center justify-between border border-gray-200 bg-white px-4 py-3 text-left text-gray-900 outline-none transition focus:border-gray-300",
          isOpen ? "rounded-t-lg rounded-b-none border-b-0" : "rounded-lg",
        )}
      >
        <span className="text-sm">{activeLabel}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={clsx(
            "text-sm text-gray-400 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-20 -mt-px overflow-hidden rounded-b-lg border border-gray-200 border-t-0 bg-white">
          {statusOptions.map((option) => {
            const isActive = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onSelect(option.value);
                  onClose();
                }}
                className={clsx(
                  "flex w-full items-center px-4 py-3 text-left text-sm transition",
                  isActive
                    ? "bg-gray-50 text-gray-900"
                    : "text-gray-700 hover:bg-gray-50",
                  option.value === "sold" && "border-t border-gray-200",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}







