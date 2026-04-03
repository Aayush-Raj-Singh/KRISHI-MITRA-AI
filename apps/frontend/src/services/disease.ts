import {
  createDiseaseApi,
  type DiseasePredictionResponse as DiseasePrediction,
} from "@krishimitra/shared";
import api, { unwrap } from "./api";
import {
  getOfflineRecord,
  isOnline,
  listOfflineRecords,
  removeOfflineRecord,
  saveOfflineRecord,
} from "../utils/offlineStorage";
import { compressImage, dataUrlToFile, fileToDataUrl } from "../utils/imageCompression";

const diseaseApi = createDiseaseApi({ api, unwrap });

export type { DiseasePrediction };

type QueuedDiseaseItem = {
  id: string;
  filename: string;
  dataUrl: string;
  createdAt: string;
};

const listQueuedDiseaseItems = async (): Promise<QueuedDiseaseItem[]> => {
  const records = await listOfflineRecords<QueuedDiseaseItem>("images");
  return records
    .map((record) => record.value)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
};

export const queueDiseaseDetection = async (file: File) => {
  const compressed = await compressImage(file);
  const dataUrl = await fileToDataUrl(compressed);
  const item: QueuedDiseaseItem = {
    id: `disease_${Date.now()}`,
    filename: compressed.name,
    dataUrl,
    createdAt: new Date().toISOString(),
  };
  await saveOfflineRecord("images", item.id, item);
  const queued = await listQueuedDiseaseItems();
  const staleItems = queued.slice(0, Math.max(0, queued.length - 20));
  await Promise.all(staleItems.map((entry) => removeOfflineRecord("images", entry.id)));
};

export const processDiseaseQueue = async (): Promise<number> => {
  if (!isOnline()) return 0;
  const queue = await listQueuedDiseaseItems();
  if (!queue.length) return 0;
  let processed = 0;
  for (const item of queue) {
    try {
      const file = dataUrlToFile(item.dataUrl, item.filename);
      await predictDisease(file);
      processed += 1;
      await removeOfflineRecord("images", item.id);
    } catch {}
  }
  return processed;
};

export const initDiseaseQueueSync = () => {
  if (typeof window === "undefined") return;
  window.addEventListener("online", () => {
    void processDiseaseQueue();
  });
  if (isOnline()) {
    void processDiseaseQueue();
  }
};

export const predictDisease = async (file: File): Promise<DiseasePrediction> => {
  const compressed = await compressImage(file);
  const formData = new FormData();
  formData.append("image", compressed);
  return diseaseApi.predict(formData);
};

export const fetchCachedDisease = async (key: string) => {
  return getOfflineRecord<DiseasePrediction>("api", key);
};
