import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question, cardType, cardData } = await req.json();
    if (!question || !cardData) {
      return new Response(JSON.stringify({ error: "Missing question or card data" }), {
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

    const contextMap: Record<string, string> = {
      note: `Title: ${cardData.title}\nSummary: ${cardData.summary || ""}\nKey Facts: ${(cardData.key_facts || []).join(", ")}\nTags: ${(cardData.tags || []).join(", ")}`,
      event: `Event: ${cardData.name}\nDate: ${cardData.date || "N/A"}\nTime: ${cardData.time || "N/A"}\nLocation: ${cardData.location || "N/A"}\nDescription: ${cardData.description || ""}`,
      contact: `Name: ${cardData.name}\nPhone: ${cardData.phone || "N/A"}\nEmail: ${cardData.email || "N/A"}\nCompany: ${cardData.company || "N/A"}\nTitle: ${cardData.title || "N/A"}`,
    };

    const context = contextMap[cardType] || JSON.stringify(cardData);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a knowledgeable assistant integrated into VisionMind, an image analysis app. The user has a saved ${cardType || "item"} with these details:

${context}

Answer the user's follow-up question about this item. Use your knowledge to provide helpful, accurate, and detailed answers. When you reference general knowledge or well-known facts, mention the topic area (e.g. "According to common business etiquette..." or "Based on general event planning best practices..."). Be concise but thorough.`,
          },
          { role: "user", content: question },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI request failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const result = await response.json();
    const answer = result.choices?.[0]?.message?.content || "No response.";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ask-card error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
