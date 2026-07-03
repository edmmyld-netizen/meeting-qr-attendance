import { DB } from "./types";
import fs from "fs";
import path from "path";

const EMPTY: DB = { meetings: [], attendance: [], seq: 0 };

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KV_KEY = "meeting_qr_db";

const FILE = path.join(process.cwd(), "data", "db.json");

function useKV(): boolean {
  return Boolean(KV_URL && KV_TOKEN);
}

/* ── Upstash Redis (REST) ── */
async function kvGet(): Promise<DB> {
  const res = await fetch(`${KV_URL}/get/${KV_KEY}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!json.result) return { ...EMPTY };
  try {
    return JSON.parse(json.result) as DB;
  } catch {
    return { ...EMPTY };
  }
}

async function kvSet(db: DB): Promise<void> {
  await fetch(`${KV_URL}/set/${KV_KEY}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(db),
  });
}

/* ── Local JSON file (dev fallback) ── */
function fileGet(): DB {
  try {
    if (!fs.existsSync(FILE)) return { ...EMPTY };
    return JSON.parse(fs.readFileSync(FILE, "utf-8")) as DB;
  } catch {
    return { ...EMPTY };
  }
}

function fileSet(db: DB): void {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

/* ── Public API ── */
export async function readDB(): Promise<DB> {
  if (useKV()) return kvGet();
  return fileGet();
}

export async function writeDB(db: DB): Promise<void> {
  if (useKV()) return kvSet(db);
  fileSet(db);
}
