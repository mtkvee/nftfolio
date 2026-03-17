"use client";

import { NFTDetailsPage } from "@/components/nft-details-page";

interface NFTDetailClientProps {
  nftId: string;
}

export function NFTDetailClient({ nftId }: NFTDetailClientProps) {
  return <NFTDetailsPage nftId={nftId} />;
}
