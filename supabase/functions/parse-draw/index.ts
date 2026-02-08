import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedGame {
  name: string;
  venue: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface ParseRequest {
  type: 'url' | 'image' | 'text';
  content: string; // URL, base64 image, or raw text
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { type, content }: ParseRequest = await req.json();

    if (!type || !content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing type or content' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let textContent = '';
    let imageContent = '';

    if (type === 'url') {
      // Fetch the URL content
      console.log('Fetching URL:', content);
      const response = await fetch(content);
      textContent = await response.text();
      // Strip HTML tags for cleaner parsing
      textContent = textContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      textContent = textContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      textContent = textContent.replace(/<[^>]+>/g, ' ');
      textContent = textContent.replace(/\s+/g, ' ').trim();
      // Limit content length
      textContent = textContent.substring(0, 15000);
    } else if (type === 'image') {
      // Image is base64 encoded
      imageContent = content;
    } else if (type === 'text') {
      textContent = content;
    }

    const systemPrompt = `You are a sports fixture/draw parser. Extract game information from the provided content.

For each game found, extract:
- name: The game/match name or description (e.g., "U15 Division 1", "Round 5 - Team A vs Team B")
- venue: The venue/ground name where the game is played
- date: The date in YYYY-MM-DD format
- startTime: Start time in HH:MM format (24-hour)
- endTime: End time in HH:MM format (24-hour). If not specified, assume 2 hours after start time.

Return ONLY a valid JSON array of games. No explanations, no markdown, just the JSON array.
If you cannot find any games, return an empty array: []

Example output:
[
  {"name": "U15 Div 1 - Tigers vs Lions", "venue": "Leichhardt Oval", "date": "2024-03-15", "startTime": "09:00", "endTime": "11:00"},
  {"name": "U17 Div 2 - Eagles vs Hawks", "venue": "Concord Oval", "date": "2024-03-15", "startTime": "11:30", "endTime": "13:30"}
]`;

    const messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [
      { role: 'system', content: systemPrompt }
    ];

    if (imageContent) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: 'Extract all game/fixture information from this image:' },
          { type: 'image_url', image_url: { url: imageContent } }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: `Extract all game/fixture information from this content:\n\n${textContent}`
      });
    }

    console.log('Calling AI to parse draw...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || '[]';
    
    console.log('AI response:', responseText);

    // Parse the JSON response
    let games: ExtractedGame[] = [];
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      cleanedResponse = cleanedResponse.trim();
      
      games = JSON.parse(cleanedResponse);
      
      if (!Array.isArray(games)) {
        games = [];
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      games = [];
    }

    console.log(`Extracted ${games.length} games`);

    return new Response(
      JSON.stringify({ success: true, games }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error parsing draw:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse draw';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
