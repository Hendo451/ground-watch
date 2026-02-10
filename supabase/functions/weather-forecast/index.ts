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
  dateTimeISO: string;
  tempC: number;
  humidity: number;
}

interface XweatherForecastResponse {
  success: boolean;
  error?: { code: string; description: string };
  response?: Array<{
    periods: ForecastPeriod[];
  }>;
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
      // Use conditions/summary endpoint for daily max temp & humidity
      const fromDate = lookBack.toISOString().slice(0, 10);
      const toDate = weekAhead.toISOString().slice(0, 10);
      const summaryUrl = `https://data.api.xweather.com/conditions/summary/${venue.latitude},${venue.longitude}?from=${fromDate}&to=${toDate}&client_id=${XWEATHER_CLIENT_ID}&client_secret=${XWEATHER_CLIENT_SECRET}`;

      console.log(`Fetching conditions summary for ${venue.name} (${fromDate} → ${toDate})`);

      const res = await fetch(summaryUrl);
      const data = await res.json();

      if (!data.success || !data.response || data.response.length === 0) {
        console.error(`Failed to get conditions summary for ${venue.name}:`, JSON.stringify(data.error));
        continue;
      }

      // Build a map of date → { maxTempC, maxHumidity } from summary periods
      const dailyConditions = new Map<string, { tempC: number; humidity: number }>();
      const periods = data.response[0]?.periods ?? [];
      for (const period of periods) {
        const dateKey = period.dateTimeISO?.slice(0, 10);
        if (!dateKey) continue;
        const tempC = period.temp?.maxC ?? null;
        const humidity = period.humidity?.max ?? null;
        console.log(`  Period ${dateKey}: maxC=${tempC}, maxHumidity=${humidity}`);
        if (tempC != null && humidity != null) {
          dailyConditions.set(dateKey, { tempC, humidity });
        }
      }

      console.log(`Got ${dailyConditions.size} daily summaries for ${venue.name}. Keys: ${[...dailyConditions.keys()].join(', ')}`);

      // Match each game to its day's summary
      for (const game of venueGames) {
        const gameDate = game.start_time.slice(0, 10);
        console.log(`  Matching game ${game.id} date=${gameDate}`);
        const conditions = dailyConditions.get(gameDate);

        if (!conditions) {
          console.log(`  No summary data for ${venue.name} on ${gameDate}, skipping`);
          continue;
        }

        const { tempC, humidity } = conditions;
        const heatStatus = calculateHeatStatus(tempC, humidity, venue.sport_intensity);

        console.log(
          `${venue.name} @ ${gameDate}: maxTemp ${tempC}°C / maxHumidity ${humidity}% → ${heatStatus}`
        );

        await supabase
          .from("games")
          .update({
            last_temp_c: tempC,
            last_humidity: humidity,
            heat_status: heatStatus,
            last_heat_check_at: now.toISOString(),
          })
          .eq("id", game.id);

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
