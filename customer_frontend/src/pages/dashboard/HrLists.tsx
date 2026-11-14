import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Crown,
  Eye,
  Loader2,
  Lock,
  Mail,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch, logActivity } from "@/lib/api";

interface HrContactRow {
  id: string;
  name: string;
  email: string;
  title: string;
  company: string;
  sort_order: number;
}

interface HrContactsResponse {
  contacts: HrContactRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isPremium: boolean;
  freePreviewLimit: number;
  lockedCount: number;
  companies: string[];
  canEmail: boolean;
  disclaimer: string;
}

const DEFAULT_DISCLAIMER =
  "Please re-verify all HR contact details, email addresses, titles, and company affiliation before using them. This directory is for research assistance only. MailFlow is not responsible for outdated contacts, delivery failures, or any outreach outcomes.";

const HrLists = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HrContactsResponse | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [company, setCompany] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<HrContactRow | null>(null);
  const [emailTarget, setEmailTarget] = useState<HrContactRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (company !== "all") params.set("company", company);

      const res = await apiFetch<HrContactsResponse>(`/api/customer/hr-contacts?${params.toString()}`);
      setData(res);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load HR lists.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, page, debouncedSearch, company, toast]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, company]);

  const isPremium = data?.isPremium ?? false;
  const disclaimer = data?.disclaimer || DEFAULT_DISCLAIMER;

  const openEmail = (contact: HrContactRow) => {
    if (!isPremium) {
      toast({
        title: "Premium feature",
        description: "Upgrade to premium to email HRs from this directory.",
      });
      return;
    }
    setEmailTarget(contact);
  };

  const confirmEmail = async () => {
    if (!emailTarget?.email) return;
    await logActivity("HR email click", {
      hr_contact_id: emailTarget.id,
      hr_name: emailTarget.name,
      company: emailTarget.company,
    });
    const subject = encodeURIComponent(`Opportunity discussion — ${emailTarget.company}`);
    const body = encodeURIComponent(
      `Hi ${emailTarget.name},\n\nI hope you're doing well.\n\n`
    );
    window.open(`mailto:${emailTarget.email}?subject=${subject}&body=${body}`, "_blank");
    setEmailTarget(null);
    toast({
      title: "Email draft opened",
      description: "Re-verify the contact and details before sending.",
    });
  };

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      toast({ title: "Copied", description: email });
    } catch {
      toast({ title: "Copy failed", description: email, variant: "destructive" });
    }
  };

  const visibleLockedHint = useMemo(() => {
    if (!data || data.isPremium) return null;
    return `${data.lockedCount.toLocaleString()} more HR contacts unlock with Premium`;
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-navy-900">HR Lists</h1>
          <p className="text-slate-600 mt-1">
            Company-wise HR contacts — research and re-verify before outreach.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-yellow-100 text-yellow-800 border-0 hover:bg-yellow-100">
            {(data?.total ?? 0).toLocaleString()} contacts
          </Badge>
          {!isPremium && (
            <Badge className="bg-navy-900 text-white border-0 hover:bg-navy-900 gap-1">
              <Crown className="w-3 h-3" />
              Free preview: first {data?.freePreviewLimit ?? 5}
            </Badge>
          )}
        </div>
      </div>

      <Card className="border-0 shadow-card rounded-2xl overflow-hidden border-l-4 border-l-amber-500">
        <CardContent className="p-4 md:p-5 flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p className="font-semibold text-navy-900 mb-1">Platform safety notice</p>
            <p className="text-sm text-slate-600 leading-relaxed">{disclaimer}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-navy-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-yellow-600" />
                HR directory
              </CardTitle>
              <CardDescription className="text-slate-500">
                {isPremium
                  ? "Search, filter, and email HR contacts after re-verifying details."
                  : "Preview the first 5 HR contacts. Upgrade to premium for the full list and email access."}
              </CardDescription>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_260px] pt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, title, company..."
                disabled={!isPremium}
                className="pl-9 rounded-xl border-slate-200"
              />
            </div>
            <Select value={company} onValueChange={setCompany} disabled={!isPremium}>
              <SelectTrigger className="rounded-xl border-slate-200">
                <SelectValue placeholder="Company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All companies</SelectItem>
                {(data?.companies || []).slice(0, 400).map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="min-w-[180px]">HR Name</TableHead>
                      <TableHead className="min-w-[220px]">Email</TableHead>
                      <TableHead className="min-w-[200px]">Title</TableHead>
                      <TableHead className="min-w-[180px]">Company</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.contacts || []).map((contact) => (
                      <TableRow key={contact.id} className="hover:bg-yellow-50/40">
                        <TableCell>
                          <div className="font-semibold text-navy-900">{contact.name}</div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <span className="truncate max-w-[200px]">{contact.email}</span>
                            {isPremium && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 hover:text-yellow-700"
                                onClick={() => copyEmail(contact.email)}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 max-w-[240px]">
                          <span className="line-clamp-2">{contact.title || "—"}</span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {contact.company || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-yellow-700 hover:bg-yellow-50"
                              onClick={() => setSelected(contact)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-semibold"
                              onClick={() => openEmail(contact)}
                              disabled={!isPremium}
                            >
                              {isPremium ? (
                                <>
                                  <Mail className="w-3.5 h-3.5 mr-1" />
                                  Email
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5 mr-1" />
                                  Email
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!data?.contacts?.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                          No HR contacts found for this filter.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {!isPremium && visibleLockedHint && (
                <div className="m-4 p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="font-semibold">Full HR list is premium</p>
                      <p className="text-sm text-slate-300">{visibleLockedHint}</p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-400 text-navy-900 border-0 hover:bg-yellow-400 self-start sm:self-auto px-4 py-2 text-sm font-semibold rounded-full">
                    Upgrade plan to use this feature
                  </Badge>
                </div>
              )}

              {isPremium && (
                <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500">
                    Page {data?.page ?? 1} of {data?.totalPages ?? 1}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      disabled={(data?.page ?? 1) <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      disabled={(data?.page ?? 1) >= (data?.totalPages ?? 1)}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-navy-900">{selected?.name}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {selected?.title}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-900">
                {disclaimer}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Company</p>
                <p className="text-slate-700">{selected.company || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Email</p>
                <p className="text-slate-700 break-all">{selected.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Title</p>
                <p className="text-slate-700">{selected.title || "—"}</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {selected && isPremium && (
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => copyEmail(selected.email)}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy email
              </Button>
            )}
            <Button
              className="rounded-xl bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-semibold"
              disabled={!isPremium}
              onClick={() => selected && openEmail(selected)}
            >
              {isPremium ? "Email this HR" : "Premium required to email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!emailTarget} onOpenChange={(open) => !open && setEmailTarget(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-navy-900">Re-verify before emailing</DialogTitle>
            <DialogDescription className="text-slate-500">
              You are about to email <strong>{emailTarget?.name}</strong> at{" "}
              <strong>{emailTarget?.company}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-950 leading-relaxed">
            Please re-verify the email address, role, and company before sending any outreach.
            MailFlow provides this directory for research assistance only and is not liable for
            outdated contacts, spam complaints, or outreach outcomes.
          </div>
          <p className="text-sm text-slate-600 break-all">
            To: <span className="font-medium text-navy-900">{emailTarget?.email}</span>
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setEmailTarget(null)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-semibold"
              onClick={confirmEmail}
            >
              I understand — open email
              <Mail className="w-4 h-4 ml-1" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HrLists;
