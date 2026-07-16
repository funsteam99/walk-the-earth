const allowedOrigins = new Set([
  "https://funsteam99.github.io",
  "https://shezi.org.tw",
  "https://www.shezi.org.tw",
]);

const cors = (request: Request) => {
  const origin = request.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
};

const json = (request: Request, body: unknown, status = 200, cache = "no-store") =>
  Response.json(body, { status, headers: { ...cors(request), "Cache-Control": cache } });

const coordinates = (url: URL) => {
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
    ? { lat, lon }
    : null;
};

async function osm(request: Request, lat: number, lon: number) {
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
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "WalkTheEarth/0.2" },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`Overpass ${response.status}`);
    const data = await response.json<{ elements?: unknown[] }>();
    return json(request, { elements: (data.elements || []).slice(0, 1200), attribution: "© OpenStreetMap contributors" }, 200, "public, max-age=300, s-maxage=3600");
  } catch {
    return json(request, { error: "map service unavailable" }, 503);
  }
}

async function elevation(request: Request, lat: number, lon: number) {
  const size = 9, extent = 500, lats: string[] = [], lons: string[] = [];
  for (let z = 0; z < size; z++) for (let x = 0; x < size; x++) {
    const mx = -extent + x * extent * 2 / (size - 1);
    const mz = -extent + z * extent * 2 / (size - 1);
    lats.push((lat - mz / 110540).toFixed(6));
    lons.push((lon + mx / (111320 * Math.cos(lat * Math.PI / 180))).toFixed(6));
  }
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lats.join(",")}&longitude=${lons.join(",")}`, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error();
    const data = await response.json<{ elevation?: number[] }>();
    if (!data.elevation || data.elevation.length !== size * size) throw new Error();
    return json(request, { size, extent, values: data.elevation, center: data.elevation[40] }, 200, "public, max-age=86400, s-maxage=604800");
  } catch {
    return json(request, { error: "elevation service unavailable" }, 503);
  }
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(request) });
    if (request.method !== "GET") return json(request, { error: "method not allowed" }, 405);
    const url = new URL(request.url);
    if (url.pathname === "/" || url.pathname === "/health") return json(request, { service: "Walk the Earth Geo API", status: "ok" }, 200, "public, max-age=60");
    const point = coordinates(url);
    if (!point) return json(request, { error: "invalid coordinates" }, 400);
    if (url.pathname === "/api/osm") return osm(request, point.lat, point.lon);
    if (url.pathname === "/api/elevation") return elevation(request, point.lat, point.lon);
    return json(request, { error: "not found" }, 404);
  },
};
