import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreVertical,
  Crown,
  Gift,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Users,
  Mail,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

interface UserData {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  subscription_tier: "free" | "premium";
  daily_email_count: number;
  created_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ users: UserData[] }>("/api/admin/users");
      setUsers((data.users || []) as UserData[]);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === "all" || user.subscription_tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const updateUserTier = async (userId: string, newTier: "free" | "premium") => {
    try {
      await apiFetch<{ ok: true }>(`/api/admin/users/${userId}/subscription`, {
        method: "PATCH",
        body: JSON.stringify({ subscription_tier: newTier }),
      });

      toast({
        title: "User Updated",
        description: `User tier changed to ${newTier}.`,
      });
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user.",
        variant: "destructive",
      });
    }
  };

  const getTierBadge = (tier: string) => {
    if (tier === "premium") {
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20">
          <Crown className="w-3 h-3 mr-1" />
          Premium
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Gift className="w-3 h-3 mr-1" />
        Free
      </Badge>
    );
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
          <h1 className="text-3xl md:text-4xl font-bold text-navy-900">User Management</h1>
          <p className="text-slate-600 mt-1">
            Manage user accounts, subscriptions, and permissions.
          </p>
        </div>
      </div>

      {/* Stats - Modern Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">{filteredUsers.length}</p>
                <p className="text-sm text-slate-500 font-medium">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Crown className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">
                  {filteredUsers.filter((u) => u.subscription_tier === "premium").length}
                </p>
                <p className="text-sm text-slate-500 font-medium">Premium</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Gift className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">
                  {filteredUsers.filter((u) => u.subscription_tier === "free").length}
                </p>
                <p className="text-sm text-slate-500 font-medium">Free</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">
                  {filteredUsers.reduce((sum, u) => sum + u.daily_email_count, 0).toLocaleString()}
                </p>
                <p className="text-sm text-slate-500 font-medium">Emails Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Modern Card */}
      <Card className="border-0 shadow-card rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                className="pl-12 rounded-xl border-slate-200 focus:border-yellow-400 focus:ring-yellow-400/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-full sm:w-[150px] rounded-xl border-slate-200">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table - Modern Styling */}
      <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-navy-900">
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile View */}
          <div className="lg:hidden space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No users found</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-4 rounded-xl bg-slate-50 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-navy-900">
                        {user.full_name || "Unknown"}
                      </p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                    {getTierBadge(user.subscription_tier)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="w-4 h-4" />
                      <span>{user.daily_email_count} emails today</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-yellow-50"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem
                          onClick={() =>
                            updateUserTier(
                              user.id,
                              user.subscription_tier === "premium" ? "free" : "premium"
                            )
                          }
                        >
                          <Crown className="w-4 h-4 mr-2 text-yellow-600" />
                          {user.subscription_tier === "premium"
                            ? "Downgrade to Free"
                            : "Upgrade to Premium"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block rounded-xl border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-navy-900 font-semibold">User</TableHead>
                  <TableHead className="text-navy-900 font-semibold">Tier</TableHead>
                  <TableHead className="text-navy-900 font-semibold">Emails Today</TableHead>
                  <TableHead className="text-navy-900 font-semibold">Joined</TableHead>
                  <TableHead className="w-[80px] text-navy-900 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No users found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-navy-900">{user.full_name || "Unknown"}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getTierBadge(user.subscription_tier)}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-navy-900">{user.daily_email_count}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-yellow-50"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem
                              onClick={() =>
                                updateUserTier(
                                  user.id,
                                  user.subscription_tier === "premium" ? "free" : "premium"
                                )
                              }
                            >
                              <Crown className="w-4 h-4 mr-2 text-yellow-600" />
                              {user.subscription_tier === "premium"
                                ? "Downgrade to Free"
                                : "Upgrade to Premium"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

export default AdminUsers;
