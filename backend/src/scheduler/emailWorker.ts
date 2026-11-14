
import { v4 as uuidv4 } from "uuid";

import { Profile, PlatformSetting, SmtpConfig, EmailTemplate, ScheduledEmail, EmailLog } from "../db/models.js";
import { decryptSmtpPassword } from "../crypto/smtpPassword.js";
import { replaceTemplateVariables } from "../utils/templateVars.js";
import { calculateEmailDelaySec } from "../utils/emailDelay.js";
import { runPythonMailer } from "../utils/pythonMailer.js";

interface ScheduledJob {
  _id: string;
  user_id: string;
  name: string;
  template_id: string | null;
  smtp_config_id: string | null;
  recipients: any; // JSON object or array
  recipient_count: number;
  scheduled_time: Date;
  timezone: string;
  status: string;
  emails_sent: number;
  emails_failed: number;
}

async function getPlatformSetting(key: string, fallback: string): Promise<string> {
  const doc = await PlatformSetting.findOne({ key }).lean();
  return doc?.value ?? fallback;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if the user can send more emails today based on their subscription tier.
 * Returns { allowed: boolean; remaining: number }.
 */
async function checkDailyLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  // Reset daily count if needed
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const profile = await Profile.findOne({ user_id: userId });
  if (!profile) return { allowed: false, remaining: 0 };

  const lastReset = new Date(profile.last_email_reset_date);
  lastReset.setHours(0, 0, 0, 0);

  if (lastReset < today) {
    profile.daily_email_count = 0;
    profile.last_email_reset_date = today;
    await profile.save();
  }

  const premiumActive =
    profile.subscription_tier === "premium" &&
    (!profile.subscription_expires_at || new Date(profile.subscription_expires_at) > new Date());

  if (premiumActive) {
    return { allowed: true, remaining: Infinity };
  }

  const freeLimit = Number(await getPlatformSetting("max_emails_per_day_free", "250"));
  const remaining = Math.max(0, freeLimit - profile.daily_email_count);
  return { allowed: remaining > 0, remaining };
}

/**
 * Process a single scheduled email job:
 * 1. Load template + SMTP config
 * 2. Parse recipients
 * 3. Send each email with smart delays
 * 4. Log results
 * 5. Update job status
 */
export async function processScheduledJob(job: ScheduledJob): Promise<void> {
  const jobId = job._id;
  const userId = job.user_id;

  // eslint-disable-next-line no-console
  console.log(`[scheduler] processing job ${jobId} "${job.name}" for user ${userId}`);

  // ── Validate template ──────────────────────────────────
  if (!job.template_id) {
    await ScheduledEmail.updateOne(
      { _id: jobId },
      { status: "failed", emails_failed: job.recipient_count }
    );
    // eslint-disable-next-line no-console
    console.error(`[scheduler] job ${jobId} has no template_id — marked failed`);
    return;
  }

  const template = await EmailTemplate.findById(job.template_id).lean();
  if (!template) {
    await ScheduledEmail.updateOne(
      { _id: jobId },
      { status: "failed", emails_failed: job.recipient_count }
    );
    // eslint-disable-next-line no-console
    console.error(`[scheduler] job ${jobId} template not found — marked failed`);
    return;
  }

  // ── Validate SMTP config ───────────────────────────────
  if (!job.smtp_config_id) {
    await ScheduledEmail.updateOne(
      { _id: jobId },
      { status: "failed", emails_failed: job.recipient_count }
    );
    // eslint-disable-next-line no-console
    console.error(`[scheduler] job ${jobId} has no smtp_config_id — marked failed`);
    return;
  }

  const smtp = await SmtpConfig.findOne({ _id: job.smtp_config_id, user_id: userId }).lean();
  if (!smtp) {
    await ScheduledEmail.updateOne(
      { _id: jobId },
      { status: "failed", emails_failed: job.recipient_count }
    );
    // eslint-disable-next-line no-console
    console.error(`[scheduler] job ${jobId} SMTP config not found — marked failed`);
    return;
  }

  // ── Verify SMTP connection ───────────────────────────────
  let smtpPassword = "";
  try {
    smtpPassword = decryptSmtpPassword(smtp.password_enc).replace(/\s+/g, '');
    const payload = {
        action: "test",
        smtp_host: smtp.host,
        smtp_port: smtp.port,
        user: smtp.username,
        password: smtpPassword,
        from_name: smtp.from_name,
        from_email: smtp.from_email
    };
    const result = await runPythonMailer(payload);
    if (!result.success) {
        throw new Error(result.error || "Python script test failed");
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "SMTP connection failed";
    await ScheduledEmail.updateOne(
      { _id: jobId },
      { status: "failed", emails_failed: job.recipient_count }
    );
    // eslint-disable-next-line no-console
    console.error(`[scheduler] job ${jobId} SMTP verify failed: ${msg}`);
    return;
  }

  // ── Parse recipients ───────────────────────────────────
  let recipients: Array<Record<string, unknown>>;
  try {
    if (typeof job.recipients === "string") {
      recipients = JSON.parse(job.recipients);
    } else if (Array.isArray(job.recipients)) {
      recipients = job.recipients;
    } else {
      recipients = [];
    }
  } catch {
    await ScheduledEmail.updateOne(
      { _id: jobId },
      { status: "failed", emails_failed: job.recipient_count }
    );
    // eslint-disable-next-line no-console
    console.error(`[scheduler] job ${jobId} invalid recipients JSON — marked failed`);
    return;
  }

  // ── Send emails one by one with smart delays ───────────
  let sent = job.emails_sent;
  let failed = job.emails_failed;
  const totalRecipients = recipients.length;

  for (let i = 0; i < totalRecipients; i++) {
    const currentJob = await ScheduledEmail.findById(jobId).lean();
    if (!currentJob) {
      // eslint-disable-next-line no-console
      console.log(`[scheduler] job ${jobId} was deleted during execution. Stopping.`);
      return;
    }

    const recipient = recipients[i];
    const recipientEmail = String(recipient.email || recipient.Email || "").trim();
    const recipientName = String(recipient.name || recipient.Name || recipient.full_name || "").trim();

    if (!recipientEmail || !recipientEmail.includes("@")) {
      failed++;
      await logEmail(userId, jobId, recipientEmail || "invalid", recipientName, template.subject, "failed", "Invalid email address");
      await updateJobProgress(jobId, sent, failed);
      continue;
    }

    // Check daily limit
    const { allowed } = await checkDailyLimit(userId);
    if (!allowed) {
      // Mark remaining as failed due to limit
      const remaining = totalRecipients - i;
      failed += remaining;
      await updateJobProgress(jobId, sent, failed);
      await ScheduledEmail.updateOne({ _id: jobId }, { status: "failed" });
      // eslint-disable-next-line no-console
      console.warn(`[scheduler] job ${jobId} hit daily limit at email ${i + 1}/${totalRecipients}`);
      return;
    }

    // Replace template variables for this recipient
    const personalizedSubject = replaceTemplateVariables(template.subject, recipient);
    const personalizedHtml = replaceTemplateVariables(template.html_content, recipient);

    try {
      const payload = {
          action: "send",
          smtp_host: smtp.host,
          smtp_port: smtp.port,
          user: smtp.username,
          password: smtpPassword,
          from_name: smtp.from_name,
          from_email: smtp.from_email,
          to_email: recipientEmail,
          to_name: recipientName || "",
          subject: personalizedSubject,
          html_body: personalizedHtml,
          attachments: (template as any).attachments || []
      };
      
      const result = await runPythonMailer(payload);
      if (!result.success) {
          throw new Error(result.error || "Python script failed");
      }

      sent++;
      await logEmail(userId, jobId, recipientEmail, recipientName, personalizedSubject, "sent", null);

      // Increment daily count
      const profile = await Profile.findOne({ user_id: userId });
      if (profile) {
        profile.daily_email_count += 1;
        await profile.save();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Send failed";
      failed++;
      await logEmail(userId, jobId, recipientEmail, recipientName, personalizedSubject, "failed", msg);
    }

    await updateJobProgress(jobId, sent, failed);

    // Smart delay between emails (skip after last email)
    if (i < totalRecipients - 1) {
      const delaySeconds = calculateEmailDelaySec(i, totalRecipients);
      // eslint-disable-next-line no-console
      console.log(`[scheduler] job ${jobId} email ${i + 1}/${totalRecipients} — waiting ${Math.round(delaySeconds)}s`);
      await sleep(delaySeconds * 1000);
    }
  }

  // ── Final status ───────────────────────────────────────
  const finalStatus = failed === totalRecipients ? "failed" : "completed";
  await ScheduledEmail.updateOne(
    { _id: jobId },
    { status: finalStatus, emails_sent: sent, emails_failed: failed }
  );
  // eslint-disable-next-line no-console
  console.log(`[scheduler] job ${jobId} finished: ${sent} sent, ${failed} failed → ${finalStatus}`);
}

async function logEmail(
  userId: string,
  scheduledId: string,
  recipientEmail: string,
  recipientName: string,
  subject: string,
  status: "sent" | "failed",
  errorMessage: string | null
): Promise<void> {
  await EmailLog.create({
    _id: uuidv4(),
    user_id: userId,
    scheduled_email_id: scheduledId,
    recipient_email: recipientEmail,
    recipient_name: recipientName || null,
    subject,
    status,
    error_message: errorMessage,
    sent_at: status === "sent" ? new Date() : null,
  });
}

async function updateJobProgress(jobId: string, sent: number, failed: number): Promise<void> {
  await ScheduledEmail.updateOne({ _id: jobId }, { emails_sent: sent, emails_failed: failed });
}
