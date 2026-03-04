
"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Instrument = {
  id: string;
  symbol: string;
  name: string;
  series: number[];
  decimals: number;
  updatedAt?: string;
  last?: number;
};

function formatNumber(value: number, decimals: number) {
  return value.toLocaleString("cs-CZ", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function pctChange(first: number, last: number) {
  if (!Number.isFinite(first) || first === 0) return 0;
  return ((last - first) / first) * 100;
}

function Sparkline({
  series,
  strokeClassName,
  height = 28,
}: {
  series: number[];
  strokeClassName: string;
  height?: number;
}) {
  const data = React.useMemo(() => series.map((v, i) => ({ i, v })), [series]);
  const stroke = React.useMemo(() => {
    if (strokeClassName.includes("emerald")) return "hsl(142.1 76.2% 36.3%)";
    if (strokeClassName.includes("rose")) return "hsl(346.8 77.2% 49.8%)";
    return "hsl(var(--foreground))";
  }, [strokeClassName]);
  const fill = React.useMemo(() => {
    if (strokeClassName.includes("emerald")) return "hsl(142.1 70.6% 45.3% / 0.25)";
    if (strokeClassName.includes("rose")) return "hsl(346.8 77.2% 49.8% / 0.22)";
    return "hsl(var(--foreground) / 0.18)";
  }, [strokeClassName]);

  return (
    <div className="w-20">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <Tooltip
            cursor={false}
            contentStyle={{ display: "none" }}
            wrapperStyle={{ display: "none" }}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={2}
            fill={fill}
            fillOpacity={1}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function InstrumentRow({ instrument, compact = true }: { instrument: Instrument; compact?: boolean }) {
  const first = instrument.series[0] ?? 0;
  const last = instrument.series[instrument.series.length - 1] ?? 0;
  const change = pctChange(first, last);
  const up = change >= 0;

  return (
    <div
      className={cn(
        "flex justify-between items-center gap-3 bg-muted/20 px-3 py-2 border rounded-lg",
        "hover:bg-muted/30 transition-colors"
      )}
    >
      <div className="min-w-0">
        <div className="font-semibold truncate leading-5">{instrument.symbol}</div>
        <div className="text-muted-foreground text-xs truncate">{instrument.name}</div>
      </div>

      <Sparkline
        series={instrument.series}
        height={compact ? 28 : 44}
        strokeClassName={up ? "text-emerald-500" : "text-rose-500"}
      />

      <div className="text-right shrink-0">
        <div className={cn("font-mono font-semibold tabular-nums text-xs", up ? "text-emerald-600" : "text-rose-600")}>
          {up ? "+" : ""}
          {formatNumber(change, 2)}%
        </div>
        <div className="font-mono tabular-nums text-muted-foreground text-xs">
          {formatNumber(last, instrument.decimals)}
        </div>
      </div>
    </div>
  );
}

function InstrumentRowSkeleton() {
  return (
    <div className="flex justify-between items-center gap-3 bg-muted/20 px-3 py-2 border rounded-lg">
      <div className="flex-1 space-y-1 min-w-0">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-36 h-3" />
      </div>
      <Skeleton className="w-20 h-7" />
      <div className="space-y-1 w-18 text-right">
        <Skeleton className="ml-auto w-14 h-3" />
        <Skeleton className="ml-auto w-16 h-3" />
      </div>
    </div>
  );
}

export function MarketReviewCZCard({ initialData }: { initialData?: Instrument[] }) {
  const [data, setData] = React.useState<Instrument[] | null>(initialData ?? null);
  const [loading, setLoading] = React.useState(!initialData);
  const [error, setError] = React.useState<string | null>(null);
  const hasLoadedRef = React.useRef(Boolean(initialData));

  const pageSize = 5;
  const pages = React.useMemo(() => {
    const items = data ?? [];
    const chunks: Instrument[][] = [];
    for (let i = 0; i < items.length; i += pageSize) {
      chunks.push(items.slice(i, i + pageSize));
    }
    return chunks;
  }, [data, pageSize]);

  const [page, setPage] = React.useState(0);
  const pageCount = pages.length;
  const pageItems = pages[page] ?? pages[0] ?? [];

  const canPrev = pageCount > 1;
  const canNext = pageCount > 1;

  const load = React.useCallback(async () => {
    const showSkeleton = !hasLoadedRef.current;
    setError(null);
    if (showSkeleton) setLoading(true);
    try {
      const res = await fetch("/api/markets", { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error (${res.status}): ${text}`);
      }
      const json = (await res.json()) as { instruments: Instrument[] };
      setData(json.instruments);
      if (!hasLoadedRef.current) setPage(0);
      hasLoadedRef.current = true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chyba při načítání dat");
      // Keep last known data if we already loaded once.
      if (!hasLoadedRef.current) setData(null);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
    const id = window.setInterval(() => {
      void load();
    }, 30_000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <Card>
      <CardHeader className="space-y-3 h-full">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Trhy</CardTitle>
          <Badge variant="secondary">CZK</Badge>
          <Badge variant="secondary">live</Badge>
        </div>
        <CardDescription>
          Živý přehled trhu. Obnovuje se každých ~30s.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: pageSize }).map((_, i) => (
              <InstrumentRowSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {error ? (
              <div className="flex justify-between items-start gap-3 bg-muted/20 px-3 py-2 border rounded-lg text-xs">
                <div className="min-w-0">
                  <div className="font-medium">Data se nepodařilo obnovit</div>
                  <div className="text-muted-foreground wrap-break-word">{error}</div>
                </div>
                <Button onClick={() => void load()} variant="outline" size="sm" className="h-7">
                  Retry
                </Button>
              </div>
            ) : null}

            <div className="space-y-2">
              {pageItems.map((instrument) => (
                <InstrumentRow key={instrument.id} instrument={instrument} />
              ))}
            </div>
          </>
        )}

        <div className="flex justify-between items-center pt-1">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              disabled={!canPrev}
              onClick={() => setPage((p) => (p - 1 + pageCount) % pageCount)}
              aria-label="Předchozí"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <div className="flex items-center gap-1">
              {pages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Stránka ${i + 1}`}
                  onClick={() => setPage(i)}
                  className={cn(
                    "rounded-full w-1.5 h-1.5 transition-colors",
                    i === page ? "bg-foreground" : "bg-muted-foreground/40 hover:bg-muted-foreground/70"
                  )}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              disabled={!canNext}
              onClick={() => setPage((p) => (p + 1) % pageCount)}
              aria-label="Další"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="link" className="px-0 h-auto text-sm">
                Zobrazit trh
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Trhy – přehled</DialogTitle>
                <DialogDescription>
                  Aktuální přehled trhu.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2 pr-1 max-h-[65svh] overflow-auto">
                {loading ? (
                  Array.from({ length: pageSize }).map((_, i) => <InstrumentRowSkeleton key={i} />)
                ) : (
                  (data ?? []).map((instrument) => (
                    <InstrumentRow key={instrument.id} instrument={instrument} compact={false} />
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
