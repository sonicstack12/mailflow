import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Send,
  Clock,
  AlertCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  Plus,
  Settings,
  HelpCircle,
  ChevronRight,
  Server,
  CheckCircle2,
  Activity,
  Zap,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";

const smtpGuides = [
  {
    name: "Gmail / Google Workspace",
    steps: [
      "Go to Google Account → Security → 2-Step Verification (enable if not already)",
      "Go to App passwords → Generate new app password",
      "Use smtp.gmail.com as host, port 587 (TLS) or 465 (SSL)",
      "Username: your full email address",
      "Password: the 16-character app password generated",
    ],
    note: "Requires app password for secure access",
  },
  {
    name: "Outlook / Microsoft 365",
    steps: [
      "Use smtp.office365.com as host",
      "Port: 587 with STARTTLS",
      "Username: your full email address",
      "Password: your account password or app password if 2FA enabled",
      "Enable SMTP AUTH in Microsoft 365 admin center",
    ],
    note: "Great for business email sending",
  },
  {
    name: "Amazon SES",
    steps: [
      "Verify your domain in AWS SES console",
      "Create SMTP credentials in SES → SMTP Settings",
      "Use region-specific endpoint (e.g., email-smtp.us-east-1.amazonaws.com)",
      "Port: 587 or 465",
      "Move out of sandbox for production use",
    ],
    note: "Very cost-effective: $0.10 per 1000 emails",
  },
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case "sent":
      return <Send className="w-4 h-4 text-primary" />;
    case "scheduled":
      return <Clock className="w-4 h-4 text-primary" />;
    case "template":
      return <FileText className="w-4 h-4 text-primary" />;
    case "smtp":
      return <Server className="w-4 h-4 text-primary" />;
    default:
      return <Mail className="w-4 h-4 text-primary" />;
  }
};

interface Activity {
  id: string;
  type: string;
  description: string;
  time: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState({
    emailsSent: 0,
    scheduledCount: 0,
    failedCount: 0,
    templatesCount: 0,
    deliveryRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ name: string; sent: number }[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [logsRes, scheduledRes, templatesRes] = await Promise.all([
        apiFetch<{ logs: Array<any> }>("/api/customer/logs"),
        apiFetch<{ scheduled: Array<any> }>("/api/customer/scheduled?status=pending"),
        apiFetch<{ templates: Array<any> }>("/api/customer/templates"),
      ]);

      const logs = logsRes.logs || [];
      const scheduled = scheduledRes.scheduled || [];
      const templates = templatesRes.templates || [];

      // Calculate stats
      const sentCount = logs.filter((l) => l.status === "sent").length;
      const failedCount = logs.filter((l) => l.status === "failed").length;
      const totalAttempted = sentCount + failedCount;
      const deliveryRate = totalAttempted > 0 ? ((sentCount / totalAttempted) * 100) : 100;

      setStats({
        emailsSent: sentCount,
        scheduledCount: scheduled.length,
        failedCount,
        templatesCount: templates.length,
        deliveryRate: parseFloat(deliveryRate.toFixed(1)),
      });

      // Generate chart data from logs (last 7 days) - real data
      const now = new Date();
      const chartD = [];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        const dayStr = day.toLocaleDateString("en-US", { weekday: "short" });
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const count = logs.filter((l) => {
          const created = new Date(l.created_at);
          return created >= dayStart && created < dayEnd && l.status === "sent";
        }).length;
        chartD.push({ name: dayStr, sent: count });
      }
      setChartData(chartD);

      // Generate recent activity
      const activities: Activity[] = [];

      // Add recent logs
      logs.slice(0, 3).forEach((log) => {
        activities.push({
          id: log.id,
          type: "sent",
          description: `Email "${log.subject}" ${log.status} to ${log.recipient_email}`,
          time: new Date(log.created_at).toLocaleDateString(),
        });
      });

      // Add recent scheduled
      scheduled.slice(0, 2).forEach((s) => {
        activities.push({
          id: s.id,
          type: "scheduled",
          description: `${s.name} scheduled for ${new Date(s.scheduled_time).toLocaleDateString()}`,
          time: "Upcoming",
        });
      });

      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Emails Sent",
      value: stats.emailsSent.toLocaleString(),
      change: "This period",
      trend: "up" as const,
      icon: Send,
    },
    {
      title: "Scheduled",
      value: stats.scheduledCount.toString(),
      change: "Pending",
      trend: "neutral" as const,
      icon: Clock,
    },
    {
      title: "Failed",
      value: stats.failedCount.toString(),
      change: "Needs attention",
      trend: stats.failedCount > 0 ? "down" as const : "up" as const,
      icon: AlertCircle,
    },
    {
      title: "Delivery Rate",
      value: `${stats.deliveryRate}%`,
      change: `${stats.templatesCount} templates`,
      trend: "up" as const,
      icon: Zap,
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
          <h1 className="text-3xl md:text-4xl font-bold text-navy-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Welcome back! Here's an overview of your email activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-full">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>Live</span>
          </div>
          <Button 
            asChild
            className="bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-semibold shadow-lg shadow-yellow-400/25 transition-all hover:scale-[1.02]"
          >
            <Link to="/dashboard/scheduled">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Email
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid - Modern Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="border-0 shadow-card rounded-2xl overflow-hidden hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-yellow-600" />
                </div>
                <span
                  className={`text-sm font-semibold flex items-center gap-1 px-2.5 py-1 rounded-full ${stat.trend === "up"
                      ? "text-green-700 bg-green-100"
                      : stat.trend === "down"
                        ? "text-orange-700 bg-orange-100"
                        : "text-slate-600 bg-slate-100"
                    }`}
                >
                  {stat.trend === "up" && <TrendingUp className="w-3.5 h-3.5" />}
                  {stat.trend === "down" && <TrendingDown className="w-3.5 h-3.5" />}
                  {stat.change}
                </span>
              </div>
              <div className="mt-5">
                <p className="text-3xl font-bold text-navy-900">{stat.value}</p>
                <p className="text-sm text-slate-500 font-medium mt-1">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Chart */}
        <Card className="lg:col-span-4 border-0 shadow-card rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-navy-900">Email Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#FACC15"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#FACC15"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748B"
                    fontSize={12}
                  />
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
                    dataKey="sent"
                    stroke="#FACC15"
                    fillOpacity={1}
                    fill="url(#colorSent)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3 border-0 shadow-card rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-navy-900">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No recent activity yet</p>
                <p className="text-sm mt-1">Start by configuring SMTP and creating templates</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 hover:bg-yellow-50/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-900 line-clamp-2">
                        {activity.description}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Modern Cards */}
      <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-navy-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              variant="outline" 
              className="h-auto p-5 justify-start rounded-xl border-2 border-slate-200 hover:border-yellow-300 hover:bg-yellow-50/50 transition-all group" 
              asChild
            >
              <Link to="/dashboard/smtp">
                <Settings className="w-6 h-6 mr-4 text-slate-500 group-hover:text-yellow-600 transition-colors" />
                <div className="text-left">
                  <p className="font-semibold text-navy-900">Configure SMTP</p>
                  <p className="text-sm text-slate-500">Add or manage SMTP servers</p>
                </div>
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-5 justify-start rounded-xl border-2 border-slate-200 hover:border-yellow-300 hover:bg-yellow-50/50 transition-all group" 
              asChild
            >
              <Link to="/dashboard/templates">
                <FileText className="w-6 h-6 mr-4 text-slate-500 group-hover:text-yellow-600 transition-colors" />
                <div className="text-left">
                  <p className="font-semibold text-navy-900">Create Template</p>
                  <p className="text-sm text-slate-500">Design a new email template</p>
                </div>
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-5 justify-start rounded-xl border-2 border-slate-200 hover:border-yellow-300 hover:bg-yellow-50/50 transition-all group" 
              asChild
            >
              <Link to="/dashboard/scheduled">
                <Clock className="w-6 h-6 mr-4 text-slate-500 group-hover:text-yellow-600 transition-colors" />
                <div className="text-left">
                  <p className="font-semibold text-navy-900">Schedule Email</p>
                  <p className="text-sm text-slate-500">Schedule an email for later</p>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SMTP Setup Guide - Modern Accordion */}
      <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-navy-900">SMTP Setup Guide</CardTitle>
              <p className="text-sm text-slate-500 mt-0.5">
                Step-by-step instructions to configure popular email providers
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {smtpGuides.map((guide, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-slate-100 last:border-0">
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                      <Server className="w-5 h-5 text-yellow-600" />
                    </div>
                    <span className="font-semibold text-navy-900">{guide.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-14 space-y-4">
                    <ol className="space-y-3">
                      {guide.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-yellow-700 mt-0.5">
                            {stepIndex + 1}
                          </span>
                          <span className="text-sm text-slate-600 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50/50 border border-yellow-100">
                      <CheckCircle2 className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-600">{guide.note}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild
                      className="rounded-lg border-2 border-yellow-300 hover:bg-yellow-50"
                    >
                      <Link to="/dashboard/smtp">
                        Configure Now
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
