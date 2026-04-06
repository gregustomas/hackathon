export type MarketInstrumentSpec = {
  id: string;
  symbol: string;
  name: string;
  from: string;
  to: string;
  decimals: number;
};

export type MarketInstrumentData = {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  updatedAt: string;
  series: number[];
  last: number;
};

const DEFAULT_INSTRUMENTS: MarketInstrumentSpec[] = [
  {
    id: "eurczk",
    symbol: "EUR/CZK",
    name: "Euro/Česká koruna",
    from: "EUR",
    to: "CZK",
    decimals: 2,
  },
  {
    id: "usdczk",
    symbol: "USD/CZK",
    name: "Americký dolar/Česká koruna",
    from: "USD",
    to: "CZK",
    decimals: 3,
  },
  {
    id: "chfczk",
    symbol: "CHF/CZK",
    name: "Švýcarský frank/Česká koruna",
    from: "CHF",
    to: "CZK",
    decimals: 3,
  },
  {
    id: "gbpczk",
    symbol: "GBP/CZK",
    name: "Britská libra/Česká koruna",
    from: "GBP",
    to: "CZK",
    decimals: 3,
  },
  {
    id: "plnczk",
    symbol: "PLN/CZK",
    name: "Polský zlotý/Česká koruna",
    from: "PLN",
    to: "CZK",
    decimals: 3,
  },
  {
    id: "hufczk",
    symbol: "HUF/CZK",
    name: "Maďarský forint/Česká koruna",
    from: "HUF",
    to: "CZK",
    decimals: 4,
  },
];

function toISODate(date: Date) {
  // YYYY-MM-DD in UTC to avoid TZ drift
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function fetchFrankfurterSeries(params: {
  from: string;
  to: string;
  days: number;
  signal?: AbortSignal;
}) {
  const end = new Date();
  const start = new Date(end.getTime() - params.days * 24 * 60 * 60 * 1000);
  const startIso = toISODate(start);
  const endIso = toISODate(end);

  const url = `https://api.frankfurter.app/${startIso}..${endIso}?from=${encodeURIComponent(
    params.from
  )}&to=${encodeURIComponent(params.to)}`;

  const res = await fetch(url, { cache: "no-store", signal: params.signal });
  if (!res.ok) {
    throw new Error(`Frankfurter timeseries failed (${res.status})`);
  }

  const json = (await res.json()) as {
    rates: Record<string, Record<string, number>>;
  };

  const entries = Object.entries(json.rates)
    .map(([date, byTo]) => ({ date, value: byTo[params.to] }))
    .filter((p) => typeof p.value === "number" && Number.isFinite(p.value))
    .sort((a, b) => a.date.localeCompare(b.date));

  return entries;
}

async function fetchFrankfurterLatest(params: {
  from: string;
  to: string;
  signal?: AbortSignal;
}) {
  const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(
    params.from
  )}&to=${encodeURIComponent(params.to)}`;

  const res = await fetch(url, { cache: "no-store", signal: params.signal });
  if (!res.ok) {
    throw new Error(`Frankfurter latest failed (${res.status})`);
  }

  const json = (await res.json()) as { rates: Record<string, number> };
  const value = json.rates[params.to];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("Frankfurter latest missing rate");
  }

  return value;
}

export async function getFrankfurterMarkets(params?: {
  instruments?: MarketInstrumentSpec[];
  days?: number;
  signal?: AbortSignal;
}): Promise<MarketInstrumentData[]> {
  const instruments = params?.instruments ?? DEFAULT_INSTRUMENTS;
  const days = params?.days ?? 30;

  const results = await Promise.all(
    instruments.map(async (inst) => {
      const [series, latest] = await Promise.all([
        fetchFrankfurterSeries({
          from: inst.from,
          to: inst.to,
          days,
          signal: params?.signal,
        }),
        fetchFrankfurterLatest({
          from: inst.from,
          to: inst.to,
          signal: params?.signal,
        }),
      ]);

      const values = series.map((p) => p.value);
      const lastSeries = values[values.length - 1];
      const last = typeof lastSeries === "number" ? lastSeries : latest;

      // Prefer freshest "latest" if it's meaningfully different.
      const merged =
        values.length === 0
          ? [latest]
          : Math.abs(latest - last) / Math.max(1e-9, Math.abs(last)) > 1e-6
            ? [...values, latest]
            : values;

      return {
        id: inst.id,
        symbol: inst.symbol,
        name: inst.name,
        decimals: inst.decimals,
        updatedAt: new Date().toISOString(),
        series: merged,
        last: latest,
      } satisfies MarketInstrumentData;
    })
  );

  return results;
}

