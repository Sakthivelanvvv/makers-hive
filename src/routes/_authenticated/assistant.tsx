import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Mic, MicOff } from "lucide-react";
import { PageHeader } from "@/lib/page-header";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — Forge ERP" }] }),
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Which product is selling most?",
  "Which raw material is running low?",
  "What should I manufacture next?",
  "Which purchase orders are delayed?",
  "Predict next week's demand.",
];

function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<unknown>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // live business snapshot
  const { data: context } = useQuery({
    queryKey: ["assistant-context"],
    queryFn: async () => {
      const [prod, so, po, mo] = await Promise.all([
        supabase.from("products").select("name, on_hand_qty, reserved_qty, sales_price, cost_price"),
        supabase.from("sales_orders").select("so_number, customer, status, amount, creation_date").order("created_at", { ascending: false }).limit(20),
        supabase.from("purchase_orders").select("po_number, vendor, status, amount, creation_date").order("created_at", { ascending: false }).limit(20),
        supabase.from("manufacturing_orders").select("mo_number, status, quantity").order("created_at", { ascending: false }).limit(20),
      ]);
      return {
        products: prod.data ?? [],
        recent_sales: so.data ?? [],
        recent_purchases: po.data ?? [],
        recent_manufacturing: mo.data ?? [],
      };
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next, context }),
      });
      if (res.status === 429) { toast.error("Rate limited — try again shortly"); setBusy(false); return; }
      if (res.status === 402) { toast.error("AI credits exhausted"); setBusy(false); return; }
      if (!res.ok || !res.body) { toast.error("Assistant error"); setBusy(false); return; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = ""; let assistant = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const j = JSON.parse(data);
            const delta = j.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: assistant };
                return copy;
              });
            }
          } catch { /* ignore malformed */ }
        }
      }

      // voice playback
      if ("speechSynthesis" in window && assistant) {
        const u = new SpeechSynthesisUtterance(assistant);
        u.rate = 1.05;
        window.speechSynthesis.speak(u);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggleMic = () => {
    type RecCtor = new () => { lang: string; interimResults: boolean; start(): void; stop(): void; onresult: (e: { results: { 0: { transcript: string } }[] }) => void; onend: () => void };
    interface Win { SpeechRecognition?: RecCtor; webkitSpeechRecognition?: RecCtor }
    const w = window as unknown as Win;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input not supported in this browser"); return; }
    if (listening) {
      const r = recRef.current as { stop?: () => void } | null;
      r?.stop?.();
      setListening(false); return;
    }
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = false;
    r.onresult = (e) => { const text = e.results[0][0].transcript; setInput(text); send(text); };
    r.onend = () => setListening(false);
    recRef.current = r;
    r.start();
    setListening(true);
  };

  return (
    <div>
      <PageHeader title="AI Business Assistant" description="Ask anything about your operations — voice supported" />
      <Card className="glass border-border/50">
        <CardContent className="flex h-[70vh] flex-col p-4">
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-2">
            {messages.length === 0 && (
              <div className="space-y-3 py-6 text-center">
                <Sparkles className="mx-auto h-10 w-10 text-primary" />
                <p className="text-sm text-muted-foreground">Try a question:</p>
                <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-card/40 px-3 py-1.5 text-xs hover:bg-accent">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                  {m.content || (busy ? "…" : "")}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-3 flex items-center gap-2">
            <Button type="button" size="icon" variant={listening ? "default" : "outline"} onClick={toggleMic}>
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Input placeholder="Ask about products, demand, delays…" value={input} onChange={(e) => setInput(e.target.value)} disabled={busy} />
            <Button type="submit" disabled={busy || !input.trim()}><Send className="h-4 w-4" /></Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
