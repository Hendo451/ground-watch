import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type SportIntensity = "category_1" | "category_2" | "category_3";
type HeatStatus = "low" | "moderate" | "high" | "extreme";

function calculateHeatStatus(
  tempC: number,
  humidity: number,
  intensity: SportIntensity
): HeatStatus {
  const tempOffset =
    intensity === "category_3" ? 3 : intensity === "category_2" ? 1.5 : 0;
  const adjustedTemp = tempC - tempOffset;

  if (adjustedTemp > 38 || (adjustedTemp > 35 && humidity > 40)) return "extreme";
  if ((adjustedTemp > 30 && humidity > 50) || (adjustedTemp > 35 && humidity > 20)) return "high";
  if ((adjustedTemp > 26 && humidity > 60) || (adjustedTemp > 30 && humidity > 30)) return "moderate";
  return "low";
}

interface ForecastPeriod {
  timestamp: number;
  dateTimeISO: string;
  tempC: number | null;
  maxTempC: number | null;
  humidity: number | null;
  maxHumidity: number | null;
  icon: string | null;
  weatherPrimary: string | null;
  pop: number | null;
}

interface XweatherForecastResponse {
  success: boolean;
  error?: { code: string; description: string };
  response?: Array<{
    periods: ForecastPeriod[];
  }>;
}

/** Find the forecast period closest to the given game start time */
function findClosestPeriod(periods: ForecastPeriod[], gameStartISO: string): ForecastPeriod | null {
  if (periods.length === 0) return null;
  const gameTs = new Date(gameStartISO).getTime();
  let closest = periods[0];
  let minDiff = Math.abs(new Date(closest.dateTimeISO).getTime() - gameTs);

  for (let i = 1; i < periods.length; i++) {
    const diff = Math.abs(new Date(periods[i].dateTimeISO).getTime() - gameTs);
    if (diff < minDiff) {
      minDiff = diff;
      closest = periods[i];
    }
  }
  return closest;
}

function extractConditions(period: ForecastPeriod) {
  const tempC = period.tempC ?? period.maxTempC ?? null;
  const humidity = period.humidity ?? period.maxHumidity ?? null;
  const icon = period.icon ?? null;
  const weatherPrimary = (period.weatherPrimary ?? "").toLowerCase();
  const pop = period.pop ?? 0;

  let lightningForecast = "clear";
  if (
    weatherPrimary.includes("thunder") ||
    weatherPrimary.includes("tstorm") ||
    (icon && icon.includes("tstorm"))
  ) {
    lightningForecast = pop >= 60 ? "likely" : "possible";
  } else if (pop >= 70 && (weatherPrimary.includes("rain") || weatherPrimary.includes("shower"))) {
    lightningForecast = "possible";
  }

  return { tempC, humidity, icon, lightningForecast };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const XWEATHER_CLIENT_ID = Deno.env.get("XWEATHER_CLIENT_ID");
    const XWEATHER_CLIENT_SECRET = Deno.env.get("XWEATHER_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!XWEATHER_CLIENT_ID || !XWEATHER_CLIENT_SECRET) {
      throw new Error("Xweather credentials not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse optional body params
    let backfillDays = 0;
    try {
      const body = await req.json();
      if (body?.backfillDays) backfillDays = Math.min(Number(body.backfillDays), 7);
    } catch { /* no body */ }

    const now = new Date();
    const lookBack = new Date(now.getTime() - backfillDays * 24 * 60 * 60 * 1000);
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: games, error: gamesError } = await supabase
      .from("games")
      .select(
        "id, venue_id, start_time, heat_status, venues(id, name, latitude, longitude, sport_intensity)"
      )
      .gt("start_time", lookBack.toISOString())
      .lt("start_time", weekAhead.toISOString());

    if (gamesError) throw gamesError;

    if (!games || games.length === 0) {
      return new Response(
        JSON.stringify({ message: "No upcoming games to forecast", checkedAt: now.toISOString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${games.length} upcoming games to forecast`);

    // Group games by venue to minimise API calls
    const venueMap = new Map<
      string,
      { venue: { id: string; name: string; latitude: number; longitude: number; sport_intensity: SportIntensity }; games: { id: string; start_time: string }[] }
    >();

    for (const game of games as any[]) {
      if (!game.venues) continue;
      const vid = game.venues.id;
      if (!venueMap.has(vid)) {
        venueMap.set(vid, { venue: game.venues, games: [] });
      }
      venueMap.get(vid)!.games.push({ id: game.id, start_time: game.start_time });
    }

    let updated = 0;

    for (const [, { venue, games: venueGames }] of venueMap) {
      // Use 3-hourly forecast periods to match game start times accurately
      // limit=56 gives 7 days of 3hr periods (8 periods/day × 7 days)
      const forecastUrl = `https://data.api.xweather.com/forecasts/${venue.latitude},${venue.longitude}?format=json&filter=3hr&limit=56&client_id=${XWEATHER_CLIENT_ID}&client_secret=${XWEATHER_CLIENT_SECRET}`;

      console.log(`Fetching 3hr forecast for ${venue.name}`);

      const res = await fetch(forecastUrl);
      const data: XweatherForecastResponse = await res.json();

      if (!data.success || !data.response || data.response.length === 0) {
        console.error(`Failed to get forecast for ${venue.name}:`, JSON.stringify(data.error));
        continue;
      }

      const periods = data.response[0]?.periods ?? [];
      console.log(`Got ${periods.length} 3hr periods for ${venue.name}`);

      // Match each game to the closest 3hr forecast period
      for (const game of venueGames) {
        const closestPeriod = findClosestPeriod(periods, game.start_time);

        if (!closestPeriod) {
          console.log(`  No forecast period found for game ${game.id}`);
          continue;
        }

        const conditions = extractConditions(closestPeriod);

        if (conditions.tempC == null || conditions.humidity == null) {
          console.log(`  Incomplete forecast data for game ${game.id}`);
          continue;
        }

        const heatStatus = calculateHeatStatus(conditions.tempC, conditions.humidity, venue.sport_intensity);
        console.log(`  Game ${game.id} start=${game.start_time} matched period=${closestPeriod.dateTimeISO}: ${conditions.tempC}°C / ${conditions.humidity}% → ${heatStatus}`);

        await supabase.from("games").update({
          last_temp_c: conditions.tempC,
          last_humidity: conditions.humidity,
          heat_status: heatStatus,
          last_heat_check_at: now.toISOString(),
          weather_icon: conditions.icon,
          lightning_forecast: conditions.lightningForecast,
        }).eq("id", game.id);

        updated++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        gamesForecasted: updated,
        venuesChecked: venueMap.size,
        checkedAt: now.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Weather forecast error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
