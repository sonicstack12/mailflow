import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  Calendar,
  Users,
  Play,
  Trash2,
  Edit,
  AlertCircle,
  Plus,
  FileSpreadsheet,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { parseExcelFile, checkVariableSync, type RecipientData } from "@/lib/excelParser";
import { estimateCampaignDuration } from "@/lib/emailDelay";
import { apiFetch } from "@/lib/api";

interface ScheduledEmail {
  id: string;
  name: string;
  template_id: string | null;
  smtp_config_id: string | null;
  recipient_count: number;
  recipients: unknown;
  scheduled_time: string;
  timezone: string;
  status: string;
  emails_sent: number;
  emails_failed: number;
  created_at: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  variables: string[];
  tier?: "standard" | "premium";
}

interface SMTPConfig {
  id: string;
  name: string;
}

const timezoneOptions = [
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

const Scheduled = () => {
  const [emails, setEmails] = useState<ScheduledEmail[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [smtpConfigs, setSmtpConfigs] = useState<SMTPConfig[]>([]);
  const [filterTimezone, setFilterTimezone] = useState<string>("all");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<ScheduledEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const isPremium =
    profile?.subscription_tier === "premium" &&
    (!profile?.subscription_expires_at || new Date(profile.subscription_expires_at) > new Date());
  const selectableTemplates = templates.filter(
    (t) => t.tier !== "premium" || isPremium
  );

  const [editForm, setEditForm] = useState({
    name: "",
    scheduledDate: "",
    scheduledTime: "",
    timezone: "",
  });

  const [scheduleForm, setScheduleForm] = useState({
    name: "",
    templateId: "",
    smtpId: "",
    scheduledDate: "",
    scheduledTime: "",
    timezone: "Asia/Kolkata",
    recipients: [] as Array<{ email: string; [key: string]: unknown }>,
    excelFileName: "",
    recipientCount: 0,
  });

  const [variableSync, setVariableSync] = useState<"idle" | "synced" | "mismatch">("idle");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [emailsRes, templatesRes, smtpRes] = await Promise.all([
        apiFetch<{ scheduled: ScheduledEmail[] }>("/api/customer/scheduled"),
        apiFetch<{ templates: Template[] }>("/api/customer/templates"),
        apiFetch<{ configs: SMTPConfig[] }>("/api/customer/smtp"),
      ]);

      setEmails((emailsRes.scheduled || []) as ScheduledEmail[]);
      setTemplates((templatesRes.templates || []) as Template[]);
      setSmtpConfigs((smtpRes.configs || []) as SMTPConfig[]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load scheduled emails.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const timezones = [...new Set(emails.map((c) => c.timezone))];

  const filteredEmails = emails.filter(
    (c) =>
      (filterTimezone === "all" || c.timezone === filterTimezone) &&
      c.status !== "completed"
  );

  const getTimeUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) return "Past";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m`;
    }
  };

  const handleSendNow = async (id: string) => {
    try {
      await apiFetch<{ ok: true }>(`/api/customer/scheduled/${id}/send-now`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      toast({
        title: "Email Sending Started",
        description: "The email is now being processed.",
      });
      fetchData();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to send email.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await apiFetch<{ ok: true }>(`/api/customer/scheduled/${id}`, { method: "DELETE" });

      toast({
        title: "Scheduled Email Cancelled",
        description: "The scheduled email has been removed.",
      });
      fetchData();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to cancel email.",
        variant: "destructive",
      });
    }
  };

  const handleOpenEdit = (email: ScheduledEmail) => {
    setEditingEmail(email);
    const date = new Date(email.scheduled_time);
    setEditForm({
      name: email.name,
      scheduledDate: date.toISOString().split("T")[0],
      scheduledTime: date.toTimeString().slice(0, 5),
      timezone: email.timezone,
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingEmail) return;

    setSaving(true);
    try {
      const newDateTime = new Date(`${editForm.scheduledDate}T${editForm.scheduledTime}`);

      await apiFetch<{ ok: true }>(`/api/customer/scheduled/${editingEmail.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editForm.name,
          scheduled_time: newDateTime.toISOString(),
          timezone: editForm.timezone,
        }),
      });

      toast({
        title: "Schedule Updated",
        description: `${editForm.name} has been rescheduled.`,
      });

      setIsEditOpen(false);
      setEditingEmail(null);
      fetchData();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to update schedule.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSchedule = () => {
    setScheduleForm({
      name: "",
      templateId: "",
      smtpId: "",
      scheduledDate: "",
      scheduledTime: "",
      timezone: "Asia/Kolkata",
      recipients: [],
      excelFileName: "",
      recipientCount: 0,
    });
    setVariableSync("idle");
    setIsScheduleOpen(true);
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await parseExcelFile(file);

    if (!result.success) {
      toast({
        title: "Excel Parse Error",
        description: result.error || "Failed to parse Excel file.",
        variant: "destructive",
      });
      return;
    }

    setScheduleForm({
      ...scheduleForm,
      excelFileName: file.name,
      recipients: result.data as Array<{ email: string; [key: string]: unknown }>,
      recipientCount: result.data.length,
    });

    // Check sync with selected template
    if (scheduleForm.templateId) {
      const template = templates.find((t) => t.id === scheduleForm.templateId);
      if (template && result.data.length > 0) {
        const syncResult = checkVariableSync(template.variables, result.columns);
        setVariableSync(syncResult.synced ? "synced" : "mismatch");
      }
    }

    toast({
      title: "Excel File Loaded",
      description: `Found ${result.data.length} valid recipients.`,
    });
  };

  const handleTemplateChange = (templateId: string) => {
    setScheduleForm({ ...scheduleForm, templateId });

    if (scheduleForm.recipients.length > 0) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        const columns = Object.keys(scheduleForm.recipients[0]);
        const allVarsPresent = template.variables.every((v) => columns.includes(v));
        setVariableSync(allVarsPresent ? "synced" : "mismatch");
      }
    }
  };

  const handleCreateSchedule = async () => {
    if (!user) return;

    if (!scheduleForm.templateId || !scheduleForm.smtpId || scheduleForm.recipientCount === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and upload recipients.",
        variant: "destructive",
      });
      return;
    }

    if (variableSync === "mismatch") {
      toast({
        title: "Variable Mismatch",
        description: "Template variables don't match Excel columns.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await apiFetch<{ ok: true; id: string }>("/api/customer/scheduled", {
        method: "POST",
        body: JSON.stringify({
          name: scheduleForm.name,
          template_id: scheduleForm.templateId,
          smtp_config_id: scheduleForm.smtpId,
          recipients: scheduleForm.recipients,
          recipient_count: scheduleForm.recipientCount,
          scheduled_time: new Date(`${scheduleForm.scheduledDate}T${scheduleForm.scheduledTime}`).toISOString(),
          timezone: scheduleForm.timezone,
        }),
      });

      toast({
        title: "Email Scheduled",
        description: `${scheduleForm.name} scheduled successfully.`,
      });

      setIsScheduleOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to schedule email.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getTemplateName = (id: string | null) => {
    if (!id) return "—";
    return templates.find((t) => t.id === id)?.name || "Unknown";
  };

  const getSmtpName = (id: string | null) => {
    if (!id) return "—";
    return smtpConfigs.find((s) => s.id === id)?.name || "Unknown";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header - Modern Design */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-navy-900">Scheduled Emails</h1>
          <p className="text-slate-600 mt-1">
            Schedule and manage emails for automatic sending.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterTimezone} onValueChange={setFilterTimezone}>
            <SelectTrigger className="w-[200px] rounded-xl border-slate-200">
              <SelectValue placeholder="Filter by timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Timezones</SelectItem>
              {timezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleOpenSchedule}
            className="bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-semibold shadow-lg shadow-yellow-400/25 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Email
          </Button>
        </div>
      </div>

      {/* Info Banner - Modern Yellow Card */}
      <Card className="border-0 shadow-card rounded-2xl bg-yellow-50/50 border-yellow-100">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-slate-700">
            <strong className="text-navy-900">Automatic sending:</strong> Your emails will be sent at the scheduled
            time. Our system processes scheduled emails automatically.
          </p>
        </CardContent>
      </Card>

      {/* Scheduled List - Modern Cards */}
      {filteredEmails.length === 0 ? (
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-navy-900 mb-2">
              No scheduled emails
            </h3>
            <p className="text-slate-500 mb-6">
              Schedule an email to have it sent automatically at a specific time.
            </p>
            <Button 
              onClick={handleOpenSchedule}
              className="bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Email
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredEmails.map((email) => (
            <Card 
              key={email.id} 
              className="border-0 shadow-card rounded-2xl overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-navy-900 truncate">
                          {email.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Template: {getTemplateName(email.template_id)} • SMTP:{" "}
                          {getSmtpName(email.smtp_config_id)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4 mt-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>
                          {new Date(email.scheduled_time).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>
                          {new Date(email.scheduled_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>{email.emails_sent?.toLocaleString() || 0} / {email.recipient_count.toLocaleString()} sent</span>
                      </div>
                      <div>
                        <Badge className="bg-slate-100 text-slate-600 border-0 font-medium">{email.timezone}</Badge>
                      </div>
                    </div>
                    {email.recipient_count > 100 && estimateCampaignDuration(email.recipient_count) && (
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-50 border border-yellow-100 text-sm text-navy-800">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span>
                          Est. total send time:{" "}
                          <span className="font-semibold">
                            {estimateCampaignDuration(email.recipient_count)}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Sends in</p>
                      <p className="text-xl font-bold text-yellow-500">
                        {getTimeUntil(email.scheduled_time)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendNow(email.id)}
                        className="rounded-lg border-yellow-300 hover:bg-yellow-50 text-navy-900"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Send Now
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(email)}
                        className="rounded-lg border-slate-200 hover:bg-yellow-50 hover:text-yellow-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(email.id)}
                        className="rounded-lg border-slate-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary - Modern Cards */}
      <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-navy-900">Queue Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-6 rounded-xl bg-slate-50 text-center">
              <p className="text-3xl font-bold text-navy-900">
                {filteredEmails.length}
              </p>
              <p className="text-sm text-slate-500 font-medium mt-1">Scheduled Emails</p>
            </div>
            <div className="p-6 rounded-xl bg-slate-50 text-center">
              <p className="text-3xl font-bold text-navy-900">
                {filteredEmails
                  .reduce((sum, c) => sum + c.recipient_count, 0)
                  .toLocaleString()}
              </p>
              <p className="text-sm text-slate-500 font-medium mt-1">Total Recipients</p>
            </div>
            <div className="p-6 rounded-xl bg-slate-50 text-center">
              <p className="text-3xl font-bold text-navy-900">
                {filteredEmails.length > 0
                  ? new Date(
                      filteredEmails.sort(
                        (a, b) =>
                          new Date(a.scheduled_time).getTime() -
                          new Date(b.scheduled_time).getTime()
                      )[0].scheduled_time
                    ).toLocaleDateString()
                  : "—"}
              </p>
              <p className="text-sm text-slate-500 font-medium mt-1">Next Send Date</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>
              Update the scheduled time for this email.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Email Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editForm.scheduledDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, scheduledDate: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-time">Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editForm.scheduledTime}
                  onChange={(e) =>
                    setEditForm({ ...editForm, scheduledTime: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-timezone">Timezone</Label>
              <Select
                value={editForm.timezone}
                onValueChange={(v) => setEditForm({ ...editForm, timezone: v })}
              >
                <SelectTrigger id="edit-timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezoneOptions.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule New Email</DialogTitle>
            <DialogDescription>
              Select a template, upload recipients, and schedule your email.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="schedule-name">Email Name</Label>
              <Input
                id="schedule-name"
                placeholder="e.g., January Newsletter"
                value={scheduleForm.name}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Template</Label>
                <Select
                  value={scheduleForm.templateId}
                  onValueChange={handleTemplateChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>SMTP Server</Label>
                <Select
                  value={scheduleForm.smtpId}
                  onValueChange={(v) =>
                    setScheduleForm({ ...scheduleForm, smtpId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select SMTP" />
                  </SelectTrigger>
                  <SelectContent>
                    {smtpConfigs.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Excel Upload */}
            <div className="grid gap-2">
              <Label>Recipients (Excel File)</Label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleExcelUpload}
              />
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {scheduleForm.excelFileName ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{scheduleForm.excelFileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {scheduleForm.recipientCount} recipients
                      </p>
                    </div>
                    {variableSync === "synced" && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {variableSync === "mismatch" && (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload Excel file with recipients
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="schedule-date">Date</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  value={scheduleForm.scheduledDate}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, scheduledDate: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="schedule-time">Time</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={scheduleForm.scheduledTime}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="schedule-timezone">Timezone</Label>
                <Select
                  value={scheduleForm.timezone}
                  onValueChange={(v) =>
                    setScheduleForm({ ...scheduleForm, timezone: v })
                  }
                >
                  <SelectTrigger id="schedule-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSchedule} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Schedule Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Scheduled;
