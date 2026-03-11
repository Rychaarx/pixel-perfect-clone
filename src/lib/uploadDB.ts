/**
 * IndexedDB-based upload tracking for resumable uploads.
 * Stores metadata about in-progress and failed uploads so they can be retried.
 */

const DB_NAME = "upload_tracker";
const DB_VERSION = 1;
const STORE_NAME = "uploads";

export interface UploadRecord {
  id: string; // unique key
  fileName: string;
  fileSize: number;
  fileType: string;
  /** Last modified timestamp of the original file — used to verify it's the same file on retry */
  fileLastModified: number;
  /** Destination path in storage bucket */
  storagePath: string;
  bucketName: string;
  /** Which context this upload belongs to */
  context: "catalog" | "seasons";
  /** Extra metadata (e.g. seasonIdx, epIdx, catalogItemId) */
  meta?: Record<string, string | number>;
  status: "pending" | "uploading" | "completed" | "failed";
  progress: number;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("context", "context", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveUpload(record: UploadRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getUpload(id: string): Promise<UploadRecord | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteUpload(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getUploadsByContext(context: "catalog" | "seasons"): Promise<UploadRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const idx = tx.objectStore(STORE_NAME).index("context");
    const req = idx.getAll(context);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingUploads(context?: "catalog" | "seasons"): Promise<UploadRecord[]> {
  const all = context ? await getUploadsByContext(context) : await getAllUploads();
  return all.filter((r) => r.status === "failed" || r.status === "pending" || r.status === "uploading");
}

async function getAllUploads(): Promise<UploadRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function clearCompletedUploads(context?: "catalog" | "seasons"): Promise<void> {
  const all = context ? await getUploadsByContext(context) : await getAllUploads();
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  for (const r of all) {
    if (r.status === "completed") {
      store.delete(r.id);
    }
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Generate a unique upload ID based on file properties */
export function generateUploadId(fileName: string, fileSize: number, storagePath: string): string {
  return `${fileName}-${fileSize}-${storagePath}`;
}

/** Check if a File matches a stored UploadRecord (same name, size, lastModified) */
export function fileMatchesRecord(file: File, record: UploadRecord): boolean {
  return (
    file.name === record.fileName &&
    file.size === record.fileSize &&
    file.lastModified === record.fileLastModified
  );
}
