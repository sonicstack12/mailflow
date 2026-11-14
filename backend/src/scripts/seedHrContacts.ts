import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { connectDb, disconnectDb } from "../db/pool.js";
import { HrContact } from "../db/models.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

type HrSeed = {
  sort_order?: number;
  name: string;
  email: string;
  title?: string;
  company?: string;
};

async function run() {
  await connectDb();

  const raw = readFileSync(join(__dirname, "../data/hr-contacts.json"), "utf-8");
  const rows = JSON.parse(raw) as HrSeed[];

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("hr-contacts.json is empty");
  }

  await HrContact.deleteMany({});

  const docs = rows.map((row, index) => ({
    _id: uuidv4(),
    name: row.name,
    email: row.email.toLowerCase().trim(),
    title: row.title || "",
    company: row.company || "",
    sort_order: row.sort_order ?? index + 1,
  }));

  const chunkSize = 500;
  for (let i = 0; i < docs.length; i += chunkSize) {
    await HrContact.insertMany(docs.slice(i, i + chunkSize), { ordered: false });
  }

  // eslint-disable-next-line no-console
  console.log(`[db:seed-hr-contacts] inserted ${docs.length} HR contacts`);
  await disconnectDb();
}

run().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error("[db:seed-hr-contacts] failed", err);
  try {
    await disconnectDb();
  } catch {
    // ignore
  }
  process.exit(1);
});
