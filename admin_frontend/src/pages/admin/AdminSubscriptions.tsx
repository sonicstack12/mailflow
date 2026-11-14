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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  CreditCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

interface SubscriptionData {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  subscription_tier: "free" | "premium";
  subscription_expires_at: string | null;
  daily_email_count: number;
  created_at: string;
}

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<SubscriptionData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ users: SubscriptionData[] }>("/api/admin/users");
      setSubscriptions((data.users || []) as SubscriptionData[]);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast({
        title: "Error",
        description: "Failed to load subscriptions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      (sub.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === "all" || sub.subscription_tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const updateSubscription = async (userId: string, newTier: "free" | "premium") => {
    try {
      await apiFetch<{ ok: true }>(`/api/admin/users/${userId}/subscription`, {
        method: "PATCH",
        body: JSON.stringify({ subscription_tier: newTier }),
      });

      toast({
        title: "Subscription Updated",
        description: `User ${newTier === "premium" ? "upgraded to Premium" : "downgraded to Free"}.`,
      });
      setIsDialogOpen(false);
      fetchSubscriptions();
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: "Error",
        description: "Failed to update subscription.",
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

  const getStatusBadge = (sub: SubscriptionData) => {
    if (sub.subscription_tier === "premium" && sub.subscription_expires_at) {
      const expiry = new Date(sub.subscription_expires_at);
      const now = new Date();
      if (expiry > now) {
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      } else {
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      }
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Trial
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-navy-900">Subscriptions</h1>
          <p className="text-slate-600 mt-1">
            Manage user subscriptions and billing.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchSubscriptions}
          className="rounded-xl border-slate-200 hover:bg-yellow-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats - Modern Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-0 shadow-card rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">{subscriptions.length}</p>
                <p className="text-sm text-slate-500 font-medium">Total</p>
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
                  {subscriptions.filter(s => s.subscription_tier === "premium").length}
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
                  {subscriptions.filter(s => s.subscription_tier === "free").length}
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
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">
                  {subscriptions.filter(s => {
                    if (s.subscription_tier === "premium" && s.subscription_expires_at) {
                      return new Date(s.subscription_expires_at) > new Date();
                    }
                    return false;
                  }).length}
                </p>
                <p className="text-sm text-slate-500 font-medium">Active Premium</p>
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
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table - Modern Styling */}
      <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-navy-900">
            Subscriptions ({filteredSubscriptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile View */}
          <div className="lg:hidden space-y-3">
            {filteredSubscriptions.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No subscriptions found</p>
              </div>
            ) : (
              filteredSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-xl bg-slate-50 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-navy-900">
                        {sub.full_name || "Unknown"}
                      </p>
                      <p className="text-sm text-slate-500">{sub.email}</p>
                    </div>
                    {getTierBadge(sub.subscription_tier)}
                  </div>
                  <div className="flex items-center justify-between">
                    {getStatusBadge(sub)}
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
                          onClick={() => {
                            setSelectedUser(sub);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Crown className="w-4 h-4 mr-2 text-yellow-600" />
                          Change Plan
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
                  <TableHead className="text-navy-900 font-semibold">Plan</TableHead>
                  <TableHead className="text-navy-900 font-semibold">Status</TableHead>
                  <TableHead className="text-navy-900 font-semibold">Expires</TableHead>
                  <TableHead className="w-[80px] text-navy-900 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No subscriptions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <TableRow key={sub.id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div>
                          <p className="font-semibold text-navy-900">{sub.full_name || "Unknown"}</p>
                          <p className="text-sm text-slate-500">{sub.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getTierBadge(sub.subscription_tier)}</TableCell>
                      <TableCell>{getStatusBadge(sub)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">
                          {sub.subscription_expires_at
                            ? new Date(sub.subscription_expires_at).toLocaleDateString()
                            : "-"}
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
                              onClick={() => {
                                setSelectedUser(sub);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Crown className="w-4 h-4 mr-2 text-yellow-600" />
                              Change Plan
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

      {/* Change Plan Dialog - Modern Styling */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-navy-900">Change Subscription Plan</DialogTitle>
            <DialogDescription className="text-slate-500">
              Update the subscription plan for {selectedUser?.full_name || selectedUser?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-slate-600">
              Current plan: <strong className="text-navy-900">{selectedUser?.subscription_tier}</strong>
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant={selectedUser?.subscription_tier === "free" ? "default" : "outline"}
                onClick={() => selectedUser && updateSubscription(selectedUser.id, "premium")}
                disabled={selectedUser?.subscription_tier === "premium"}
                className={`rounded-xl ${
                  selectedUser?.subscription_tier === "free"
                    ? "bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-semibold"
                    : "border-yellow-300 hover:bg-yellow-50"
                }`}
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
              <Button
                variant={selectedUser?.subscription_tier === "premium" ? "default" : "outline"}
                onClick={() => selectedUser && updateSubscription(selectedUser.id, "free")}
                disabled={selectedUser?.subscription_tier === "free"}
                className={`rounded-xl ${
                  selectedUser?.subscription_tier === "premium"
                    ? "bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-semibold"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Gift className="w-4 h-4 mr-2" />
                Downgrade to Free
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="rounded-xl border-slate-200"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptions;
