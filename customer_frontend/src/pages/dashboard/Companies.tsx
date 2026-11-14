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
  Building2,
  Crown,
  ExternalLink,
  Eye,
  Loader2,
  Lock,
  Search,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";

interface CompanyRow {
  id: string;
  name: string;
  industry: string;
  employer_type: string;
  company_size: string;
  founded_year: string;
  hq_location: string;
  office_locations: string;
  fresher_roles: string;
  ctc_software_engineer: string;
  ctc_fullstack: string;
  ctc_system_engineer: string;
  ctc_frontend: string;
  ctc_backend: string;
  ctc_mern: string;
  ctc_data_scientist: string;
  ctc_aiml: string;
  ctc_data_analyst: string;
  ctc_marketing: string;
  description: string;
  work_mode: string;
  website: string;
  careers_link: string;
  fresher_hiring_signal: string;
  priority: string;
  pay_caveat: string;
  last_reviewed: string;
  sort_order: number;
}

interface CompaniesResponse {
  companies: CompanyRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isPremium: boolean;
  freePreviewLimit: number;
  lockedCount: number;
  industries: string[];
  disclaimer: string;
}

const DEFAULT_DISCLAIMER =
  "Please re-verify all company details, openings, eligibility, salary, and careers links before applying. This directory is for research assistance only. MailFlow is not responsible for hiring outcomes, outdated listings, or any decisions made using this data.";

const Companies = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CompaniesResponse | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [industry, setIndustry] = useState("all");
  const [priority, setPriority] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CompanyRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCompanies = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (industry !== "all") params.set("industry", industry);
      if (priority !== "all") params.set("priority", priority);

      const res = await apiFetch<CompaniesResponse>(`/api/customer/companies?${params.toString()}`);
      setData(res);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to load companies directory.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, page, debouncedSearch, industry, priority, toast]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, industry, priority]);

  const isPremium = data?.isPremium ?? false;
  const disclaimer = data?.disclaimer || DEFAULT_DISCLAIMER;

  const priorityBadge = (value: string) => {
    if (value.startsWith("A")) return "bg-yellow-100 text-yellow-800 border-0";
    if (value.startsWith("B")) return "bg-slate-100 text-slate-700 border-0";
    return "bg-slate-50 text-slate-500 border-0";
  };

  const visibleLockedHint = useMemo(() => {
    if (!data || data.isPremium) return null;
    return `${data.lockedCount.toLocaleString()} more companies unlock with Premium`;
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-navy-900">Companies</h1>
          <p className="text-slate-600 mt-1">
            Indian fresher hiring directory — research targets before you apply.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-yellow-100 text-yellow-800 border-0 hover:bg-yellow-100">
            {(data?.total ?? 0).toLocaleString()} employers
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
                <Building2 className="w-5 h-5 text-yellow-600" />
                Employer directory
              </CardTitle>
              <CardDescription className="text-slate-500">
                {isPremium
                  ? "Search and filter the full employer directory after re-verifying details."
                  : "Preview the first 5 companies. Upgrade to premium for the full directory."}
              </CardDescription>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_220px_180px] pt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company, industry, city, role..."
                disabled={!isPremium}
                className="pl-9 rounded-xl border-slate-200"
              />
            </div>
            <Select
              value={industry}
              onValueChange={setIndustry}
              disabled={!isPremium}
            >
              <SelectTrigger className="rounded-xl border-slate-200">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All industries</SelectItem>
                {(data?.industries || []).map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={setPriority} disabled={!isPremium}>
              <SelectTrigger className="rounded-xl border-slate-200">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="A">A — Monitor first</SelectItem>
                <SelectItem value="B">B — Strong target</SelectItem>
                <SelectItem value="C">C — Exploratory</SelectItem>
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
                      <TableHead className="min-w-[200px]">Company</TableHead>
                      <TableHead className="min-w-[180px]">Industry</TableHead>
                      <TableHead className="min-w-[180px]">Locations</TableHead>
                      <TableHead className="min-w-[200px]">Fresher roles</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.companies || []).map((company) => (
                      <TableRow key={company.id} className="hover:bg-yellow-50/40">
                        <TableCell>
                          <div className="font-semibold text-navy-900">{company.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {company.hq_location || "HQ not listed"}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {company.industry || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 max-w-[220px]">
                          <span className="line-clamp-2">{company.office_locations || "—"}</span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 max-w-[240px]">
                          <span className="line-clamp-2">{company.fresher_roles || "—"}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityBadge(company.priority || "")}>
                            {(company.priority || "—").split("—")[0].trim() || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-yellow-700 hover:bg-yellow-50"
                            onClick={() => setSelected(company)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!data?.companies?.length && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                          No companies found for this filter.
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
                      <p className="font-semibold">Full directory is premium</p>
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-navy-900">{selected?.name}</DialogTitle>
            <DialogDescription className="text-slate-500">
              {selected?.industry}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-900">
                {disclaimer}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Info label="HQ" value={selected.hq_location} />
                <Info label="Founded" value={selected.founded_year} />
                <Info label="Size" value={selected.company_size} />
                <Info label="Work mode" value={selected.work_mode} />
              </div>
              <Info label="Office locations" value={selected.office_locations} />
              <Info label="Fresher roles" value={selected.fresher_roles} />
              <Info label="Hiring signal" value={selected.fresher_hiring_signal} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Indicative fresher CTC
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  <Info label="Software Engineer" value={selected.ctc_software_engineer} />
                  <Info label="Full Stack" value={selected.ctc_fullstack} />
                  <Info label="Data Scientist" value={selected.ctc_data_scientist} />
                  <Info label="AI/ML" value={selected.ctc_aiml} />
                </div>
              </div>
              <Info label="Pay caveat" value={selected.pay_caveat} />
              <Info label="Profile summary" value={selected.description} />
              <p className="text-xs text-slate-400">Last reviewed: {selected.last_reviewed || "—"}</p>
            </div>
          )}
          <DialogFooter className="gap-2">
            {selected?.website && (
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => window.open(selected.website, "_blank", "noopener,noreferrer")}
              >
                Website
                <ExternalLink className="w-4 h-4 ml-1" />
              </Button>
            )}
            {selected?.careers_link && (
              <Button
                className="rounded-xl bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-semibold"
                onClick={() =>
                  window.open(selected.careers_link, "_blank", "noopener,noreferrer")
                }
              >
                Careers page
                <ExternalLink className="w-4 h-4 ml-1" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">{label}</p>
      <p className="text-slate-700 whitespace-pre-wrap">{value?.trim() || "—"}</p>
    </div>
  );
}

export default Companies;
