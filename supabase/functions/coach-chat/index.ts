import cors from "../_shared/cors.ts";

const apiKey = Deno.env.get("ONSPACE_AI_API_KEY");
const baseUrl = Deno.env.get("ONSPACE_AI_BASE_URL");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const { messages, userContext } = await req.json();

    const systemPrompt = `You are Forge, an elite AI study coach inside StreakForge — a gamified habit tracker. 
You help users build better habits, maintain streaks, and level up their productivity.

User context:
- Level: ${userContext?.level ?? "?"} (${userContext?.levelTitle ?? ""})
- Current streak: ${userContext?.streak ?? 0} days
- Longest streak: ${userContext?.longestStreak ?? 0} days
- Total XP: ${userContext?.totalXp ?? 0}
- Active habits: ${userContext?.habitCount ?? 0}
- Today's completed habits: ${userContext?.todayCompleted ?? 0}/${userContext?.habitCount ?? 0}

Your style:
- Motivational, data-driven, concise
- Reference the user's actual stats when relevant
- Give specific, actionable advice
- Use occasional emojis for energy
- Keep responses under 150 words unless the user asks for detail
- Categorize responses as one of: suggestion, motivation, feedback, or normal`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: `AI: ${err}` }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "I'm here to help! What's on your mind?";

    // Detect message type from content keywords
    let type = "normal";
    const lower = content.toLowerCase();
    if (lower.includes("suggest") || lower.includes("try") || lower.includes("consider") || lower.includes("recommend")) {
      type = "suggestion";
    } else if (lower.includes("great") || lower.includes("amazing") || lower.includes("keep going") || lower.includes("proud") || lower.includes("streak")) {
      type = "motivation";
    } else if (lower.includes("data") || lower.includes("pattern") || lower.includes("analysis") || lower.includes("score") || lower.includes("trend")) {
      type = "feedback";
    }

    return new Response(JSON.stringify({ content, type }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("coach-chat error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
