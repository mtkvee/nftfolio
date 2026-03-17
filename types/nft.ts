export type NFTStatus = "owned" | "sold";

export interface NFTRecord {
  id: string;
  userId: string;
  name: string;
  collection: string;
  image: string;
  buyPrice: number;
  sellPrice: number | null;
  buyDate: string;
  sellDate: string | null;
  status: NFTStatus;
  notes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface NFTFormValues {
  name: string;
  collection: string;
  image: string;
  buyPrice: string;
  sellPrice: string;
  buyDate: string;
  sellDate: string;
  status: NFTStatus;
  notes: string;
}

export interface NFTCreateInput {
  name: string;
  collection: string;
  image: string;
  buyPrice: number;
  sellPrice: number | null;
  buyDate: string;
  sellDate: string | null;
  status: NFTStatus;
  notes: string;
}

export type NFTUpdateInput = NFTCreateInput;

export type NFTFilter = "all" | NFTStatus;
