"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MonitorSmartphone, LogOut } from "lucide-react";
import { toast } from "sonner";
import { getDevices, revokeDevice, revokeAllDevices, type DevicesResult } from "@/app/dashboard/settings/devices/actions";

export function DevicesPanel() {
  const [data, setData] = useState<DevicesResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await getDevices();
        setData(result);
      } catch (error) {
        console.error(error);
        toast.error("Nepodařilo se načíst přihlášená zařízení.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    try {
      await revokeDevice(id);
      setData((prev) =>
        prev
          ? {
              ...prev,
              devices: prev.devices.filter((d) => d.id !== id),
            }
          : prev,
      );
      toast.success("Zařízení bylo odhlášeno.");
    } catch (error) {
      console.error(error);
      toast.error("Nepodařilo se odhlásit zařízení.");
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevokingAll(true);
    try {
      await revokeAllDevices();
      toast.success("Všechna zařízení byla odhlášena.");
      // Odstraníme lokálně a necháme guard + login řešit zbytek
      setData((prev) => (prev ? { ...prev, devices: [] } : prev));
    } catch (error) {
      console.error(error);
      toast.error("Nepodařilo se odhlásit všechna zařízení.");
    } finally {
      setRevokingAll(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Přihlášená zařízení</CardTitle>
          <CardDescription>Načítám seznam vašich relací…</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-6">
          <Loader2 className="size-5 text-muted-foreground animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.devices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Přihlášená zařízení</CardTitle>
          <CardDescription>Momentálně nemáte žádná aktivní zařízení.</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Jakmile se přihlásíte z jiného prohlížeče nebo telefonu, uvidíte ho zde.
        </CardContent>
      </Card>
    );
  }

  const { currentSessionId, devices } = data;

  return (
    <Card>
      <CardHeader className="flex justify-between items-center space-y-0">
        <div>
          <CardTitle>Přihlášená zařízení</CardTitle>
          <CardDescription>
            Nové přihlášení odhlásí stará zařízení. Tady vidíte, kde všude jste aktivní.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRevokeAll}
          disabled={revokingAll}
        >
          {revokingAll ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 size-4" />
          )}
          Odhlásit všechna
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {devices.map((device) => {
          const isCurrent = device.session_id === currentSessionId;
          return (
            <div
              key={device.id}
              className="flex justify-between items-center px-3 py-2 border rounded-md text-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex justify-center items-center bg-muted p-2 rounded-full">
                  <MonitorSmartphone className="size-4" />
                </div>
                <div>
                  <div className="font-medium">
                    {isCurrent ? "Toto zařízení" : "Další zařízení"}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {device.user_agent ?? "Neznámý prohlížeč"} · IP {device.ip_address ?? "?"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Poslední aktivita:{" "}
                    {new Date(device.last_seen_at).toLocaleString("cs-CZ")}
                  </div>
                </div>
              </div>
              {!isCurrent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevoke(device.id)}
                  disabled={revokingId === device.id}
                >
                  {revokingId === device.id ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 size-4" />
                  )}
                  Odhlásit
                </Button>
              )}
              {isCurrent && (
                <span className="bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium text-[11px] text-emerald-600">
                  aktuální
                </span>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
