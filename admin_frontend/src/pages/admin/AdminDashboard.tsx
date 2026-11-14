import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Crown,
  Gift,
  TrendingUp,
  Mail,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

interface DashboardStats {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  totalEmails: number;
  activeUsers: number;
  userGrowth: number;
}

interface RecentUser {
  id: string;
  full_name: string | null;
  email: string;
  subscription_tier: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
    totalEmails: 0,
    activeUsers: 0,
    userGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [chartData, setChartData] = useState<{ name: string; users: number; emails: number }[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      const [statsRes, usersRes, analyticsRes] = await Promise.all([
        apiFetch<{ totalUsers: number; premiumUsers: number; freeUsers: number; totalEmails: number; scheduledPending: number }>("/api/admin/stats"),
        apiFetch<{ users: RecentUser[] }>("/api/admin/users"),
        apiFetch<{ emailRows: Array<{ day: string; sent: number; failed: number }>; userRows: Array<{ day: string; users: number }> }>("/api/admin/analytics?period=7d"),
      ]);

      const users = usersRes.users || [];
      const periodUsers = (analyticsRes.userRows || []).reduce((sum, row) => sum + (Number(row.users) || 0), 0);

      setStats({
        totalUsers: statsRes.totalUsers || 0,
        premiumUsers: statsRes.premiumUsers || 0,
        freeUsers: statsRes.freeUsers || 0,
        totalEmails: statsRes.totalEmails || 0,
        activeUsers: statsRes.totalUsers || 0,
        userGrowth: periodUsers,
      });

      setRecentUsers(users.slice(0, 5));

      const dayMap = new Map<string, { users: number; emails: number }>();
      for (const row of analyticsRes.emailRows || []) {
        const name = new Date(row.day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const existing = dayMap.get(name) || { users: 0, emails: 0 };
        existing.emails += (Number(row.sent) || 0) + (Number(row.failed) || 0);
        dayMap.set(name, existing);
      }
      for (const row of analyticsRes.userRows || []) {
        const name = new Date(row.day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const existing = dayMap.get(name) || { users: 0, emails: 0 };
        existing.users += Number(row.users) || 0;
        dayMap.set(name, existing);
      }
      setChartData(
        Array.from(dayMap.entries()).map(([name, values]) => ({
          name,
          users: values.users,
          emails: values.emails,
        }))
      );
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: "Premium", value: stats.premiumUsers, color: "#FACC15" },
    { name: "Free", value: stats.freeUsers, color: "#CBD5E1" },
  ];

  const statsCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      change: `+${stats.userGrowth} this week`,
      trend: "up" as const,
      icon: Users,
    },
    {
      title: "Premium Users",
      value: stats.premiumUsers.toLocaleString(),
      change: `${((stats.premiumUsers / Math.max(stats.totalUsers, 1)) * 100).toFixed(1)}%`,
      trend: "up" as const,
      icon: Crown,
    },
    {
      title: "Free Users",
      value: stats.freeUsers.toLocaleString(),
      change: "Active trials",
      trend: "up" as const,
      icon: Gift,
    },
    {
      title: "Total Emails Sent",
      value: stats.totalEmails.toLocaleString(),
      change: "All time",
      trend: "up" as const,
      icon: Mail,
    },
  ];

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
          <h1 className="text-3xl md:text-4xl font-bold text-navy-900">Admin Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Overview of your platform statistics and user activity.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-full">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* Stats Grid - Modern Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="border-0 shadow-card rounded-2xl overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-yellow-600" />
                </div>
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-green-100 text-green-700 border-0 font-semibold"
                >
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  {stat.change}
                </Badge>
              </div>
              <p className="text-3xl font-bold text-navy-900">{stat.value}</p>
              <p className="text-sm text-slate-500 font-medium mt-1">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Activity Chart */}
        <Card className="lg:col-span-5 border-0 shadow-card rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-navy-900">Platform Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FACC15" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FACC15" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Area
                    type="monotone"
                    dataKey="emails"
                    stroke="#FACC15"
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    strokeWidth={2}
                    name="Emails"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Distribution Pie */}
        <Card className="lg:col-span-2 border-0 shadow-card rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-navy-900">User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.08)"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-slate-600 font-medium">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Signups - Modern Card */}
      <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-navy-900">Recent Signups</CardTitle>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No users registered yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-yellow-50/50 transition-colors">
                  <div>
                    <p className="font-semibold text-navy-900">{user.full_name || "Unknown"}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={user.subscription_tier === "premium" ? "default" : "secondary"} 
                      className={`text-xs font-semibold border-0 ${
                        user.subscription_tier === "premium" 
                          ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {user.subscription_tier === "premium" ? (
                        <><Crown className="w-3 h-3 mr-1" />Premium</>
                      ) : (
                        <><Gift className="w-3 h-3 mr-1" />Free</>
                      )}
                    </Badge>
                    <span className="text-sm text-slate-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
