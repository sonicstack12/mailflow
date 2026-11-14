import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Mail,
  Shield,
  Bell,
  Database,
  Save,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

interface PlatformSettings {
  site_name: string;
  support_email: string;
  max_emails_per_day_free: string;
  premium_max_emails: string;
  free_log_retention_hours: string;
  premium_log_retention_hours: string;
  enable_signups: string;
  require_email_verification: string;
  enable_notifications: string;
  maintenance_mode: string;
}

const AdminSettings = () => {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [settings, setSettings] = useState<PlatformSettings>({
    site_name: "MailFlow",
    support_email: "support@mailflow.app",
    max_emails_per_day_free: "250",
    premium_max_emails: "0",
    free_log_retention_hours: "24",
    premium_log_retention_hours: "168",
    enable_signups: "true",
    require_email_verification: "true",
    enable_notifications: "true",
    maintenance_mode: "false",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ settings: Array<{ key: string; value: string }> }>("/api/admin/settings");

      if (data.settings) {
        const mapped: Partial<PlatformSettings> = {};
        data.settings.forEach((row: { key: string; value: string }) => {
          mapped[row.key as keyof PlatformSettings] = row.value;
        });
        setSettings((prev) => ({ ...prev, ...mapped }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Ensure all required fields are present with correct types
      const completeSettings = {
        site_name: settings.site_name || "MailFlow",
        support_email: settings.support_email || "support@mailflow.app",
        max_emails_per_day_free: String(settings.max_emails_per_day_free || "250"),
        premium_max_emails: String(settings.premium_max_emails || "0"),
        free_log_retention_hours: String(settings.free_log_retention_hours || "24"),
        premium_log_retention_hours: String(settings.premium_log_retention_hours || "168"),
        enable_signups: String(settings.enable_signups !== undefined ? settings.enable_signups : "true"),
        require_email_verification: String(settings.require_email_verification !== undefined ? settings.require_email_verification : "true"),
        enable_notifications: String(settings.enable_notifications !== undefined ? settings.enable_notifications : "true"),
        maintenance_mode: String(settings.maintenance_mode !== undefined ? settings.maintenance_mode : "false"),
      };
      
      await apiFetch<{ ok: true }>("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify(completeSettings),
      });

      toast({
        title: "Settings Saved",
        description: "Your admin settings have been updated.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      
      let errorMessage = "Failed to save settings.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-navy-900">Platform Settings</h1>
          <p className="text-slate-600 mt-1">
            Configure platform settings and preferences.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-semibold rounded-xl"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      {/* General Settings */}
      <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Settings className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-navy-900">General Settings</CardTitle>
              <CardDescription className="text-slate-500">Basic platform configuration</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="siteName" className="text-navy-800 font-semibold">Site Name</Label>
              <Input
                id="siteName"
                value={settings.site_name}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                className="rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail" className="text-navy-800 font-semibold">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.support_email}
                onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                className="rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Limits */}
      <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-navy-900">Email Limits</CardTitle>
              <CardDescription className="text-slate-500">Configure email sending limits per plan</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="freeLimit" className="text-navy-800 font-semibold">Free Plan (emails/day)</Label>
              <Input
                id="freeLimit"
                type="number"
                value={settings.max_emails_per_day_free}
                onChange={(e) => setSettings({ ...settings, max_emails_per_day_free: e.target.value })}
                className="rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="premiumLimit" className="text-navy-800 font-semibold">Premium Plan (0 = unlimited)</Label>
              <Input
                id="premiumLimit"
                type="number"
                value={settings.premium_max_emails}
                onChange={(e) => setSettings({ ...settings, premium_max_emails: e.target.value })}
                className="rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Retention */}
      <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-navy-900">Log Retention</CardTitle>
              <CardDescription className="text-slate-500">Configure how long logs are stored</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="freeRetention" className="text-navy-800 font-semibold">Free Plan (hours)</Label>
              <Input
                id="freeRetention"
                type="number"
                value={settings.free_log_retention_hours}
                onChange={(e) => setSettings({ ...settings, free_log_retention_hours: e.target.value })}
                className="rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="premiumRetention" className="text-navy-800 font-semibold">Premium Plan (hours)</Label>
              <Input
                id="premiumRetention"
                type="number"
                value={settings.premium_log_retention_hours}
                onChange={(e) => setSettings({ ...settings, premium_log_retention_hours: e.target.value })}
                className="rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-navy-900">Security</CardTitle>
              <CardDescription className="text-slate-500">Authentication and access settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50">
            <div className="space-y-0.5">
              <Label className="text-navy-800 font-semibold">Enable Signups</Label>
              <p className="text-sm text-slate-500">Allow new users to register</p>
            </div>
            <Switch
              checked={settings.enable_signups === "true"}
              onCheckedChange={(checked) => setSettings({ ...settings, enable_signups: String(checked) })}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50">
            <div className="space-y-0.5">
              <Label className="text-navy-800 font-semibold">Require Email Verification</Label>
              <p className="text-sm text-slate-500">Users must verify email before access</p>
            </div>
            <Switch
              checked={settings.require_email_verification === "true"}
              onCheckedChange={(checked) => setSettings({ ...settings, require_email_verification: String(checked) })}
            />
          </div>
        </CardContent>
      </Card>

      {/* System */}
      <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-navy-900">System</CardTitle>
              <CardDescription className="text-slate-500">System-wide settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50">
            <div className="space-y-0.5">
              <Label className="text-navy-800 font-semibold">Enable Notifications</Label>
              <p className="text-sm text-slate-500">Send system notifications to users</p>
            </div>
            <Switch
              checked={settings.enable_notifications === "true"}
              onCheckedChange={(checked) => setSettings({ ...settings, enable_notifications: String(checked) })}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-50 border border-red-100">
            <div className="space-y-0.5">
              <Label className="text-red-600 font-semibold">Maintenance Mode</Label>
              <p className="text-sm text-slate-600">Disable access for all non-admin users</p>
            </div>
            <Switch
              checked={settings.maintenance_mode === "true"}
              onCheckedChange={(checked) => setSettings({ ...settings, maintenance_mode: String(checked) })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
