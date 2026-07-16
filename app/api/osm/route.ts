import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "invalid coordinates" }, { status: 400 });
  }
  const query = `[out:json][timeout:25];(
    way(around:500,${lat},${lon})["building"];
    way(around:500,${lat},${lon})["highway"];
    way(around:500,${lat},${lon})["natural"="water"];
    way(around:500,${lat},${lon})["waterway"="riverbank"];
    way(around:500,${lat},${lon})["natural"="wood"];
    way(around:500,${lat},${lon})["landuse"~"forest|grass|meadow"];
    way(around:500,${lat},${lon})["leisure"="park"];
    way(around:500,${lat},${lon})["railway"];
  );out tags geom;`;
  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "WalkTheEarth/0.1" },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`Overpass ${response.status}`);
    const data = await response.json() as { elements?: unknown[] };
    return NextResponse.json({ elements: (data.elements || []).slice(0, 1200), attribution: "© OpenStreetMap contributors" }, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" },
    });
  } catch {
    return NextResponse.json({ error: "map service unavailable" }, { status: 503 });
  }
}
