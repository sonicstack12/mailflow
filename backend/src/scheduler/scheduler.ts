import cron from "node-cron";
import { ScheduledEmail } from "../db/models.js";
import { processScheduledJob } from "./emailWorker.js";

let processing = false;

async function processReadyJobs() {
  // Prevent overlapping runs
  if (processing) return;
  processing = true;

  try {
    // Find all pending jobs whose scheduled_time has passed
    const now = new Date();
    const jobs = await ScheduledEmail.find({
      status: "pending",
      scheduled_time: { $lte: now },
    })
      .sort({ scheduled_time: 1 })
      .limit(5)
      .lean();

    if (jobs.length === 0) return;

    // eslint-disable-next-line no-console
    console.log(`[scheduler] found ${jobs.length} ready job(s)`);

    for (const job of jobs) {
      // Mark as 'sending' to prevent duplicate picks
      const updateResult = await ScheduledEmail.updateOne(
        { _id: job._id, status: "pending" },
        { status: "sending" }
      );

      // Only process if we successfully updated (prevents race conditions)
      if (updateResult.modifiedCount === 0) continue;

      try {
        await processScheduledJob({ ...job, status: "sending" } as any);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        // eslint-disable-next-line no-console
        console.error(`[scheduler] job ${job._id} crashed: ${msg}`);
        await ScheduledEmail.updateOne({ _id: job._id }, { status: "failed" });
      }
    }
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[scheduler] tick error:", err);
  } finally {
    processing = false;
  }
}

export function startScheduler() {
  // Run every minute
  cron.schedule("* * * * *", () => {
    processReadyJobs();
  });
  // eslint-disable-next-line no-console
  console.log("[scheduler] started — checking for pending jobs every minute");
}
