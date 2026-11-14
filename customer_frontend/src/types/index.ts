// User types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// SMTP Configuration types
export interface SMTPConfig {
  id: string;
  userId: string;
  name: string;
  host: string;
  port: number;
  fromName: string;
  fromEmail: string;
  username: string;
  isDefault: boolean;
  createdAt: Date;
}

// Template types
export interface EmailTemplate {
  id: string;
  userId: string;
  name: string;
  subject: string;
  htmlContent: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Campaign types
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  templateId: string;
  smtpId: string;
  status: CampaignStatus;
  scheduledTime?: Date;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: Date;
}

// Email Log types
export type EmailStatus = 'pending' | 'sent' | 'failed' | 'bounced';

export interface EmailLog {
  id: string;
  campaignId: string;
  recipientEmail: string;
  recipientName?: string;
  status: EmailStatus;
  errorMessage?: string;
  sentAt?: Date;
  createdAt: Date;
}

// Dashboard stats
export interface DashboardStats {
  totalEmailsSent: number;
  scheduledEmails: number;
  failedEmails: number;
  templatesCreated: number;
  successRate: number;
}

// Excel recipient data
export interface RecipientData {
  [key: string]: string;
}
