import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2, ArrowLeft, ArrowRight, UserCircle, Clock, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";

interface ActivityLog {
    id: string;
    action: string;
    details: any;
    ip_address: string;
    user_agent: string;
    created_at: string;
    user: {
        email: string;
        full_name: string;
    };
}

async function fetchActivities(page: number, limit: number = 20) {
    return apiFetch<{ logs: ActivityLog[]; totalPages: number }>(
        `/api/admin/activities?page=${page}&limit=${limit}`
    );
}

const AdminActivities = () => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            loadActivities(page);
        }
    }, [user, page]);

    const loadActivities = async (currentPage: number) => {
        try {
            setLoading(true);
            const data = await fetchActivities(currentPage);
            setLogs(data.logs);
            setTotalPages(data.totalPages || 1);
        } catch (e: any) {
            console.error(e);
            toast({
                title: "Error fetching activities",
                description: e.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold text-navy-900">User Activities</h1>
                <p className="text-slate-600 mt-1">
                    Monitor actions performed by users across the customer frontend.
                </p>
            </div>

            <Card className="border-0 shadow-card rounded-2xl overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-navy-900">Activity Logs</CardTitle>
                    <CardDescription className="text-slate-500">A real-time view of customer behavior.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="text-navy-900 font-semibold">User</TableHead>
                                    <TableHead className="text-navy-900 font-semibold">Action</TableHead>
                                    <TableHead className="text-navy-900 font-semibold">Details</TableHead>
                                    <TableHead className="text-navy-900 font-semibold">IP Address</TableHead>
                                    <TableHead className="text-right text-navy-900 font-semibold">Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center">
                                            <div className="flex items-center justify-center">
                                                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                                            No activities found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id} className="hover:bg-slate-50/50">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-navy-900">{log.user.full_name || "Unknown"}</span>
                                                    <span className="text-xs text-slate-500">{log.user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold text-navy-900">{log.action}</TableCell>
                                            <TableCell>
                                                <div className="max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md truncate text-sm text-slate-600">
                                                    {log.details ? JSON.stringify(log.details) : "-"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-500">
                                                {log.ip_address || "Unknown"}
                                            </TableCell>
                                            <TableCell className="text-right whitespace-nowrap text-sm text-slate-500">
                                                {formatDate(log.created_at)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-end space-x-2 mt-6">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="rounded-lg border-slate-200 hover:bg-yellow-50"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <div className="text-sm font-medium text-slate-600 px-2">
                            Page {page} of {Math.max(1, totalPages)}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages || loading}
                            className="rounded-lg border-slate-200 hover:bg-yellow-50"
                        >
                            Next <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminActivities;
