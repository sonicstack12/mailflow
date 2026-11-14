import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  Mail,
  Users,
  Clock,
  Loader2,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";
import { apiFetch } from "@/lib/api";

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");
  const [stats, setStats] = useState({
    totalEmails: 0,
    totalUsers: 0,
    avgEmailsPerUser: 0,
    scheduledEmails: 0,
  });
  const [emailData, setEmailData] = useState<{ name: string; sent: number; failed: number }[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<{ name: string; users: number }[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const [statsRes, analyticsRes] = await Promise.all([
        apiFetch<{ totalUsers: number; premiumUsers: number; freeUsers: number; totalEmails: number; scheduledPending: number }>("/api/admin/stats"),
        apiFetch<{ emailRows: Array<{ day: string; sent: number; failed: number }>; userRows: Array<{ day: string; users: number }> }>(
          `/api/admin/analytics?period=${encodeURIComponent(period)}`
        ),
      ]);

      setStats({
        totalEmails: statsRes.totalEmails || 0,
        totalUsers: statsRes.totalUsers || 0,
        avgEmailsPerUser: (statsRes.totalUsers || 0) > 0 ? Math.round((statsRes.totalEmails || 0) / (statsRes.totalUsers || 1)) : 0,
        scheduledEmails: statsRes.scheduledPending || 0,
      });

      setEmailData(
        (analyticsRes.emailRows || []).map((r) => ({
          name: new Date(r.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          sent: Number(r.sent) || 0,
          failed: Number(r.failed) || 0,
        }))
      );

      setUserGrowthData(
        (analyticsRes.userRows || []).map((r) => ({
          name: new Date(r.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          users: Number(r.users) || 0,
        }))
      );
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl md:text-4xl font-bold text-navy-900">Analytics</h1>
          <p className="text-slate-600 mt-1">
            Platform performance and user engagement metrics.
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[150px] rounded-xl border-slate-200">
            <BarChart3 className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats - Modern Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center">
                <Mail className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">{stats.totalEmails.toLocaleString()}</p>
                <p className="text-sm text-slate-500 font-medium">Total Emails</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-slate-500 font-medium">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">{stats.avgEmailsPerUser}</p>
                <p className="text-sm text-slate-500 font-medium">Avg/User</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">{stats.scheduledEmails}</p>
                <p className="text-sm text-slate-500 font-medium">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts - Modern Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Email Activity Chart */}
        <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-navy-900">Email Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emailData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.08)"
                    }}
                  />
                  <Bar dataKey="sent" fill="#FACC15" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Growth Chart */}
        <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-navy-900">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.08)"
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#FACC15" 
                    strokeWidth={3}
                    dot={{ fill: "#FACC15", r: 4 }}
                    activeDot={{ r: 6, fill: "#FACC15" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info — computed from EmailLog analytics for selected period */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base lg:text-lg">Usage Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const periodSent = emailData.reduce((sum, row) => sum + row.sent, 0);
            const periodFailed = emailData.reduce((sum, row) => sum + row.failed, 0);
            const periodTotal = periodSent + periodFailed;
            const successRate = periodTotal > 0 ? Math.round((periodSent / periodTotal) * 100) : 0;
            return (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl lg:text-3xl font-bold text-primary">
                    {periodSent.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Delivered Successfully</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl lg:text-3xl font-bold text-foreground">
                    {periodFailed.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Failed Delivery</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl lg:text-3xl font-bold text-foreground">
                    {successRate}%
                  </p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
