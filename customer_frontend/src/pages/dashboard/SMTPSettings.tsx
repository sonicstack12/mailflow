import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Server, Trash2, Edit, TestTube, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch, logActivity } from "@/lib/api";

interface SMTPConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  from_name: string;
  from_email: string;
  username: string;
  password?: string;
  is_default: boolean;
  status: "active" | "inactive" | "testing";
}

const SMTPSettings = () => {
  const [configs, setConfigs] = useState<SMTPConfig[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SMTPConfig | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    host: "",
    port: "587",
    fromName: "",
    fromEmail: "",
    username: "",
    password: "",
  });

  useEffect(() => {
    if (user) {
      fetchConfigs();
    }
  }, [user]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ configs: SMTPConfig[] }>("/api/customer/smtp");
      setConfigs((data.configs || []) as SMTPConfig[]);
    } catch (error) {
      console.error("Error fetching SMTP configs:", error);
      toast({
        title: "Error",
        description: "Failed to load SMTP configurations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (config?: SMTPConfig) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        name: config.name,
        host: config.host,
        port: config.port.toString(),
        fromName: config.from_name,
        fromEmail: config.from_email,
        username: config.username,
        password: "",
      });
    } else {
      setEditingConfig(null);
      setFormData({
        name: "",
        host: "",
        port: "587",
        fromName: "",
        fromEmail: "",
        username: "",
        password: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      if (editingConfig) {
        const updateData: Record<string, unknown> = {
          name: formData.name,
          host: formData.host,
          port: parseInt(formData.port),
          from_name: formData.fromName,
          from_email: formData.fromEmail,
          username: formData.username,
        };

        if (formData.password) {
          updateData.password = formData.password;
        }

        await apiFetch<{ ok: true }>(`/api/customer/smtp/${editingConfig.id}`, {
          method: "PATCH",
          body: JSON.stringify(updateData),
        });
        toast({
          title: "SMTP Updated",
          description: `${formData.name} has been updated successfully.`,
        });
        logActivity("Updated SMTP configuration", { name: formData.name, host: formData.host });
      } else {
        await apiFetch<{ ok: true; id: string }>("/api/customer/smtp", {
          method: "POST",
          body: JSON.stringify({
            name: formData.name,
            host: formData.host,
            port: parseInt(formData.port),
            from_name: formData.fromName,
            from_email: formData.fromEmail,
            username: formData.username,
            password: formData.password,
            is_default: configs.length === 0,
          }),
        });
        toast({
          title: "SMTP Added",
          description: `${formData.name} has been added. Run a test to verify.`,
        });
        logActivity("Created SMTP configuration", { name: formData.name, host: formData.host });
      }

      setIsDialogOpen(false);
      fetchConfigs();
    } catch (error) {
      console.error("Error saving SMTP config:", error);
      toast({
        title: "Error",
        description: "Failed to save SMTP configuration.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch<{ ok: true }>(`/api/customer/smtp/${id}`, { method: "DELETE" });

      toast({
        title: "SMTP Deleted",
        description: "The SMTP configuration has been removed.",
      });
      logActivity("Deleted SMTP configuration", { id });
      fetchConfigs();
    } catch (error) {
      console.error("Error deleting SMTP config:", error);
      toast({
        title: "Error",
        description: "Failed to delete SMTP configuration.",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await apiFetch<{ ok: true }>(`/api/customer/smtp/${id}/default`, { method: "POST", body: JSON.stringify({}) });

      toast({
        title: "Default Updated",
        description: "The default SMTP server has been changed.",
      });
      logActivity("Changed default SMTP configuration", { id });
      fetchConfigs();
    } catch (error) {
      console.error("Error setting default:", error);
      toast({
        title: "Error",
        description: "Failed to update default server.",
        variant: "destructive",
      });
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const response = await apiFetch<{ success: boolean; message?: string; error?: string }>(`/api/customer/smtp/${id}/test`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!response.success) throw new Error(response.error || "Test failed");

      toast({
        title: "Test Successful",
        description: "The SMTP server is working correctly.",
      });
      logActivity("Tested SMTP configuration", { id, success: true });
      fetchConfigs();
    } catch (error) {
      console.error("Error testing SMTP:", error);
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Failed to connect to SMTP server.",
        variant: "destructive",
      });
      logActivity("Tested SMTP configuration", { id, success: false });
    } finally {
      setTestingId(null);
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
      {/* Header - Modern Design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-navy-900">SMTP Settings</h1>
          <p className="text-slate-600 mt-1">
            Configure your email servers for sending campaigns.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => handleOpenDialog()}
              className="bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-semibold shadow-lg shadow-yellow-400/25 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add SMTP Server
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-navy-900">
                {editingConfig ? "Edit SMTP Server" : "Add SMTP Server"}
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                Enter your SMTP server credentials. They will be encrypted before storage.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-navy-800 font-semibold">Configuration Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Gmail SMTP"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="host" className="text-navy-800 font-semibold">SMTP Host</Label>
                  <Input
                    id="host"
                    placeholder="smtp.gmail.com"
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    className="rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="port" className="text-navy-800 font-semibold">Port</Label>
                  <Select
                    value={formData.port}
                    onValueChange={(value) => setFormData({ ...formData, port: value })}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="465">465 (SSL)</SelectItem>
                      <SelectItem value="587">587 (TLS)</SelectItem>
                      <SelectItem value="2525">2525</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fromName" className="text-navy-800 font-semibold">From Name</Label>
                  <Input
                    id="fromName"
                    placeholder="Your Company"
                    value={formData.fromName}
                    onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                    className="rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fromEmail" className="text-navy-800 font-semibold">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    placeholder="hello@company.com"
                    value={formData.fromEmail}
                    onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                    className="rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username" className="text-navy-800 font-semibold">SMTP Username</Label>
                <Input
                  id="username"
                  placeholder="username or API key"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-navy-800 font-semibold">SMTP Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={editingConfig ? "Leave blank to keep current" : "Enter password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20 pr-12"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl border-slate-200"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-semibold rounded-xl"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingConfig ? "Update" : "Add"} Server
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* SMTP List - Modern Cards */}
      {configs.length === 0 ? (
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Server className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-navy-900 mb-2">
              No SMTP servers configured
            </h3>
            <p className="text-slate-500 mb-6">
              Add your first SMTP server to start sending emails.
            </p>
            <Button 
              onClick={() => handleOpenDialog()}
              className="bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add SMTP Server
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {configs.map((config) => (
            <Card 
              key={config.id} 
              className={`border-0 shadow-card rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-card-hover ${config.is_default ? "ring-2 ring-yellow-400" : ""}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center">
                      <Server className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-navy-900">{config.name}</h3>
                        {config.is_default && (
                          <Badge className="bg-yellow-100 text-yellow-700 border-0 font-semibold">Default</Badge>
                        )}
                        <Badge
                          variant={config.status === "active" ? "default" : "outline"}
                          className={`font-semibold border-0 ${
                            config.status === "active"
                              ? "bg-green-100 text-green-700"
                              : config.status === "testing"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {config.status === "testing" ? "Testing..." : config.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        {config.host}:{config.port}
                      </p>
                      <p className="text-sm text-slate-500">
                        From: {config.from_name} &lt;{config.from_email}&gt;
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(config.id)}
                      disabled={testingId === config.id}
                      className="rounded-lg border-yellow-300 hover:bg-yellow-50 text-navy-900"
                    >
                      {testingId === config.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4 mr-2" />
                      )}
                      {testingId === config.id ? "Testing..." : "Test"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(config)}
                      className="rounded-lg border-slate-200 hover:bg-yellow-50 hover:text-yellow-600"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(config.id)}
                      className="rounded-lg border-slate-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {!config.is_default && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Set as default server
                    </span>
                    <Switch
                      checked={config.is_default}
                      onCheckedChange={() => handleSetDefault(config.id)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Help Section - Modern Cards */}
      <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-navy-900">Need help configuring SMTP?</CardTitle>
          <CardDescription className="text-slate-500">
            Here are some common SMTP settings for popular providers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-5 rounded-xl bg-slate-50">
              <h4 className="font-semibold text-navy-900 mb-2">Gmail</h4>
              <p className="text-sm text-slate-600">
                Host: smtp.gmail.com<br />
                Port: 587 (TLS)<br />
                Requires App Password
              </p>
            </div>
            <div className="p-5 rounded-xl bg-slate-50">
              <h4 className="font-semibold text-navy-900 mb-2">Outlook / Microsoft 365</h4>
              <p className="text-sm text-slate-600">
                Host: smtp.office365.com<br />
                Port: 587 (STARTTLS)<br />
                Enable SMTP AUTH
              </p>
            </div>
            <div className="p-5 rounded-xl bg-slate-50">
              <h4 className="font-semibold text-navy-900 mb-2">Amazon SES</h4>
              <p className="text-sm text-slate-600">
                Host: email-smtp.&lt;region&gt;.amazonaws.com<br />
                Port: 587 or 465<br />
                Use SES SMTP credentials
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SMTPSettings;
