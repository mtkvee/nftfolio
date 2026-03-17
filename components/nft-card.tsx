"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { faTrashCan } from "@fortawesome/free-regular-svg-icons";
import Link from "next/link";
import clsx from "clsx";
import { NFTRecord } from "@/types/nft";

interface NFTCardProps {
  record: NFTRecord;
  onEdit: (record: NFTRecord) => void;
  onDelete: (id: string) => Promise<void> | void;
}

export function NFTCard({ record, onEdit, onDelete }: NFTCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await Promise.resolve(onDelete(record.id));
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <article className="surface-card group rounded-lg p-3 transition duration-200 hover:-translate-y-1">
        <Link href={`/nft/${record.id}`} className="block">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100">
            <img
              src={record.image}
              alt={record.name}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
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
        </Link>

        <div className="p-4 pt-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Link href={`/nft/${record.id}`} className="block">
                <h3 className="text-base font-semibold text-gray-900 transition hover:text-black">
                  {record.name}
                </h3>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Edit NFT"
                title="Edit"
                onClick={() => onEdit(record)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[1.05rem] text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              >
                <FontAwesomeIcon icon={faPenToSquare} />
              </button>
              <button
                type="button"
                aria-label="Delete NFT"
                title="Delete"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[1.05rem] text-gray-500 transition hover:bg-gray-100 hover:text-rose-500"
              >
                <FontAwesomeIcon icon={faTrashCan} />
              </button>
            </div>
          </div>
        </div>
      </article>

      {isDeleteDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/55 p-4 backdrop-blur-[6px]">
          <div className="surface-card w-full max-w-xs rounded-lg p-4">
            <h2 className="text-center text-base font-medium text-gray-900">
              Are you sure to delete?
            </h2>
            <div
              className="my-3 text-center text-sm text-gray-500"
              style={{ fontSize: "0.85rem" }}
            >
              This action cannot be undone.
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
