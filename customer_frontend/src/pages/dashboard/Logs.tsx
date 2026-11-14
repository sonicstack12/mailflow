import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Mail,
  RefreshCw,
  Loader2,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";

interface EmailLogEntry {
  id: string;
  subject: string;
  recipient_email: string;
  recipient_name: string | null;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "sent":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "failed":
      return <XCircle className="w-4 h-4 text-destructive" />;
    case "pending":
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case "bounced":
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    default:
      return null;
  }
};

const getStatusBadge = (status: string) => {
  const styles = {
    sent: "bg-green-500/10 text-green-600 border-green-200",
    failed: "bg-destructive/10 text-destructive border-destructive/20",
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    bounced: "bg-orange-500/10 text-orange-600 border-orange-200",
  };
  return styles[status as keyof typeof styles] || "";
};

const Logs = () => {
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ logs: EmailLogEntry[] }>("/api/customer/logs?limit=500");
      setLogs((data.logs || []) as EmailLogEntry[]);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast({
        title: "Error",
        description: "Failed to load email logs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.recipient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.recipient_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: logs.length,
    sent: logs.filter((l) => l.status === "sent").length,
    failed: logs.filter((l) => l.status === "failed").length,
    pending: logs.filter((l) => l.status === "pending").length,
    bounced: logs.filter((l) => l.status === "bounced").length,
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLogs();
    setIsRefreshing(false);
    toast({
      title: "Logs Refreshed",
      description: "Email logs have been updated with the latest data.",
    });
  };

  const handleClearLogs = () => {
    setLogs([]);
    toast({
      title: "Logs Cleared",
      description: "All log entries have been cleared.",
    });
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
          <h1 className="text-3xl md:text-4xl font-bold text-navy-900">Logs & Reports</h1>
          <p className="text-slate-600 mt-1">
            Track email delivery status and troubleshoot issues.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            <span className="text-yellow-600 font-medium">Free plan:</span> Logs stored for 24 hours |
            <span className="text-yellow-600 font-medium ml-1">Premium:</span> Logs stored for 7 days
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="rounded-xl border-slate-200 hover:bg-yellow-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleClearLogs}
            className="rounded-xl border-slate-200 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Logs
          </Button>
        </div>
      </div>

      {/* Stats - Modern Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center">
                <Mail className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">{stats.total}</p>
                <p className="text-sm text-slate-500 font-medium">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">{stats.sent}</p>
                <p className="text-sm text-slate-500 font-medium">Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">{stats.pending}</p>
                <p className="text-sm text-slate-500 font-medium">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">{stats.failed}</p>
                <p className="text-sm text-slate-500 font-medium">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">{stats.bounced}</p>
                <p className="text-sm text-slate-500 font-medium">Bounced</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Modern Card */}
      <Card className="border-0 shadow-card rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search by email, name, or subject..."
                className="pl-12 rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] rounded-xl border-slate-200">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table - Modern Styling */}
      <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-navy-900">Email Logs ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-navy-900 font-semibold">Status</TableHead>
                  <TableHead className="text-navy-900 font-semibold">Recipient</TableHead>
                  <TableHead className="text-navy-900 font-semibold">Subject</TableHead>
                  <TableHead className="text-navy-900 font-semibold">Sent At</TableHead>
                  <TableHead className="text-navy-900 font-semibold">Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No logs found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <Badge 
                            variant="outline" 
                            className={`font-medium ${getStatusBadge(log.status)}`}
                          >
                            {log.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-navy-900">{log.recipient_name || "—"}</p>
                          <p className="text-sm text-slate-500">{log.recipient_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-slate-700">{log.subject}</TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">
                          {log.sent_at
                            ? new Date(log.sent_at).toLocaleString()
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {log.error_message ? (
                          <span className="text-sm text-red-600">{log.error_message}</span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Logs;
