import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Loader2, Wrench } from "lucide-react";

export const MaintenanceGuard = ({ children }: { children: React.ReactNode }) => {
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const data = await apiFetch<{ maintenance_mode: boolean }>("/api/public/status");
                setIsMaintenance(data.maintenance_mode);
            } catch (err) {
                console.error("Failed to check status", err);
            } finally {
                setLoading(false);
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isMaintenance) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-6">
                    <Wrench className="w-12 h-12 text-primary" />
                </div>
                <h1 className="text-3xl font-bold mb-4">Under Maintenance</h1>
                <p className="text-muted-foreground max-w-md">
                    MailFlow is currently down for scheduled maintenance to improve our systems. We expect to be back up shortly. Thank you for your patience!
                </p>
            </div>
        );
    }

    return <>{children}</>;
};
