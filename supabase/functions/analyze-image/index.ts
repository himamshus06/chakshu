import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "@supabase/supabase-js/cors";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are VisionMind, an intelligent image analyzer. Analyze the image and classify it into one of three categories:

1. EVENT - if the image contains event information (posters, tickets, schedules, invitations, flyers)
2. CONTACT - if the image contains contact details (business cards, visiting cards, phone numbers, email addresses)
3. GENERAL - for everything else (objects, scenes, animals, food, documents, etc.)

Respond with a JSON object using this exact structure:

For EVENT:
{
  "classification": "event",
  "confidence": 0.95,
  "data": {
    "events": [
      {
        "name": "Event Name",
        "date": "2024-03-15",
        "time": "18:00",
        "location": "Venue Name, City",
        "description": "Brief description"
      }
    ]
  }
}

For CONTACT:
{
  "classification": "contact",
  "confidence": 0.95,
  "data": {
    "contacts": [
      {
        "name": "John Doe",
        "phone": "+1234567890",
        "email": "john@example.com",
        "company": "Acme Inc",
        "title": "CEO"
      }
    ]
  }
}

For GENERAL:
{
  "classification": "general",
  "confidence": 0.95,
  "data": {
    "title": "What the image shows",
    "summary": "Detailed description of the image content",
    "key_facts": ["Fact 1", "Fact 2", "Fact 3"],
    "tags": ["tag1", "tag2"]
  }
}

Always return valid JSON. Extract as much information as possible. For multilingual text, translate to English but also include original text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` },
              },
              { type: "text", text: "Analyze this image. Classify it and extract structured data. Return JSON only." },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Parse the JSON from AI response (handle markdown code blocks)
    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1].trim());
    } catch {
      parsed = {
        classification: "general",
        confidence: 0.5,
        data: {
          title: "Image Analysis",
          summary: content,
          key_facts: [],
          tags: [],
        },
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
