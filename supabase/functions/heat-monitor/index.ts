import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type SportIntensity = "category_1" | "category_2" | "category_3";
type HeatStatus = "low" | "moderate" | "high" | "extreme";

interface Game {
  id: string;
  venue_id: string;
  heat_status: HeatStatus;
  venues: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    sport_intensity: SportIntensity;
  };
}

interface XweatherConditionsResponse {
  success: boolean;
  error?: { code: string; description: string };
  response?: Array<{
    ob: {
      tempC: number;
      humidity: number;
      dateTimeISO: string;
    };
  }>;
}

// SMA 2024 Risk Thresholds based on Sport Intensity Category
// Category 1: Extreme Intensity (AFL, Soccer, Rugby, Long-distance running)
// Category 2: High Intensity (Basketball, Netball, Tennis, Cricket batting/bowling)
// Category 3: Moderate/Low Intensity (Cricket fielding, Baseball, Golf, Lawn Bowls)

function calculateHeatStatus(
  tempC: number,
  humidity: number,
  intensity: SportIntensity
): HeatStatus {
  // Adjust thresholds based on sport intensity
  // Category 3 sports shift thresholds up by 3°C
  // Category 2 sports shift thresholds up by 1.5°C
  const tempOffset =
    intensity === "category_3" ? 3 : intensity === "category_2" ? 1.5 : 0;

  const adjustedTemp = tempC - tempOffset;

  // EXTREME (Red): Temp > 35°C with Humidity > 40% OR Temp > 38°C (regardless of humidity)
  if (adjustedTemp > 38 || (adjustedTemp > 35 && humidity > 40)) {
    return "extreme";
  }

  // HIGH (Orange): Temp > 30°C with Humidity > 50% OR Temp > 35°C with Humidity > 20%
  if (
    (adjustedTemp > 30 && humidity > 50) ||
    (adjustedTemp > 35 && humidity > 20)
  ) {
    return "high";
  }

  // MODERATE (Yellow): Temp > 26°C with Humidity > 60% OR Temp > 30°C with Humidity > 30%
  if (
    (adjustedTemp > 26 && humidity > 60) ||
    (adjustedTemp > 30 && humidity > 30)
  ) {
    return "moderate";
  }

  // LOW (Green): Safe conditions
  return "low";
}

function getAlertMessage(
  status: HeatStatus,
  venueName: string,
  tempC: number,
  humidity: number,
  intensity: SportIntensity
): string {
  const sportType =
    intensity === "category_1"
      ? "high-intensity sport"
      : intensity === "category_2"
      ? "moderate-intensity sport"
      : "low-intensity sport";

  switch (status) {
    case "extreme":
      return `HEAT STOPPAGE ${venueName}: ${tempC}C ${humidity}%RH. Suspension of play should be considered. Stop activities ASAP. SMA 2024.`;
    case "high":
      return `HEAT ALERT ${venueName}: ${tempC}C ${humidity}%RH. 10min rest every 30min. Ice towels.`;
    case "moderate":
      return `HEAT CAUTION ${venueName}: ${tempC}C ${humidity}%RH. Hydrate and monitor players.`;
    default:
      return "";
  }
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

    // Get active games with venue data (including warmup period)
    const now = new Date();
    const nowISO = now.toISOString();
    console.log("Checking for active games at:", nowISO);

    // Get all games that are currently active or in warmup period
    const { data: allGames, error: gamesError } = await supabase
      .from("games")
      .select(
        "id, venue_id, heat_status, warmup_minutes, start_time, end_time, venues(id, name, latitude, longitude, sport_intensity)"
      )
      .lte("start_time", nowISO)
      .gte("end_time", nowISO);

    if (gamesError) throw gamesError;

    // Filter to include games in warmup period
    const games = (allGames || []).filter((game) => {
      const startTime = new Date(game.start_time);
      const warmupStart = new Date(
        startTime.getTime() - (game.warmup_minutes || 45) * 60 * 1000
      );
      return now >= warmupStart;
    });

    if (games.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active games to monitor", checkedAt: nowISO }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${games.length} active games to monitor for heat`);

    // Identify newly-active games (no heat check yet, or last check was from forecast only)
    // These get priority processing for an immediate live conditions check
    const newlyActive = (games as unknown as Game[]).filter(g => !g.heat_status || g.heat_status === 'low');
    if (newlyActive.length > 0) {
      console.log(`${newlyActive.length} game(s) entering active window — will fetch live conditions`);
    }

    const results: {
      venueId: string;
      venueName: string;
      status: HeatStatus;
      tempC?: number;
      humidity?: number;
    }[] = [];

    // Group games by venue to avoid duplicate API calls
    const venueGames = new Map<string, Game[]>();
    for (const game of games as unknown as Game[]) {
      if (!game.venues) continue;
      const venueId = game.venues.id;
      if (!venueGames.has(venueId)) {
        venueGames.set(venueId, []);
      }
      venueGames.get(venueId)!.push(game);
    }

    for (const [venueId, venueGamesList] of venueGames) {
      const venue = venueGamesList[0].venues;

      // Query Xweather for current conditions
      const xweatherUrl = `https://data.api.xweather.com/conditions/${venue.latitude},${venue.longitude}?client_id=${XWEATHER_CLIENT_ID}&client_secret=${XWEATHER_CLIENT_SECRET}`;

      console.log(`Checking heat conditions for ${venue.name}`);

      const xweatherRes = await fetch(xweatherUrl);
      const xweatherData: XweatherConditionsResponse = await xweatherRes.json();

      if (
        !xweatherData.success ||
        !xweatherData.response ||
        xweatherData.response.length === 0
      ) {
        console.error(`Failed to get conditions for ${venue.name}:`, xweatherData.error);
        continue;
      }

      const conditions = xweatherData.response[0].ob;
      const tempC = conditions.tempC;
      const humidity = conditions.humidity;

      console.log(
        `${venue.name}: ${tempC}°C, ${humidity}% humidity, intensity: ${venue.sport_intensity}`
      );

      const newStatus = calculateHeatStatus(tempC, humidity, venue.sport_intensity);

      // Update all games at this venue
      for (const game of venueGamesList) {
        const previousStatus = game.heat_status;

        // Update game with new heat data
        await supabase
          .from("games")
          .update({
            heat_status: newStatus,
            last_temp_c: tempC,
            last_humidity: humidity,
            last_heat_check_at: new Date().toISOString(),
          })
          .eq("id", game.id);

        // Send alert if status escalated to high or extreme
        if (
          (newStatus === "high" || newStatus === "extreme") &&
          previousStatus !== newStatus
        ) {
          const alertMessage = getAlertMessage(
            newStatus,
            venue.name,
            tempC,
            humidity,
            venue.sport_intensity
          );

          // Send SMS alert
          await supabase.functions.invoke("send-sms-alert", {
            body: {
              venueId: venue.id,
              gameId: game.id,
              alertType: `heat_${newStatus}`,
              message: alertMessage,
            },
          });

          // Log the heat alert
          await supabase.from("heat_alerts").insert({
            venue_id: venue.id,
            game_id: game.id,
            alert_type: `heat_${newStatus}`,
            heat_status: newStatus,
            temp_c: tempC,
            humidity: humidity,
            message: alertMessage,
          });
        }
      }

      results.push({
        venueId: venue.id,
        venueName: venue.name,
        status: newStatus,
        tempC,
        humidity,
      });
    }

    return new Response(
      JSON.stringify({ success: true, monitored: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Heat monitor error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
