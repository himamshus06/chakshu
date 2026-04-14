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
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant. The user has a saved ${cardType || "item"} with the following details:\n\n${context}\n\nAnswer the user's follow-up question about this item. Be concise, helpful, and factual. If you don't know, say so.`,
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
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
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
