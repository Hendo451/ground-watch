import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AlertRequest {
  venueId: string;
  gameId?: string;
  alertType: string;
  message: string;
  distanceKm?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.warn("Twilio credentials not configured - skipping SMS");
      return new Response(
        JSON.stringify({ success: false, reason: "Twilio not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const { venueId, gameId, alertType, message, distanceKm }: AlertRequest = await req.json();

    if (!venueId || !alertType || !message) {
      throw new Error("Missing required fields: venueId, alertType, message");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get officials assigned to this venue with alerts enabled
    const { data: officials, error: officialsError } = await supabase
      .from("officials")
      .select("id, name, mobile")
      .eq("venue_id", venueId)
      .eq("alerts_enabled", true);

    if (officialsError) throw officialsError;

    if (!officials || officials.length === 0) {
      console.log(`No officials assigned to venue ${venueId} with alerts enabled`);
      return new Response(
        JSON.stringify({ success: true, sent: 0, reason: "No officials to notify" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sentAlerts: { officialId: string; name: string; status: string }[] = [];

    for (const official of officials) {
      try {
        // Send SMS via Twilio
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        const twilioAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

        const formData = new URLSearchParams();
        formData.append("To", official.mobile);
        formData.append("From", TWILIO_PHONE_NUMBER);
        formData.append("Body", message);

        const twilioRes = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${twilioAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        });

        const twilioData = await twilioRes.json();

        if (!twilioRes.ok) {
          console.error(`Twilio error for ${official.name}:`, twilioData);
          sentAlerts.push({ officialId: official.id, name: official.name, status: "failed" });
          continue;
        }

        // Log the alert in the database
        await supabase.from("lightning_alerts").insert({
          venue_id: venueId,
          game_id: gameId || null,
          official_id: official.id,
          alert_type: alertType,
          message,
          distance_km: distanceKm || null,
        });

        sentAlerts.push({ officialId: official.id, name: official.name, status: "sent" });
        console.log(`SMS sent to ${official.name} (${official.mobile})`);
      } catch (smsError) {
        console.error(`Error sending SMS to ${official.name}:`, smsError);
        sentAlerts.push({ officialId: official.id, name: official.name, status: "error" });
      }
    }

    const successCount = sentAlerts.filter((a) => a.status === "sent").length;

    return new Response(
      JSON.stringify({ success: true, sent: successCount, total: officials.length, details: sentAlerts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send SMS alert error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
