import mongoose from 'mongoose';
import { env } from './src/config/env.js';
import { ScheduledEmail } from './src/db/models.js';

async function check() {
  await mongoose.connect(env.MONGODB_URI);
  const jobs = await ScheduledEmail.find({}, 'name status scheduled_time emails_sent emails_failed').lean();
  console.log("ALL JOBS:", jobs);
  process.exit(0);
}
check().catch(console.error);
