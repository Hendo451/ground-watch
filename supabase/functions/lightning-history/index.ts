const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LightningFlash {
  loc: { lat: number; long: number };
  ob: {
    timestamp: number;
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const XWEATHER_CLIENT_ID = Deno.env.get("XWEATHER_CLIENT_ID");
    const XWEATHER_CLIENT_SECRET = Deno.env.get("XWEATHER_CLIENT_SECRET");

    if (!XWEATHER_CLIENT_ID || !XWEATHER_CLIENT_SECRET) {
      throw new Error("Xweather credentials not configured");
    }

    // Allianz Stadium coordinates
    const lat = -33.889157;
    const lon = 151.225135;
    const radiusKm = 16;

    // Parse query params
    const url = new URL(req.url);
    const fromDate = url.searchParams.get("from") || "2023-01-01";
    const toDate = url.searchParams.get("to") || "2024-12-31";

    console.log(`Querying lightning archive for Allianz Stadium`);
    console.log(`Date range: ${fromDate} to ${toDate}`);

    // Query the archive endpoint
    const xweatherUrl = `https://data.api.xweather.com/lightning/archive?p=${lat},${lon}&radius=${radiusKm}km&from=${fromDate}&to=${toDate}&limit=1000&client_id=${XWEATHER_CLIENT_ID}&client_secret=${XWEATHER_CLIENT_SECRET}`;

    console.log("Calling Xweather archive API...");
    
    const xweatherRes = await fetch(xweatherUrl);
    const xweatherData: XweatherResponse = await xweatherRes.json();

    console.log("Xweather response status:", xweatherRes.status);
    console.log("Xweather success:", xweatherData.success);

    if (!xweatherData.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: xweatherData.error,
          message: "Xweather API returned an error. Your plan may not include Lightning Archive access.",
          archiveAccessible: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const strikes = xweatherData.response || [];
    console.log(`Total strikes in response: ${strikes.length}`);

    // Filter for Friday 6-8pm Sydney time (UTC+10/+11)
    const fridayEveningStrikes = strikes.filter((strike) => {
      const date = new Date(strike.ob.dateTimeISO);
      const dayOfWeek = date.getUTCDay();
      const utcHour = date.getUTCHours();
      // Friday = 5, 08:00-10:00 UTC = 6-8pm Sydney
      return dayOfWeek === 5 && utcHour >= 8 && utcHour < 10;
    });

    // Group by date
    const affectedDates = new Set<string>();
    fridayEveningStrikes.forEach((strike) => {
      const date = new Date(strike.ob.dateTimeISO).toISOString().split("T")[0];
      affectedDates.add(date);
    });

    // Find closest strike
    let closestStrike: LightningFlash | null = null;
    let minDistance = Infinity;
    for (const strike of fridayEveningStrikes) {
      if (strike.relativeTo.distanceKM < minDistance) {
        minDistance = strike.relativeTo.distanceKM;
        closestStrike = strike;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        archiveAccessible: true,
        query: {
          location: "Allianz Stadium, Sydney",
          coordinates: { lat, lon },
          radiusKm,
          dateRange: { from: fromDate, to: toDate },
        },
        results: {
          totalStrikesInRadius: strikes.length,
          fridayEveningStrikes: fridayEveningStrikes.length,
          affectedGameDays: affectedDates.size,
          affectedDates: Array.from(affectedDates).sort(),
          closestStrike: closestStrike
            ? {
                distance: closestStrike.relativeTo.distanceKM.toFixed(2) + " km",
                dateTime: closestStrike.ob.dateTimeISO,
                type: closestStrike.ob.type,
              }
            : null,
        },
        note: "Games delayed if lightning within 16km. 30-min countdown resets per strike.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Lightning history error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
