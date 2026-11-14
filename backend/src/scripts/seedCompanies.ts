import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { connectDb, disconnectDb } from "../db/pool.js";
import { Company } from "../db/models.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

async function run() {
  await connectDb();

  const raw = readFileSync(join(__dirname, "../data/companies.json"), "utf-8");
  const rows = JSON.parse(raw) as CompanySeed[];

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("companies.json is empty");
  }

  await Company.deleteMany({});

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

  const chunkSize = 500;
  for (let i = 0; i < docs.length; i += chunkSize) {
    await Company.insertMany(docs.slice(i, i + chunkSize), { ordered: false });
  }

  // eslint-disable-next-line no-console
  console.log(`[db:seed-companies] inserted ${docs.length} companies`);
  await disconnectDb();
}

run().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error("[db:seed-companies] failed", err);
  try {
    await disconnectDb();
  } catch {
    // ignore
  }
  process.exit(1);
});
