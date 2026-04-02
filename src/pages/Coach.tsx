import { useState, useRef, useEffect } from "react";
import { Send, Bot, Sparkles, RefreshCw } from "lucide-react";
import { getChatMessages, saveChatMessages } from "@/lib/storage";
import { coachResponses } from "@/lib/mockData";
import type { ChatMessage } from "@/types";

const QUICK_PROMPTS = [
  "How are my habits looking?",
  "Give me study tips",
  "I'm struggling to stay consistent",
  "What should I focus on today?",
  "How do I level up faster?",
];

let responseIndex = 0;

export default function Coach() {
  const [messages, setMessages] = useState<ChatMessage[]>(getChatMessages());
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setIsTyping(true);

    // Simulate coach response
    setTimeout(() => {
      const responses = coachResponses.default;
      const template = responses[responseIndex % responses.length];
      responseIndex++;

      const coachMsg: ChatMessage = {
        ...template,
        id: `msg_${Date.now()}_c`,
        timestamp: new Date().toISOString(),
      };

      const final = [...updated, coachMsg];
      setMessages(final);
      saveChatMessages(final);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  };

  const handleSend = () => sendMessage(input);

  const clearChat = () => {
    const reset = [{
      id: `msg_${Date.now()}`,
      role: "coach" as const,
      content: "Hey! Fresh start. What's on your mind today? I'm ready to help you crush your goals. 🎯",
      timestamp: new Date().toISOString(),
      type: "normal" as const,
    }];
    setMessages(reset);
    saveChatMessages(reset);
  };

  const getBubbleStyle = (msg: ChatMessage) => {
    if (msg.role === "user") return {};
    const typeColors: Record<string, string> = {
      suggestion: "rgba(34, 211, 238, 0.1)",
      motivation: "rgba(245, 158, 11, 0.1)",
      feedback: "rgba(34, 197, 94, 0.1)",
    };
    return { background: typeColors[msg.type || "normal"] || "rgba(147, 51, 234, 0.08)" };
  };

  const getTypeBadge = (type?: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      suggestion: { label: "💡 Suggestion", color: "#22d3ee" },
      motivation: { label: "🔥 Motivation", color: "#f59e0b" },
      feedback: { label: "📊 Feedback", color: "#22c55e" },
    };
    return type && badges[type] ? badges[type] : null;
  };

  return (
    <div className="h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-14 pb-3 flex-shrink-0 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-forge-purple to-forge-cyan flex items-center justify-center glow-purple">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-display font-bold">Forge AI Coach</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-forge-green animate-pulse" />
                <span className="text-[11px] text-muted-foreground">Online · Powered by AI</span>
              </div>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="w-9 h-9 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
            {msg.role === "coach" && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-forge-purple to-forge-cyan flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
              {msg.role === "coach" && getTypeBadge(msg.type) && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    color: getTypeBadge(msg.type)!.color,
                    background: `${getTypeBadge(msg.type)!.color}20`,
                  }}
                >
                  {getTypeBadge(msg.type)!.label}
                </span>
              )}
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-forge-purple/30 border border-forge-purple/40 text-foreground rounded-br-sm"
                    : "border border-white/8 text-foreground rounded-bl-sm"
                }`}
                style={getBubbleStyle(msg)}
              >
                {msg.content}
              </div>
              <span className="text-[10px] text-muted-foreground px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-forge-purple to-forge-cyan flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-forge-purple-light"
                  style={{ animation: `pulse 1s ease-in-out ${i * 0.15}s infinite` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-4 pb-2 flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              className="flex-shrink-0 text-xs px-3 py-2 rounded-full glass border border-white/10 text-muted-foreground hover:text-foreground hover:border-forge-purple/40 transition-all duration-200"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-24 flex-shrink-0">
        <div className="glass-strong rounded-2xl flex items-center gap-3 px-4 py-3 border border-white/10">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask your coach anything..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-forge-purple to-forge-cyan flex items-center justify-center disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
