import { NextResponse } from "next/server";
import { getFrankfurterMarkets } from "@/lib/markets/frankfurter";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const results = await getFrankfurterMarkets({ days: 30 });

    return NextResponse.json(
      {
        instruments: results,
      },
      {
        headers: {
          "cache-control": "no-store, max-age=0",
        },
      }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 502, headers: { "cache-control": "no-store, max-age=0" } }
    );
  }
}

