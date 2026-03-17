export type NFTStatus = "owned" | "sold";

export interface NFTRecord {
  id: string;
  name: string;
  collection: string;
  image: string;
  buyPrice: number;
  sellPrice?: number;
  buyDate: string;
  sellDate?: string;
  status: NFTStatus;
  notes?: string;
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

export type NFTFilter = "all" | NFTStatus;
