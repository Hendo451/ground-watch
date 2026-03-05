import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LightningFlash {
  loc: { lat: number; long: number };
  ob: {
    dateTimeISO: string;
    type: string;
    pulseType: string;
    peakAmperage?: number;
  };
  relativeTo: {
    distanceKM: number;
    bearingDEG: number;
  };
}

interface XweatherResponse {
  success: boolean;
  error?: { code: string; description: string };
  response?: LightningFlash[];
}

interface Game {
  id: string;
  venue_id: string;
  status: "green" | "orange" | "red";
  countdown_end: string | null;
  venues: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    safe_zone_radius: number;
  };
}

interface Training {
  id: string;
  venue_id: string;
  status: "green" | "orange" | "red";
  countdown_end: string | null;
  day_of_week: number;
  start_time: string; // "HH:MM:SS"
  end_time: string;   // "HH:MM:SS"
  start_date: string; // "YYYY-MM-DD"
  end_date: string | null;
  venues: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    safe_zone_radius: number;
  };
}

// Check if a training is currently active for lightning monitoring (no warmup buffer)
function isTrainingLightningActive(training: Training, nowAEST: Date): boolean {
  const dayOfWeek = nowAEST.getDay();
  if (training.day_of_week !== dayOfWeek) return false;

  const todayStr = nowAEST.toISOString().split("T")[0];
  if (training.start_date > todayStr) return false;
  if (training.end_date && training.end_date < todayStr) return false;

  const [sh, sm] = training.start_time.split(":").map(Number);
  const [eh, em] = training.end_time.split(":").map(Number);
  const currentMinutes = nowAEST.getHours() * 60 + nowAEST.getMinutes();
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

async function processLightningForEntity(
  supabase: ReturnType<typeof createClient>,
  entityId: string,
  entityType: "game" | "training",
  entityStatus: "green" | "orange" | "red",
  entityCountdownEnd: string | null,
  venue: { id: string; name: string; latitude: number; longitude: number; safe_zone_radius: number },
  xweatherData: XweatherResponse,
  XWEATHER_CLIENT_ID: string,
  XWEATHER_CLIENT_SECRET: string
): Promise<{ status: string; closestStrike?: number }> {
  const table = entityType === "game" ? "games" : "trainings";
  const idField = entityType === "game" ? "game_id" : "training_id";

  if (!xweatherData.success || !xweatherData.response || xweatherData.response.length === 0) {
    console.log(`No lightning detected near ${venue.name}`);

    if (entityStatus === "red" && entityCountdownEnd) {
      const countdownEnd = new Date(entityCountdownEnd);
      if (new Date() >= countdownEnd) {
        await supabase
          .from(table)
          .update({ status: "green", countdown_end: null })
          .eq("id", entityId);

        await supabase.functions.invoke("send-sms-alert", {
          body: {
            venueId: venue.id,
            [idField]: entityId,
            alertType: "all_clear",
            message: `⚡ ALL CLEAR: Play may resume at ${venue.name}. 30-minute countdown complete with no further lightning detected.`,
          },
        });

        return { status: "green (countdown expired)" };
      }
    } else if (entityStatus === "orange") {
      await supabase
        .from(table)
        .update({ status: "green" })
        .eq("id", entityId);
      return { status: "green (cleared)" };
    }

    return { status: "green (clear)" };
  }

  // Insert strikes
  const strikesToInsert = xweatherData.response.map((flash) => ({
    [idField]: entityId,
    venue_id: venue.id,
    latitude: flash.loc.lat,
    longitude: flash.loc.long,
    distance_km: flash.relativeTo.distanceKM,
    detected_at: flash.ob.dateTimeISO,
    strike_type: flash.ob.type || null,
    peak_amperage: flash.ob.peakAmperage || null,
  }));

  if (strikesToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("lightning_strikes")
      .insert(strikesToInsert);
    if (insertError) {
      console.error(`Failed to insert strikes for ${venue.name}:`, insertError);
    } else {
      console.log(`Inserted ${strikesToInsert.length} strikes for ${venue.name}`);
    }
  }

  const closestStrike = xweatherData.response.reduce(
    (closest, flash) =>
      flash.relativeTo.distanceKM < closest.relativeTo.distanceKM ? flash : closest,
    xweatherData.response[0]
  );

  const distanceKm = closestStrike.relativeTo.distanceKM;
  const safeZone = venue.safe_zone_radius || 16;

  let newStatus: "green" | "orange" | "red" = entityStatus;
  let countdownEnd = entityCountdownEnd;
  let alertType: string | null = null;
  let alertMessage: string | null = null;

  if (distanceKm < safeZone) {
    newStatus = "red";
    countdownEnd = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    if (entityStatus !== "red") {
      alertType = "stoppage";
      alertMessage = `🔴 STOPPAGE: Lightning detected ${distanceKm.toFixed(1)}km from ${venue.name}. Evacuate to safe shelter immediately. 30-minute countdown started.`;
    } else {
      alertType = "countdown_reset";
      alertMessage = `⚡ COUNTDOWN RESET: New strike ${distanceKm.toFixed(1)}km from ${venue.name}. 30-minute countdown restarted.`;
    }
  } else if (distanceKm <= 30) {
    if (entityStatus === "green") {
      newStatus = "orange";
      alertType = "warning";
      alertMessage = `🟠 WARNING: Lightning detected ${distanceKm.toFixed(1)}km from ${venue.name}. Monitor conditions closely.`;
    } else if (entityStatus === "red") {
      newStatus = "red";
    }
  }

  if (newStatus !== entityStatus || countdownEnd !== entityCountdownEnd) {
    await supabase
      .from(table)
      .update({
        status: newStatus,
        countdown_end: countdownEnd,
        last_strike_distance: distanceKm,
        last_strike_at: closestStrike.ob.dateTimeISO,
        last_strike_lat: closestStrike.loc.lat,
        last_strike_lng: closestStrike.loc.long,
      })
      .eq("id", entityId);
  }

  if (alertType && alertMessage) {
    await supabase.functions.invoke("send-sms-alert", {
      body: {
        venueId: venue.id,
        [idField]: entityId,
        alertType,
        message: alertMessage,
        distanceKm,
      },
    });
  }

  return { status: newStatus, closestStrike: distanceKm };
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

    const now = new Date();
    const nowISO = now.toISOString();
    console.log("Checking for active games and trainings at:", nowISO);

    // --- GAMES ---
    const { data: games, error: gamesError } = await supabase
      .from("games")
      .select("id, venue_id, status, countdown_end, venues(id, name, latitude, longitude, safe_zone_radius)")
      .lte("start_time", nowISO)
      .gte("end_time", nowISO);

    if (gamesError) throw gamesError;

    // --- TRAININGS ---
    const nowAEST = new Date(now.toLocaleString("en-AU", { timeZone: "Australia/Sydney" }));
    const todayStr = nowAEST.toISOString().split("T")[0];

    const { data: allTrainings, error: trainingsError } = await supabase
      .from("trainings")
      .select("id, venue_id, status, countdown_end, day_of_week, start_time, end_time, start_date, end_date, venues(id, name, latitude, longitude, safe_zone_radius)")
      .not("venue_id", "is", null);

    if (trainingsError) {
      console.error("Failed to fetch trainings:", trainingsError);
    }

    const { data: todayExceptions } = await supabase
      .from("training_exceptions")
      .select("training_id")
      .eq("exception_date", todayStr)
      .eq("is_cancelled", true);

    const cancelledIds = new Set((todayExceptions || []).map((e: { training_id: string }) => e.training_id));

    const activeTrainings = (allTrainings || []).filter((t: Training) => {
      if (cancelledIds.has(t.id)) return false;
      if (!t.venues) return false;
      return isTrainingLightningActive(t, nowAEST);
    }) as unknown as Training[];

    console.log(`Found ${(games || []).length} active games, ${activeTrainings.length} active trainings for lightning monitoring`);

    if ((!games || games.length === 0) && activeTrainings.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active games or trainings to monitor", checkedAt: nowISO }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cache lightning API results per venue (shared between games and trainings)
    const venueLightningCache = new Map<string, XweatherResponse>();

    const results: { venueId: string; venueName: string; status: string; closestStrike?: number }[] = [];

    // Helper to fetch lightning data for a venue (with caching)
    async function fetchLightningForVenue(venue: { id: string; name: string; latitude: number; longitude: number; safe_zone_radius: number }): Promise<XweatherResponse> {
      if (venueLightningCache.has(venue.id)) {
        return venueLightningCache.get(venue.id)!;
      }
      const radius = 30;
      const xweatherUrl = `https://data.api.xweather.com/lightning/closest?p=${venue.latitude},${venue.longitude}&radius=${radius}km&limit=10&client_id=${XWEATHER_CLIENT_ID}&client_secret=${XWEATHER_CLIENT_SECRET}`;
      console.log(`Checking lightning for ${venue.name}`);
      const xweatherRes = await fetch(xweatherUrl);
      const data: XweatherResponse = await xweatherRes.json();
      venueLightningCache.set(venue.id, data);
      return data;
    }

    // Process games
    for (const game of (games || []) as unknown as Game[]) {
      const venue = game.venues;
      if (!venue) continue;

      const xweatherData = await fetchLightningForVenue(venue);
      const result = await processLightningForEntity(
        supabase, game.id, "game", game.status, game.countdown_end,
        venue, xweatherData, XWEATHER_CLIENT_ID!, XWEATHER_CLIENT_SECRET!
      );

      results.push({ venueId: venue.id, venueName: venue.name, ...result });
    }

    // Process trainings
    for (const training of activeTrainings) {
      const venue = training.venues;
      if (!venue) continue;

      const xweatherData = await fetchLightningForVenue(venue);
      const result = await processLightningForEntity(
        supabase, training.id, "training", training.status, training.countdown_end,
        venue, xweatherData, XWEATHER_CLIENT_ID!, XWEATHER_CLIENT_SECRET!
      );

      results.push({ venueId: venue.id, venueName: `${venue.name} (training)`, ...result });
    }

    return new Response(
      JSON.stringify({ success: true, monitored: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Lightning monitor error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
