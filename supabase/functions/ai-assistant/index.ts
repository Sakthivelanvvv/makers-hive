// AI Business Assistant — Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    const system = `You are the Forge ERP Business Assistant. You help operations and manufacturing staff understand their business data.
You answer questions like: which product sells most, which raw material is running low, what to manufacture next,
which purchase orders are delayed, and predict next-week demand.

Always be concise (3-6 bullet points). Quote concrete numbers from the provided JSON business snapshot when available.
If the snapshot is empty, suggest the user create some sales/purchase orders to enable insights.

BUSINESS SNAPSHOT (live):
${JSON.stringify(context ?? {}, null, 2)}`;

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });

    if (upstream.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached, please retry shortly." }), { status: 429, headers: { ...corsHeaders, "content-type": "application/json" } });
    if (upstream.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), { status: 402, headers: { ...corsHeaders, "content-type": "application/json" } });
    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text();
      return new Response(JSON.stringify({ error: text }), { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "content-type": "text/event-stream", "cache-control": "no-cache" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } });
  }
});
