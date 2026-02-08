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

// Helper to convert ArrayBuffer to base64 without stack overflow
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

// Use Firecrawl to scrape the page content
async function scrapeWithFirecrawl(url: string): Promise<{ markdown?: string; screenshot?: string }> {
  const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
  if (!FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY is not configured');
  }

  console.log('Scraping with Firecrawl:', url);
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'screenshot'],
      waitFor: 3000, // Wait for JS to render
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Firecrawl error:', errorText);
    throw new Error(`Firecrawl request failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('Firecrawl success, got markdown and screenshot');
  
  return {
    markdown: data.data?.markdown || data.markdown,
    screenshot: data.data?.screenshot || data.screenshot,
  };
}

// Fallback: screenshot service for when Firecrawl is not available
async function getScreenshotOfUrl(url: string): Promise<string> {
  const screenshotUrl = `https://api.screenshotone.com/take?url=${encodeURIComponent(url)}&viewport_width=1280&viewport_height=3000&format=jpg&delay=3&block_ads=true&block_cookie_banners=true&access_key=free`;
  
  console.log('Taking screenshot of URL (fallback)...');
  const response = await fetch(screenshotUrl);
  
  if (!response.ok) {
    const thumbUrl = `https://image.thum.io/get/width/1280/crop/3000/wait/3/${url}`;
    console.log('Trying fallback screenshot service...');
    const thumbResponse = await fetch(thumbUrl);
    if (!thumbResponse.ok) {
      throw new Error('Failed to capture screenshot of the page');
    }
    const buffer = await thumbResponse.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    return `data:image/png;base64,${base64}`;
  }
  
  const buffer = await response.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);
  return `data:image/jpeg;base64,${base64}`;
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

    let imageContent = '';
    let textContent = '';

    if (type === 'url') {
      // For URLs, use Firecrawl for best results with JavaScript-rendered content
      console.log('Processing URL:', content);
      try {
        const firecrawlResult = await scrapeWithFirecrawl(content);
        
        // Prefer markdown for text-based extraction - captures ALL content including below fold
        // Only use screenshot if markdown is empty
        if (firecrawlResult.markdown && firecrawlResult.markdown.length > 100) {
          console.log('Using markdown content, length:', firecrawlResult.markdown.length);
          textContent = firecrawlResult.markdown;
        } else if (firecrawlResult.screenshot) {
          console.log('Markdown empty, using screenshot');
          imageContent = firecrawlResult.screenshot;
        } else {
          throw new Error('Firecrawl returned no content');
        }
      } catch (firecrawlError) {
        console.error('Firecrawl failed, trying screenshot fallback:', firecrawlError);
        try {
          imageContent = await getScreenshotOfUrl(content);
        } catch (screenshotError) {
          console.error('Screenshot failed, falling back to HTML fetch:', screenshotError);
          // Fallback to basic fetch for simple HTML pages
          const response = await fetch(content);
          let htmlContent = await response.text();
          htmlContent = htmlContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
          htmlContent = htmlContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
          htmlContent = htmlContent.replace(/<[^>]+>/g, ' ');
          textContent = htmlContent.replace(/\s+/g, ' ').trim().substring(0, 15000);
        }
      }
    } else if (type === 'image') {
      imageContent = content;
    } else if (type === 'text') {
      textContent = content;
    }

    // If we have text content, use text-based extraction
    if (textContent && !imageContent) {
      const systemPrompt = getSystemPrompt();
      const aiResponse = await callAI(LOVABLE_API_KEY, systemPrompt, textContent, null);
      return new Response(
        JSON.stringify(aiResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process with vision
    const systemPrompt = getSystemPrompt();
    const aiResponse = await callAI(LOVABLE_API_KEY, systemPrompt, null, imageContent);
    
    return new Response(
      JSON.stringify(aiResponse),
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

function getSystemPrompt(): string {
  return `You are a sports fixture/draw parser. Extract game information from the provided content.

For each game found, extract:
- name: The game/match name combining teams (e.g., "Panthers vs Eels", "Round 4 - Bulldogs vs Knights")
- venue: The venue/ground name where the game is played
- date: The date in YYYY-MM-DD format. Use 2026 as the year if not specified.
- startTime: Start time in HH:MM format (24-hour). Convert AM/PM to 24-hour format.
- endTime: End time in HH:MM format (24-hour). If not specified, assume 2 hours after start time.

IMPORTANT: Look carefully for match cards showing team names, kick-off times, dates, and venues.
The current year is 2026.

Return ONLY a valid JSON array of games. No explanations, no markdown, just the JSON array.
If you cannot find any games, return an empty array: []

Example output:
[
  {"name": "Panthers vs Eels", "venue": "Parker Street Reserve, Penrith", "date": "2026-03-27", "startTime": "03:30", "endTime": "05:30"},
  {"name": "Silktails vs Dragons", "venue": "Govind Park, Fiji", "date": "2026-03-27", "startTime": "20:00", "endTime": "22:00"}
]`;
}

async function callAI(
  apiKey: string, 
  systemPrompt: string, 
  textContent: string | null, 
  imageContent: string | null
): Promise<{ success: boolean; games: ExtractedGame[]; error?: string }> {
  const messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [
    { role: 'system', content: systemPrompt }
  ];

  if (imageContent) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: 'Extract all game/fixture information from this image of a sports draw/fixture list:' },
        { type: 'image_url', image_url: { url: imageContent } }
      ]
    });
  } else if (textContent) {
    messages.push({
      role: 'user',
      content: `Extract all game/fixture information from this content:\n\n${textContent}`
    });
  }

  console.log('Calling AI to parse draw...');
  
  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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
  return { success: true, games };
}
