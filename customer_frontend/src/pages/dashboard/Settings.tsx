import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Bell, Shield, Globe, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

const Settings = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [failureAlerts, setFailureAlerts] = useState(true);
  const [scheduledReminders, setScheduledReminders] = useState(true);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await apiFetch<{ ok: true }>("/api/customer/profile", {
        method: "PATCH",
        body: JSON.stringify({ full_name: fullName }),
      });

      await refreshProfile();
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    setSavingPassword(true);
    try {
      await apiFetch<{ ok: true }>("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to change password.",
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    toast({
      title: "Contact Support",
      description: "To delete your account, please contact support@mailflow.app",
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header - Modern Design */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-navy-900">Settings</h1>
        <p className="text-slate-600 mt-1">
          Manage your account and application preferences.
        </p>
      </div>

      {/* Profile Settings - Modern Card */}
      <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <User className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-navy-900">Profile</CardTitle>
              <CardDescription className="text-slate-500">
                Update your personal information.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-navy-800 font-semibold">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-navy-800 font-semibold">Email</Label>
              <Input id="email" type="email" value={email} disabled className="bg-slate-100 rounded-xl border-slate-200" />
              <p className="text-xs text-slate-500">Email cannot be changed</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-navy-900">Subscription</p>
              <p className="text-xs text-slate-500">
                {profile?.subscription_tier === "premium"
                  ? `Premium${profile.subscription_expires_at ? ` · expires ${new Date(profile.subscription_expires_at).toLocaleDateString()}` : ""}`
                  : "Free plan"}
                {" · "}
                {profile?.daily_email_count ?? 0} emails sent today
              </p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-full">
              {profile?.subscription_tier || "free"}
            </span>
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-semibold rounded-xl"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings - Modern Card */}
      <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-navy-900">Notifications</CardTitle>
              <CardDescription className="text-slate-500">
                Configure how you want to receive notifications.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
            <div>
              <p className="font-semibold text-navy-900">Email Notifications</p>
              <p className="text-sm text-slate-500">
                Receive email alerts for sending status changes
              </p>
            </div>
            <Switch
              checked={emailNotifs}
              onCheckedChange={(val) => {
                setEmailNotifs(val);
                toast({ title: "Settings updated", description: "Email notifications preference saved." });
              }}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
            <div>
              <p className="font-semibold text-navy-900">Failure Alerts</p>
              <p className="text-sm text-slate-500">
                Immediate alerts when emails fail to send
              </p>
            </div>
            <Switch
              checked={failureAlerts}
              onCheckedChange={(val) => {
                setFailureAlerts(val);
                toast({ title: "Settings updated", description: "Failure alerts preference saved." });
              }}
            />
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
            <div>
              <p className="font-semibold text-navy-900">Scheduled Email Reminders</p>
              <p className="text-sm text-slate-500">
                Get notified before scheduled emails are sent
              </p>
            </div>
            <Switch
              checked={scheduledReminders}
              onCheckedChange={(val) => {
                setScheduledReminders(val);
                toast({ title: "Settings updated", description: "Scheduled email reminders preference saved." });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Settings - Modern Card */}
      <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Globe className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-navy-900">Email Defaults</CardTitle>
              <CardDescription className="text-slate-500">
                Configure default settings for email sending.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-navy-800 font-semibold">Default Timezone</Label>
            <Select defaultValue="asia-kolkata">
              <SelectTrigger className="rounded-xl border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asia-kolkata">Asia/Kolkata (IST)</SelectItem>
                <SelectItem value="america-new-york">America/New York (EST)</SelectItem>
                <SelectItem value="america-los-angeles">America/Los Angeles (PST)</SelectItem>
                <SelectItem value="europe-london">Europe/London (GMT)</SelectItem>
                <SelectItem value="asia-tokyo">Asia/Tokyo (JST)</SelectItem>
                <SelectItem value="asia-dubai">Asia/Dubai (GST)</SelectItem>
                <SelectItem value="asia-singapore">Asia/Singapore (SGT)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="p-4 rounded-xl bg-yellow-50/50 border border-yellow-100">
            <p className="text-sm font-semibold text-navy-900 mb-1">🛡️ Smart Delivery Protection</p>
            <p className="text-sm text-slate-600">
              Our intelligent system automatically adjusts email sending delays based on your campaign size
              to maximize deliverability and avoid spam filters.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings - Modern Card */}
      <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-navy-900">Security</CardTitle>
              <CardDescription className="text-slate-500">
                Manage your account security settings.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-navy-800 font-semibold">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-navy-800 font-semibold">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-navy-800 font-semibold">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
              />
            </div>
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={savingPassword || !currentPassword || !newPassword}
            className="bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-semibold rounded-xl"
          >
            {savingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone - Modern Card */}
      <Card className="border-0 shadow-card rounded-2xl overflow-hidden border-l-4 border-l-red-500">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription className="text-slate-500">
                Irreversible actions that affect your account.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50/50">
            <div>
              <p className="font-semibold text-navy-900">Delete Account</p>
              <p className="text-sm text-slate-500">
                Permanently delete your account and all data
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              className="rounded-xl"
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
