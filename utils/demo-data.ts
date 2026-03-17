import { NFTRecord } from "@/types/nft";

export const demoNFTs: NFTRecord[] = [
  {
    id: "azuki-1",
    name: "Azuki #1287",
    collection: "Azuki",
    image:
      "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&w=900&q=80",
    buyPrice: 6.2,
    sellPrice: 8.9,
    buyDate: "2025-10-12",
    sellDate: "2025-12-18",
    status: "sold",
    notes: "Bought on a dip before the collection re-rated."
  },
  {
    id: "doodles-1",
    name: "Doodles #5402",
    collection: "Doodles",
    image:
      "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?auto=format&fit=crop&w=900&q=80",
    buyPrice: 2.75,
    buyDate: "2026-01-21",
    status: "owned",
    notes: "Holding for ecosystem expansion and brand partnerships."
  },
  {
    id: "moonbirds-1",
    name: "Moonbirds #910",
    collection: "Moonbirds",
    image:
      "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=900&q=80",
    buyPrice: 3.4,
    sellPrice: 2.6,
    buyDate: "2025-08-04",
    sellDate: "2025-09-09",
    status: "sold",
    notes: "Exited early to rotate capital."
  }
];
