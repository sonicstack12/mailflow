import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { Company, HrContact, PlatformSetting } from "./models.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolveDataFile(name: string): string {
  const candidates = [
    join(process.cwd(), "src", "data", name),
    join(process.cwd(), "dist", "data", name),
    join(__dirname, "../data", name),
    join(__dirname, "../../src/data", name),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error(`Missing data file: ${name} (looked in ${candidates.join(", ")})`);
}

type CompanySeed = {
  name: string;
  industry?: string;
  employer_type?: string;
  company_size?: string;
  size_confidence?: string;
  founded_year?: string;
  hq_location?: string;
  office_locations?: string;
  location_confidence?: string;
  fresher_roles?: string;
  ctc_software_engineer?: string;
  ctc_fullstack?: string;
  ctc_system_engineer?: string;
  ctc_frontend?: string;
  ctc_backend?: string;
  ctc_mern?: string;
  ctc_data_scientist?: string;
  ctc_aiml?: string;
  ctc_data_analyst?: string;
  ctc_marketing?: string;
  description?: string;
  work_mode?: string;
  website?: string;
  website_status?: string;
  careers_link?: string;
  fresher_hiring_signal?: string;
  priority?: string;
  pay_caveat?: string;
  profile_source?: string;
  last_reviewed?: string;
  sort_order?: number;
};

type HrSeed = {
  sort_order?: number;
  name: string;
  email: string;
  title?: string;
  company?: string;
};

const DEFAULT_PLATFORM_SETTINGS: Array<{ key: string; value: string }> = [
  { key: "site_name", value: "MailFlow" },
  { key: "support_email", value: "support@mailflow.app" },
  { key: "max_emails_per_day_free", value: "250" },
  { key: "premium_max_emails", value: "0" },
  { key: "free_log_retention_hours", value: "24" },
  { key: "premium_log_retention_hours", value: "168" },
  { key: "enable_signups", value: "true" },
  { key: "require_email_verification", value: "true" },
  { key: "enable_notifications", value: "true" },
  { key: "maintenance_mode", value: "false" },
];

async function insertInChunks<T extends object>(insert: (chunk: T[]) => Promise<unknown>, docs: T[], chunkSize = 500) {
  for (let i = 0; i < docs.length; i += chunkSize) {
    await insert(docs.slice(i, i + chunkSize));
  }
}

/** Idempotent: only loads companies when the collection is empty. */
export async function seedCompaniesIfEmpty() {
  const count = await Company.countDocuments();
  if (count > 0) {
    console.log(`[db] companies already present (${count}), skip seed`);
    return;
  }

  const raw = readFileSync(resolveDataFile("companies.json"), "utf-8");
  const rows = JSON.parse(raw) as CompanySeed[];
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("companies.json is empty");
  }

  const docs = rows.map((row, index) => ({
    _id: uuidv4(),
    name: row.name,
    industry: row.industry || "",
    employer_type: row.employer_type || "",
    company_size: row.company_size || "",
    size_confidence: row.size_confidence || "",
    founded_year: row.founded_year || "",
    hq_location: row.hq_location || "",
    office_locations: row.office_locations || "",
    location_confidence: row.location_confidence || "",
    fresher_roles: row.fresher_roles || "",
    ctc_software_engineer: row.ctc_software_engineer || "",
    ctc_fullstack: row.ctc_fullstack || "",
    ctc_system_engineer: row.ctc_system_engineer || "",
    ctc_frontend: row.ctc_frontend || "",
    ctc_backend: row.ctc_backend || "",
    ctc_mern: row.ctc_mern || "",
    ctc_data_scientist: row.ctc_data_scientist || "",
    ctc_aiml: row.ctc_aiml || "",
    ctc_data_analyst: row.ctc_data_analyst || "",
    ctc_marketing: row.ctc_marketing || "",
    description: row.description || "",
    work_mode: row.work_mode || "",
    website: row.website || "",
    website_status: row.website_status || "",
    careers_link: row.careers_link || "",
    fresher_hiring_signal: row.fresher_hiring_signal || "",
    priority: row.priority || "",
    pay_caveat: row.pay_caveat || "",
    profile_source: row.profile_source || "",
    last_reviewed: row.last_reviewed || "",
    sort_order: row.sort_order ?? index + 1,
  }));

  await insertInChunks((chunk) => Company.insertMany(chunk, { ordered: false }), docs);
  console.log(`[db] seeded ${docs.length} companies`);
}

/** Idempotent: only loads HR contacts when the collection is empty. */
export async function seedHrContactsIfEmpty() {
  const count = await HrContact.countDocuments();
  if (count > 0) {
    console.log(`[db] HR contacts already present (${count}), skip seed`);
    return;
  }

  const raw = readFileSync(resolveDataFile("hr-contacts.json"), "utf-8");
  const rows = JSON.parse(raw) as HrSeed[];
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("hr-contacts.json is empty");
  }

  const docs = rows.map((row, index) => ({
    _id: uuidv4(),
    name: row.name,
    email: row.email.toLowerCase().trim(),
    title: row.title || "",
    company: row.company || "",
    sort_order: row.sort_order ?? index + 1,
  }));

  await insertInChunks((chunk) => HrContact.insertMany(chunk, { ordered: false }), docs);
  console.log(`[db] seeded ${docs.length} HR contacts`);
}

export async function ensurePlatformSettings() {
  for (const s of DEFAULT_PLATFORM_SETTINGS) {
    await PlatformSetting.findOneAndUpdate(
      { key: s.key },
      { $setOnInsert: { _id: uuidv4(), key: s.key, value: s.value } },
      { upsert: true }
    );
  }
}

/** Safe for every boot — skips when data already exists (no Render Shell needed). */
export async function seedDirectoryDataIfEmpty() {
  await ensurePlatformSettings();
  await seedCompaniesIfEmpty();
  await seedHrContactsIfEmpty();
}
