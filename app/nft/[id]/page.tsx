import { NFTDetailClient } from "./nft-detail-client";

interface NFTDetailRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function NFTDetailRoute({ params }: NFTDetailRouteProps) {
  const { id } = await params;

  return <NFTDetailClient nftId={id} />;
}
