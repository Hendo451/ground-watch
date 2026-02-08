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

    // Get active games with venue data
    const now = new Date().toISOString();
    console.log("Checking for active games at:", now);
    
    const { data: games, error: gamesError } = await supabase
      .from("games")
      .select("id, venue_id, status, countdown_end, venues(id, name, latitude, longitude, safe_zone_radius)")
      .lte("start_time", now)
      .gte("end_time", now);

    console.log("Games query result:", { games, error: gamesError });

    if (gamesError) throw gamesError;
    if (!games || games.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active games to monitor", checkedAt: now }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${games.length} active games to monitor`);

    const results: { venueId: string; venueName: string; status: string; closestStrike?: number }[] = [];

    for (const game of games as unknown as Game[]) {
      const venue = game.venues;
      if (!venue) continue;

      // Query Xweather for lightning within 30km (orange warning zone)
      const radius = 30; // km - captures both warning (16-30km) and danger (<16km) zones
      const xweatherUrl = `https://data.api.xweather.com/lightning/closest?p=${venue.latitude},${venue.longitude}&radius=${radius}km&limit=10&client_id=${XWEATHER_CLIENT_ID}&client_secret=${XWEATHER_CLIENT_SECRET}`;

      console.log(`Checking lightning for ${venue.name} at ${venue.latitude},${venue.longitude}`);
      
      const xweatherRes = await fetch(xweatherUrl);
      const xweatherData: XweatherResponse = await xweatherRes.json();
      
      console.log(`Xweather response for ${venue.name}:`, JSON.stringify(xweatherData).substring(0, 500));

      if (!xweatherData.success || !xweatherData.response || xweatherData.response.length === 0) {
        // No lightning detected
        console.log(`No lightning detected near ${venue.name}`);
        // No lightning detected - check if we can go back to green
        if (game.status === "red" && game.countdown_end) {
          const countdownEnd = new Date(game.countdown_end);
          if (new Date() >= countdownEnd) {
            // Countdown expired, go back to green
            await supabase
              .from("games")
              .update({ status: "green", countdown_end: null })
              .eq("id", game.id);

            results.push({ venueId: venue.id, venueName: venue.name, status: "green (countdown expired)" });

            // Send all-clear alert
            await supabase.functions.invoke("send-sms-alert", {
              body: {
                venueId: venue.id,
                alertType: "all_clear",
                message: `⚡ ALL CLEAR: Play may resume at ${venue.name}. 30-minute countdown complete with no further lightning detected.`,
              },
            });
          }
        } else if (game.status === "orange") {
          // No lightning in range, back to green
          await supabase
            .from("games")
            .update({ status: "green" })
            .eq("id", game.id);
          results.push({ venueId: venue.id, venueName: venue.name, status: "green (cleared)" });
        } else {
          // Already green, no action needed
          results.push({ venueId: venue.id, venueName: venue.name, status: "green (clear)" });
        }
        continue;
      }

      // Find closest strike
      const closestStrike = xweatherData.response.reduce(
        (closest, flash) =>
          flash.relativeTo.distanceKM < closest.relativeTo.distanceKM ? flash : closest,
        xweatherData.response[0]
      );

      const distanceKm = closestStrike.relativeTo.distanceKM;
      const safeZone = venue.safe_zone_radius || 16;

      let newStatus: "green" | "orange" | "red" = game.status;
      let countdownEnd = game.countdown_end;
      let alertType: string | null = null;
      let alertMessage: string | null = null;

      if (distanceKm < safeZone) {
        // RED - Stoppage required
        newStatus = "red";
        // Reset 30-minute countdown on every strike within safe zone
        countdownEnd = new Date(Date.now() + 30 * 60 * 1000).toISOString();

        if (game.status !== "red") {
          alertType = "stoppage";
          alertMessage = `🔴 STOPPAGE: Lightning detected ${distanceKm.toFixed(1)}km from ${venue.name}. Evacuate to safe shelter immediately. 30-minute countdown started.`;
        } else {
          // Already in red, countdown reset
          alertType = "countdown_reset";
          alertMessage = `⚡ COUNTDOWN RESET: New strike ${distanceKm.toFixed(1)}km from ${venue.name}. 30-minute countdown restarted.`;
        }
      } else if (distanceKm <= 30) {
        // ORANGE - Warning
        if (game.status === "green") {
          newStatus = "orange";
          alertType = "warning";
          alertMessage = `🟠 WARNING: Lightning detected ${distanceKm.toFixed(1)}km from ${venue.name}. Monitor conditions closely.`;
        } else if (game.status === "red") {
          // Stay in red if already in stoppage
          newStatus = "red";
        }
      }

      // Update game status if changed
      if (newStatus !== game.status || countdownEnd !== game.countdown_end) {
        await supabase
          .from("games")
          .update({
            status: newStatus,
            countdown_end: countdownEnd,
            last_strike_distance: distanceKm,
            last_strike_at: closestStrike.ob.dateTimeISO,
          })
          .eq("id", game.id);
      }

      // Send alert if needed
      if (alertType && alertMessage) {
        await supabase.functions.invoke("send-sms-alert", {
          body: {
            venueId: venue.id,
            gameId: game.id,
            alertType,
            message: alertMessage,
            distanceKm,
          },
        });
      }

      results.push({
        venueId: venue.id,
        venueName: venue.name,
        status: newStatus,
        closestStrike: distanceKm,
      });
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
