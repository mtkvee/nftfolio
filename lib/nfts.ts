import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import { NFTCreateInput, NFTRecord, NFTUpdateInput } from "@/types/nft";

const NFTS_COLLECTION = "nfts";

function mapNFTDocument(id: string, data: Record<string, unknown>): NFTRecord {
  return {
    id,
    userId: String(data.userId ?? ""),
    name: String(data.name ?? ""),
    collection: String(data.collection ?? ""),
    image: String(data.image ?? ""),
    buyPrice: Number(data.buyPrice ?? 0),
    sellPrice:
      typeof data.sellPrice === "number"
        ? data.sellPrice
        : data.sellPrice == null
          ? null
          : Number(data.sellPrice),
    buyDate: String(data.buyDate ?? ""),
    sellDate: data.sellDate ? String(data.sellDate) : null,
    status: data.status === "sold" ? "sold" : "owned",
    notes: String(data.notes ?? ""),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
}

function toFirestorePayload(data: NFTCreateInput | NFTUpdateInput) {
  return {
    name: data.name,
    collection: data.collection,
    image: data.image,
    buyPrice: data.buyPrice,
    sellPrice: data.sellPrice,
    buyDate: data.buyDate,
    sellDate: data.sellDate,
    status: data.status,
    notes: data.notes
  };
}

function getTimestampMillis(value: unknown): number {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toMillis" in value &&
    typeof (value as { toMillis: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }

  return 0;
}

async function assertNFTBelongsToUser(userId: string, nftId: string) {
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, NFTS_COLLECTION, nftId));

  if (!snapshot.exists()) {
    throw new Error("This NFT record does not exist.");
  }

  const data = snapshot.data();

  if (data.userId !== userId) {
    throw new Error("You do not have access to this NFT record.");
  }
}

export async function getUserNFTs(userId: string): Promise<NFTRecord[]> {
  const db = getFirestoreDb();
  const nftsQuery = query(
    collection(db, NFTS_COLLECTION),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(nftsQuery);

  return snapshot.docs
    .map((item) => mapNFTDocument(item.id, item.data() as Record<string, unknown>))
    .sort((left, right) => getTimestampMillis(right.createdAt) - getTimestampMillis(left.createdAt));
}

export async function createNFT(userId: string, data: NFTCreateInput): Promise<void> {
  const db = getFirestoreDb();
  await addDoc(collection(db, NFTS_COLLECTION), {
    userId,
    ...toFirestorePayload(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateNFT(
  userId: string,
  id: string,
  data: NFTUpdateInput
): Promise<void> {
  const db = getFirestoreDb();
  await assertNFTBelongsToUser(userId, id);
  await updateDoc(doc(db, NFTS_COLLECTION, id), {
    ...toFirestorePayload(data),
    updatedAt: serverTimestamp()
  });
}

export async function deleteNFT(userId: string, id: string): Promise<void> {
  const db = getFirestoreDb();
  await assertNFTBelongsToUser(userId, id);
  await deleteDoc(doc(db, NFTS_COLLECTION, id));
}

export async function deleteAllUserNFTs(userId: string): Promise<void> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(
    query(collection(db, NFTS_COLLECTION), where("userId", "==", userId))
  );

  if (snapshot.empty) {
    return;
  }

  const docs = snapshot.docs;

  for (let index = 0; index < docs.length; index += 400) {
    const batch = writeBatch(db);

    for (const item of docs.slice(index, index + 400)) {
      batch.delete(item.ref);
    }

    await batch.commit();
  }
}
