import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: corsHeaders }); }

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return NextResponse.json({ error: "invalid coordinates" }, { status: 400, headers: corsHeaders });
  const size = 9, extent = 500, lats:string[] = [], lons:string[] = [];
  for (let z = 0; z < size; z++) for (let x = 0; x < size; x++) {
    const mx = -extent + x * extent * 2 / (size - 1), mz = -extent + z * extent * 2 / (size - 1);
    lats.push((lat - mz / 110540).toFixed(6));
    lons.push((lon + mx / (111320 * Math.cos(lat * Math.PI / 180))).toFixed(6));
  }
  try {
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats.join(",")}&longitude=${lons.join(",")}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error();
    const data = await response.json() as { elevation?: number[] };
    if (!data.elevation || data.elevation.length !== size * size) throw new Error();
    return NextResponse.json({ size, extent, values: data.elevation, center: data.elevation[40] }, { headers: { ...corsHeaders, "Cache-Control": "public, max-age=86400, s-maxage=604800" } });
  } catch { return NextResponse.json({ error: "elevation service unavailable" }, { status: 503, headers: corsHeaders }); }
}
