"use client";

import { useParams } from "next/navigation";
import { NFTDetailsPage } from "@/components/nft-details-page";

export default function NFTDetailRoute() {
  const params = useParams<{ id: string }>();
  const nftId = typeof params.id === "string" ? params.id : "";

  return <NFTDetailsPage nftId={nftId} />;
}
