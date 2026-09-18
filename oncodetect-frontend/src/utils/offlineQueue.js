import { openDB } from "idb";

const DB_NAME = "oncodetect-offline";
const DB_VERSION = 1;
const STORE = "pending";

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("timestamp", "timestamp");
          store.createIndex("status", "status");
        }
      },
    });
  }
  return dbPromise;
}

export async function enqueueItem(type, payload) {
  const db = await getDB();
  const item = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    type,
    payload,
    timestamp: new Date().toISOString(),
    status: "pending",
  };
  await db.put(STORE, item);
  return item;
}

export async function getPendingItems() {
  const db = await getDB();
  const all = await db.getAll(STORE);
  return all
    .filter((it) => it.status === "pending" || it.status === "error")
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

export async function setItemStatus(id, status) {
  const db = await getDB();
  const item = await db.get(STORE, id);
  if (item) {
    item.status = status;
    await db.put(STORE, item);
  }
}

export async function completeItem(id, result) {
  const db = await getDB();
  const item = await db.get(STORE, id);
  if (item) {
    item.status = "completed";
    item.result = result;
    item.completedAt = new Date().toISOString();
    await db.put(STORE, item);
  }
}

export async function getCompletedItems() {
  const db = await getDB();
  const all = await db.getAll(STORE);
  return all
    .filter((it) => it.status === "completed")
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

export async function removeItem(id) {
  const db = await getDB();
  await db.delete(STORE, id);
}

export async function clearQueue() {
  const db = await getDB();
  await db.clear(STORE);
}
