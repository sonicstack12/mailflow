import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import {
  Plus,
  FileText,
  Edit,
  Trash2,
  Eye,
  Search,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lock,
  Crown,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { useAuth } from "@/hooks/useAuth";
import { parseExcelFile, checkVariableSync as checkExcelVariableSync, type RecipientData } from "@/lib/excelParser";
import { apiFetch } from "@/lib/api";

interface Template {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  variables: string[];
  tier: "standard" | "premium";
  attachments?: Array<{ filename: string; content_type: string; data: string }>;
  created_at: string;
  updated_at: string;
}

// Default templates for new users
const defaultTemplates: Omit<Template, "id" | "created_at" | "updated_at">[] = [
  {
    name: "Welcome Email",
    subject: "Welcome to {{company}}, {{name}}!",
    html_content: `<h1>Welcome, {{name}}!</h1><p>We're thrilled to have you join {{company}}.</p><p>Your account has been created with the email: {{email}}</p><p>Best regards,<br>The {{company}} Team</p>`,
    variables: ["name", "company", "email"],
    tier: "standard",
  },
  {
    name: "Newsletter",
    subject: "{{company}} Newsletter - {{month}} Edition",
    html_content: `<h1>{{company}} Newsletter</h1><p>Hello {{name}},</p><p>Here's what's new this {{month}}...</p>`,
    variables: ["company", "month", "name"],
    tier: "standard",
  },
  {
    name: "Meeting Invite",
    subject: "Meeting Invitation: {{meeting_title}}",
    html_content: `<h1>You're Invited!</h1><p>Hi {{name}},</p><p>You've been invited to: <strong>{{meeting_title}}</strong></p><p>Date: {{date}}</p><p>Time: {{time}}</p><p>Looking forward to seeing you!</p>`,
    variables: ["name", "meeting_title", "date", "time"],
    tier: "standard",
  },
  {
    name: "Sales Outreach Pro",
    subject: "{{company_name}} + {{prospect_company}} - Partnership Opportunity",
    html_content: `<h1>Hello {{prospect_name}},</h1><p>I'm {{sender_name}} from {{company_name}}. I've been following {{prospect_company}}'s growth and believe there's a great synergy between our solutions.</p><p>Our {{product_name}} has helped companies like yours achieve {{benefit}}.</p><p>Would you be open to a quick 15-minute call this week?</p><p>Best regards,<br>{{sender_name}}<br>{{sender_title}}</p>`,
    variables: ["prospect_name", "sender_name", "company_name", "prospect_company", "product_name", "benefit", "sender_title"],
    tier: "premium",
  },
  {
    name: "Product Launch Announcement",
    subject: "🚀 Introducing {{product_name}} - {{tagline}}",
    html_content: `<div style="text-align: center;"><h1>Introducing {{product_name}}</h1><p style="font-size: 18px;">{{tagline}}</p></div><p>Dear {{name}},</p><p>We're thrilled to announce the launch of {{product_name}}!</p><p><strong>Key Features:</strong></p><ul><li>{{feature_1}}</li><li>{{feature_2}}</li><li>{{feature_3}}</li></ul><p>As a valued customer, you get exclusive early access with {{discount}}% off.</p><p>Use code: <strong>{{promo_code}}</strong></p>`,
    variables: ["product_name", "tagline", "name", "feature_1", "feature_2", "feature_3", "discount", "promo_code"],
    tier: "premium",
  },
];

const Templates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    htmlContent: "",
    excelFileName: "",
    excelColumns: [] as string[],
    attachments: [] as Array<File | { filename: string; content_type: string; data: string }>,
  });

  const [syncStatus, setSyncStatus] = useState<"idle" | "synced" | "mismatch" | "checking">("idle");
  const [missingVariables, setMissingVariables] = useState<string[]>([]);
  const [extraColumns, setExtraColumns] = useState<string[]>([]);

  const userSubscription = profile?.subscription_tier || "free";
  const isPremium =
    userSubscription === "premium" &&
    (!profile?.subscription_expires_at || new Date(profile.subscription_expires_at) > new Date());

  const isTemplateLocked = (template: Template) => template.tier === "premium" && !isPremium;

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ templates: Template[] }>("/api/customer/templates");

      if (data.templates && data.templates.length > 0) {
        setTemplates(data.templates as Template[]);
      } else if (user) {
        await apiFetch<{ ok: true }>("/api/customer/templates/bulk", {
          method: "POST",
          body: JSON.stringify({ templates: defaultTemplates }),
        });
        const after = await apiFetch<{ templates: Template[] }>("/api/customer/templates");
        setTemplates(after.templates as Template[]);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error",
        description: "Failed to load templates.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const extractVariables = (text: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.add(match[1]);
    }
    return Array.from(matches);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const updateVariableSyncStatus = (variables: string[], columns: string[]) => {
    if (columns.length === 0) return;
    const syncResult = checkExcelVariableSync(variables, columns);
    setMissingVariables(syncResult.missing);
    setExtraColumns(syncResult.extra);
    setSyncStatus(syncResult.synced ? "synced" : "mismatch");
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSyncStatus("checking");

    const result = await parseExcelFile(file);

    if (!result.success) {
      toast({
        title: "Excel Parse Error",
        description: result.error || "Failed to parse Excel file.",
        variant: "destructive",
      });
      setSyncStatus("idle");
      return;
    }

    const columns = result.columns;
    
    setFormData({
      ...formData,
      excelFileName: file.name,
      excelColumns: columns,
    });

    const currentVariables = [
      ...extractVariables(formData.subject),
      ...extractVariables(formData.htmlContent),
    ];
    const uniqueVariables = [...new Set(currentVariables)];

    const syncResult = checkExcelVariableSync(uniqueVariables, columns);
    setMissingVariables(syncResult.missing);
    setExtraColumns(syncResult.extra);
    setSyncStatus(syncResult.synced ? "synced" : "mismatch");

    toast({
      title: "Excel File Loaded",
      description: `Found ${result.data.length} recipients with columns: ${columns.join(", ")}`,
    });
  };

  const handleOpenEditor = (template?: Template) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        subject: template.subject,
        htmlContent: template.html_content,
        excelFileName: "",
        excelColumns: [],
        attachments: template.attachments || [],
      });
      setSyncStatus("idle");
    } else {
      setEditingTemplate(null);
      setFormData({
        name: "",
        subject: "",
        htmlContent: "",
        excelFileName: "",
        excelColumns: [],
        attachments: [],
      });
      setSyncStatus("idle");
    }
    setMissingVariables([]);
    setExtraColumns([]);
    setIsEditorOpen(true);
  };

  const handleContentChange = (html: string) => {
    setFormData({ ...formData, htmlContent: html });

    if (formData.excelColumns.length > 0) {
      const currentVariables = [
        ...extractVariables(formData.subject),
        ...extractVariables(html),
      ];
      const uniqueVariables = [...new Set(currentVariables)];
      updateVariableSyncStatus(uniqueVariables, formData.excelColumns);
    }
  };

  const handleSubjectChange = (subject: string) => {
    setFormData({ ...formData, subject });

    if (formData.excelColumns.length > 0) {
      const currentVariables = [
        ...extractVariables(subject),
        ...extractVariables(formData.htmlContent),
      ];
      const uniqueVariables = [...new Set(currentVariables)];
      updateVariableSyncStatus(uniqueVariables, formData.excelColumns);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const variables = [
        ...extractVariables(formData.subject),
        ...extractVariables(formData.htmlContent),
      ];
      const uniqueVariables = [...new Set(variables)];

      const processedAttachments = await Promise.all(
        formData.attachments.map(async (att) => {
          if (att instanceof File) {
            const data = await fileToBase64(att);
            return { filename: att.name, content_type: att.type || "application/octet-stream", data };
          }
          return att;
        })
      );

      if (editingTemplate) {
        await apiFetch<{ ok: true }>(`/api/customer/templates/${editingTemplate.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: formData.name,
            subject: formData.subject,
            html_content: formData.htmlContent,
            variables: uniqueVariables,
            attachments: processedAttachments,
          }),
        });
        toast({
          title: "Template Updated",
          description: `${formData.name} has been updated successfully.`,
        });
      } else {
        await apiFetch<{ ok: true; id: string }>("/api/customer/templates", {
          method: "POST",
          body: JSON.stringify({
            name: formData.name,
            subject: formData.subject,
            html_content: formData.htmlContent,
            variables: uniqueVariables,
            tier: "standard",
            attachments: processedAttachments,
          }),
        });
        toast({
          title: "Template Created",
          description: `${formData.name} has been created successfully.`,
        });
      }

      setIsEditorOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save template.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch<{ ok: true }>(`/api/customer/templates/${id}`, { method: "DELETE" });

      toast({
        title: "Template Deleted",
        description: "The template has been removed.",
      });
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive",
      });
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
          <h1 className="text-3xl md:text-4xl font-bold text-navy-900">Email Templates</h1>
          <p className="text-slate-600 mt-1">
            Create email templates with dynamic variables. Upload Excel to sync recipient data.
          </p>
        </div>
        <Button 
          onClick={() => handleOpenEditor()}
          className="bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-semibold shadow-lg shadow-yellow-400/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Search - Modern Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Search templates..."
          className="pl-12 h-12 rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Templates Grid - Modern Cards */}
      {filteredTemplates.length === 0 ? (
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-navy-900 mb-2">
              {searchQuery ? "No templates found" : "No templates yet"}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchQuery
                ? "Try a different search term."
                : "Create your first email template to get started."}
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => handleOpenEditor()}
                className="bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => {
              const locked = isTemplateLocked(template);
              return (
              <Card
                key={template.id}
                className="group border-0 shadow-card rounded-2xl overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 relative"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg text-navy-900">{template.name}</CardTitle>
                        {template.tier === "premium" && (
                          <Badge className="bg-yellow-100 text-yellow-700 border-0 hover:bg-yellow-100 gap-1">
                            <Crown className="w-3 h-3" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-1">
                        {template.subject}
                      </p>
                    </div>
                    {locked && <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Variables:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {template.variables.slice(0, 4).map((v) => (
                        <Badge key={v} variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 border-0 font-medium hover:bg-yellow-100">
                          {`{{${v}}}`}
                        </Badge>
                      ))}
                      {template.variables.length > 4 && (
                        <Badge variant="outline" className="text-xs border-slate-200 text-slate-500">
                          +{template.variables.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                      {locked
                        ? "Upgrade to premium to use"
                        : `Updated ${new Date(template.updated_at).toLocaleDateString()}`}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-yellow-600 hover:bg-yellow-50"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-yellow-600 hover:bg-yellow-50"
                        disabled={locked}
                        onClick={() => {
                          if (locked) {
                            toast({
                              title: "Premium required",
                              description: "Upgrade to premium to edit this template.",
                            });
                            return;
                          }
                          handleOpenEditor(template);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                        disabled={locked}
                        onClick={() => {
                          if (locked) return;
                          handleDelete(template.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
          })}
        </div>
      )}

      {/* Template Editor Dialog - Modern Styling */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-navy-900">
              {editingTemplate ? "Edit Template" : "Create New Template"}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Write your email naturally. Upload your Excel file to sync variables with column headers.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="grid gap-4 py-4">
              {/* Excel Upload - Modern Card */}
              <div className="p-5 rounded-xl border-2 border-dashed border-yellow-300/50 bg-yellow-50/30">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-navy-900 mb-1">
                      Upload Excel File (Optional)
                    </h4>
                    <p className="text-sm text-slate-500 mb-3">
                      Upload your recipient Excel file to validate variables against column headers.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={handleExcelUpload}
                    />
                    {formData.excelFileName ? (
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="gap-2 bg-yellow-100 text-yellow-700 border-0 hover:bg-yellow-100">
                          <FileSpreadsheet className="w-3 h-3" />
                          {formData.excelFileName}
                        </Badge>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-lg border-yellow-300 hover:bg-yellow-50"
                        >
                          Change File
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-lg border-yellow-300 hover:bg-yellow-50"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Excel File
                      </Button>
                    )}
                    {formData.excelColumns.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-slate-500 mb-2">Available columns:</p>
                        <div className="flex flex-wrap gap-1">
                          {formData.excelColumns.map((col) => (
                            <Badge key={col} variant="outline" className="text-xs border-slate-200 text-slate-600">
                              {col}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="templateName" className="text-navy-800 font-semibold">Template Name</Label>
                <Input
                  id="templateName"
                  placeholder="e.g., Welcome Email"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subject" className="text-navy-800 font-semibold">Email Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Welcome to our team, {{name}}!"
                  value={formData.subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-navy-800 font-semibold">Email Body</Label>
                <Card className="border-slate-200 rounded-xl overflow-hidden">
                  <CardContent className="p-0">
                    <RichTextEditor
                      content={formData.htmlContent}
                      onChange={handleContentChange}
                      placeholder="Start writing your email here... Use {{variable}} syntax for personalization."
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-2">
                <Label className="text-navy-800 font-semibold">Attachments (Images, Docs, PDFs)</Label>
                <Input 
                  type="file" 
                  multiple 
                  accept="image/*,.doc,.docx,.pdf" 
                  onChange={(e) => {
                    if (e.target.files) {
                      setFormData({
                        ...formData,
                        attachments: [...formData.attachments, ...Array.from(e.target.files)]
                      });
                    }
                  }} 
                  className="rounded-xl border-slate-200 file:bg-yellow-100 file:text-yellow-700 file:border-0 file:rounded-lg file:px-4 file:py-1 file:mr-4 file:font-semibold cursor-pointer"
                />
                {formData.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.attachments.map((file, idx) => {
                      const displayFileName = file instanceof File ? file.name : (file as any).filename;
                      return (
                        <Badge key={idx} variant="secondary" className="pl-3 pr-2 py-1 flex items-center gap-2 bg-slate-100 text-slate-700 border-0">
                          <span className="truncate max-w-[150px]">{displayFileName}</span>
                          <XCircle 
                            className="w-4 h-4 cursor-pointer text-slate-400 hover:text-red-500 transition-colors" 
                            onClick={() => {
                              setFormData({
                                ...formData, 
                                attachments: formData.attachments.filter((_, i) => i !== idx)
                              });
                            }} 
                          />
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Variable Sync Status - Modern Styling */}
              {formData.excelColumns.length > 0 && (
                <div
                  className={`p-4 rounded-xl ${
                    syncStatus === "synced"
                      ? "bg-green-50 border border-green-200"
                      : syncStatus === "mismatch"
                      ? "bg-red-50 border border-red-200"
                      : "bg-slate-50 border border-slate-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {syncStatus === "synced" && <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />}
                    {syncStatus === "mismatch" && <XCircle className="w-5 h-5 text-red-600 mt-0.5" />}
                    {syncStatus === "idle" && <AlertCircle className="w-5 h-5 text-slate-400 mt-0.5" />}
                    <div className="flex-1">
                      <p
                        className={`font-semibold ${
                          syncStatus === "synced"
                            ? "text-green-700"
                            : syncStatus === "mismatch"
                            ? "text-red-700"
                            : "text-navy-900"
                        }`}
                      >
                        {syncStatus === "synced" && "Variables synced with Excel!"}
                        {syncStatus === "mismatch" && "Variable mismatch detected"}
                        {syncStatus === "idle" && "Start typing to detect variables"}
                      </p>
                      {missingVariables.length > 0 && (
                        <p className="text-sm text-red-600 mt-1">
                          Missing in Excel: {missingVariables.map((v) => `{{${v}}}`).join(", ")}
                        </p>
                      )}
                      {extraColumns.length > 0 && (
                        <p className="text-sm text-slate-500 mt-1">
                          Extra columns available: {extraColumns.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Detected Variables - Modern Styling */}
              {(extractVariables(formData.subject).length > 0 ||
                extractVariables(formData.htmlContent).length > 0) && (
                <div className="p-4 rounded-xl bg-yellow-50/50 border border-yellow-100">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-semibold text-navy-900">Detected Variables</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ...new Set([
                        ...extractVariables(formData.subject),
                        ...extractVariables(formData.htmlContent),
                      ]),
                    ].map((v) => (
                      <Badge
                        key={v}
                        variant={formData.excelColumns.includes(v) ? "default" : "secondary"}
                        className={formData.excelColumns.includes(v) 
                          ? "bg-yellow-100 text-yellow-700 border-0 hover:bg-yellow-100" 
                          : "bg-slate-100 text-slate-600 border-0 hover:bg-slate-100"
                        }
                      >
                        {`{{${v}}}`}
                        {formData.excelColumns.includes(v) && <CheckCircle className="w-3 h-3 ml-1" />}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button 
              variant="outline" 
              onClick={() => setIsEditorOpen(false)}
              className="rounded-xl border-slate-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !formData.name || !formData.subject}
              className="bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-semibold rounded-xl"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingTemplate ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog - Modern Styling */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl w-[calc(100%-2rem)] rounded-2xl flex flex-col gap-4 !translate-x-[-50%] !translate-y-[-50%] left-1/2 top-1/2">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-navy-900">{previewTemplate?.name}</DialogTitle>
            <DialogDescription className="text-slate-500">Subject: {previewTemplate?.subject}</DialogDescription>
          </DialogHeader>
          <div
            className="email-content w-full p-4 border border-slate-200 rounded-xl bg-white max-w-none overflow-auto"
            dangerouslySetInnerHTML={{
              __html: previewTemplate?.html_content || "",
            }}
          />
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Templates;
