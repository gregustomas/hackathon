import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminLog } from "@/interfaces/logs";

export default function AuditLogs({ logs }: { logs: AdminLog[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Systémové Logy (Audit)</CardTitle>
                <CardDescription>Záznamy o všech administrátorských akcích</CardDescription>
            </CardHeader>
            <CardContent>
                {logs.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Zatím nebyly provedeny žádné akce.</p>
                ) : (
                    <div className="space-y-3">
                        {logs.map((log) => (
                            <div key={log.id} className="flex md:flex-row flex-col justify-between md:items-center bg-card p-3 border rounded-lg">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <Badge variant={log.severity === 'warning' ? 'destructive' : 'secondary'} className="text-[10px]">
                                            {log.action_type}
                                        </Badge>
                                        <span className="font-mono text-muted-foreground text-xs">
                                            Admin: {log.user_email}
                                        </span>
                                    </div>
                                    <span className="font-medium text-sm">{log.message}</span>
                                </div>
                                <div className="mt-2 md:mt-0 font-mono text-muted-foreground text-xs">
                                    {new Date(log.created_at).toLocaleString("cs-CZ")}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
