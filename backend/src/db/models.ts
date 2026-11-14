import mongoose, { Schema } from "mongoose";

// User Model
const userSchema = new Schema(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password_hash: { type: String, required: true },
    full_name: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "userdata",
  }
);

// Profile Model
const profileSchema = new Schema(
  {
    _id: { type: String, required: true },
    user_id: { type: String, required: true, unique: true, ref: "User", index: true },
    subscription_tier: { type: String, enum: ["free", "premium"], default: "free", required: true },
    subscription_expires_at: { type: Date, default: null },
    daily_email_count: { type: Number, default: 0 },
    last_email_reset_date: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// User Role Model
const userRoleSchema = new Schema(
  {
    _id: { type: String, required: true },
    user_id: { type: String, required: true, ref: "User", index: true },
    role: { type: String, enum: ["admin", "moderator", "user"], required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

userRoleSchema.index({ user_id: 1, role: 1 }, { unique: true });

// Platform Settings Model
const platformSettingSchema = new Schema(
  {
    _id: { type: String, required: true },
    key: { type: String, required: true, unique: true, index: true },
    value: { type: String, required: true },
  },
  {
    timestamps: { createdAt: false, updatedAt: "updated_at" },
  }
);

// SMTP Config Model
const smtpConfigSchema = new Schema(
  {
    _id: { type: String, required: true },
    user_id: { type: String, required: true, ref: "User", index: true },
    name: { type: String, required: true },
    host: { type: String, required: true },
    port: { type: Number, default: 587, required: true },
    from_name: { type: String, required: true },
    from_email: { type: String, required: true },
    username: { type: String, required: true },
    password_enc: { type: String, required: true },
    is_default: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "inactive", "testing"], default: "inactive" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Email Template Model
const emailTemplateSchema = new Schema(
  {
    _id: { type: String, required: true },
    user_id: { type: String, required: true, ref: "User", index: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    html_content: { type: String, required: true },
    variables: { type: [String], default: [] },
    tier: { type: String, enum: ["standard", "premium"], default: "standard" },
    attachments: { type: [{ filename: String, content_type: String, data: String }], default: [] },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Scheduled Email Model
const scheduledEmailSchema = new Schema(
  {
    _id: { type: String, required: true },
    user_id: { type: String, required: true, ref: "User", index: true },
    name: { type: String, required: true },
    template_id: { type: String, default: null, ref: "EmailTemplate" },
    smtp_config_id: { type: String, default: null, ref: "SmtpConfig" },
    recipients: { type: Schema.Types.Mixed, required: true },
    recipient_count: { type: Number, default: 0, required: true },
    scheduled_time: { type: Date, required: true, index: true },
    timezone: { type: String, default: "UTC", required: true },
    status: {
      type: String,
      enum: ["pending", "sending", "completed", "failed", "cancelled"],
      default: "pending",
      required: true,
      index: true,
    },
    emails_sent: { type: Number, default: 0 },
    emails_failed: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

scheduledEmailSchema.index({ status: 1, scheduled_time: 1 });

// Email Log Model
const emailLogSchema = new Schema(
  {
    _id: { type: String, required: true },
    user_id: { type: String, required: true, ref: "User", index: true },
    scheduled_email_id: { type: String, default: null, ref: "ScheduledEmail", index: true },
    recipient_email: { type: String, required: true },
    recipient_name: { type: String, default: null },
    subject: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "sent", "failed", "bounced"],
      default: "pending",
      required: true,
    },
    error_message: { type: String, default: null },
    sent_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

emailLogSchema.index({ created_at: -1 });

// Activity Log Model
const activityLogSchema = new Schema(
  {
    _id: { type: String, required: true },
    user_id: { type: String, required: true, ref: "User", index: true },
    action: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: null },
    ip_address: { type: String, default: null },
    user_agent: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

activityLogSchema.index({ created_at: -1 });

// Migration Model
const migrationSchema = new Schema(
  {
    _id: { type: String, required: true },
  },
  {
    timestamps: { createdAt: "applied_at", updatedAt: false },
  }
);

// Feature Model
const featureSchema = new Schema(
  {
    _id: { type: String, required: true },
    icon: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Step Model (How It Works)
const stepSchema = new Schema(
  {
    _id: { type: String, required: true },
    number: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Benefit Model
const benefitSchema = new Schema(
  {
    _id: { type: String, required: true },
    icon: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Use Case Model
const useCaseSchema = new Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Pricing Plan Model
const pricingPlanSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    icon: { type: String, required: true },
    description: { type: String, required: true },
    monthlyPrice: { type: Number, required: true },
    yearlyPrice: { type: Number, required: true },
    features: { type: [String], required: true },
    cta: { type: String, required: true },
    popular: { type: Boolean, default: false },
    highlight: { type: String, default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Hiring Company Directory (premium-gated dataset)
const companySchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, index: true },
    industry: { type: String, default: "", index: true },
    employer_type: { type: String, default: "" },
    company_size: { type: String, default: "" },
    size_confidence: { type: String, default: "" },
    founded_year: { type: String, default: "" },
    hq_location: { type: String, default: "" },
    office_locations: { type: String, default: "" },
    location_confidence: { type: String, default: "" },
    fresher_roles: { type: String, default: "" },
    ctc_software_engineer: { type: String, default: "" },
    ctc_fullstack: { type: String, default: "" },
    ctc_system_engineer: { type: String, default: "" },
    ctc_frontend: { type: String, default: "" },
    ctc_backend: { type: String, default: "" },
    ctc_mern: { type: String, default: "" },
    ctc_data_scientist: { type: String, default: "" },
    ctc_aiml: { type: String, default: "" },
    ctc_data_analyst: { type: String, default: "" },
    ctc_marketing: { type: String, default: "" },
    description: { type: String, default: "" },
    work_mode: { type: String, default: "" },
    website: { type: String, default: "" },
    website_status: { type: String, default: "" },
    careers_link: { type: String, default: "" },
    fresher_hiring_signal: { type: String, default: "" },
    priority: { type: String, default: "", index: true },
    pay_caveat: { type: String, default: "" },
    profile_source: { type: String, default: "" },
    last_reviewed: { type: String, default: "" },
    sort_order: { type: Number, default: 0, index: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "companies",
  }
);

companySchema.index({ name: "text", industry: "text", office_locations: "text", fresher_roles: "text" });

// HR Contacts directory (premium-gated dataset)
const hrContactSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, index: true },
    email: { type: String, required: true, index: true },
    title: { type: String, default: "", index: true },
    company: { type: String, default: "", index: true },
    sort_order: { type: Number, default: 0, index: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "hr_contacts",
  }
);

hrContactSchema.index({ name: "text", email: "text", title: "text", company: "text" });

export const User = mongoose.model("User", userSchema);
export const Profile = mongoose.model("Profile", profileSchema);
export const UserRole = mongoose.model("UserRole", userRoleSchema);
export const PlatformSetting = mongoose.model("PlatformSetting", platformSettingSchema);
export const SmtpConfig = mongoose.model("SmtpConfig", smtpConfigSchema);
export const EmailTemplate = mongoose.model("EmailTemplate", emailTemplateSchema);
export const ScheduledEmail = mongoose.model("ScheduledEmail", scheduledEmailSchema);
export const EmailLog = mongoose.model("EmailLog", emailLogSchema);
export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export const Migration = mongoose.model("Migration", migrationSchema);
export const Company = mongoose.model("Company", companySchema);
export const HrContact = mongoose.model("HrContact", hrContactSchema);

// Dynamic Content Models
export const Feature = mongoose.model("Feature", featureSchema);
export const Step = mongoose.model("Step", stepSchema);
export const Benefit = mongoose.model("Benefit", benefitSchema);
export const UseCase = mongoose.model("UseCase", useCaseSchema);
export const PricingPlan = mongoose.model("PricingPlan", pricingPlanSchema);

