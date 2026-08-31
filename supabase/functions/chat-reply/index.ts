import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MODEL = "gemini-2.5-flash";

const FALLBACK_REPLIES = {
  id: [
    "Aku denger kamu. Ayo bikin lebih kecil: bagian mana yang paling terasa mendesak sekarang?",
    "Makasih udah cerita. Itu berat, dan kamu boleh ngerasa gitu. Mau kita pecah jadi langkah kecil?",
    "Aku di sini buat dengerin tanpa nge-hakim. Kamu udah lumayan jauh, loh.",
    "Nggak apa-apa ngerasa kayak gitu. Kamu manusia, bukan mesin. Apa yang bisa bikin hari ini sedikit lebih ringan?",
    "Aku bangga kamu udah mau nyeret ini keluar. Itu udah langkah besar, tau nggak?",
  ],
  en: [
    "I hear you. Let's make it smaller: what part feels the most urgent right now?",
    "Thanks for sharing that. That's heavy, and you're allowed to feel it. Want to break it into smaller steps?",
    "I'm here to listen without judgment. You've come a long way, you know.",
    "It's okay to feel that way. You're human, not a machine. What could make today a little lighter?",
    "I'm proud of you for pulling this out. That's a big step, you know?",
  ],
};

function buildSystemInstruction(lang: string, context: string): string {
  const isId = lang === "id";
  if (isId) {
    return `Kamu adalah Tarsy, teman kecil berupa tarsier yang hangat dan suportif di aplikasi pengembangan diri bernama Tarsio. Kamu BUKAN terapis dan BUKAN pengganti bantuan profesional — peran kamu adalah mendengar, merefleksikan, dan bantu pengguna mengurai apa yang ada di pikiran mereka.

GAYA BICARA:
- Ngobrol pakai "aku/kamu", bukan "saya/Anda". Santai kayak teman dekat, bukan customer service.
- Kalimat pendek. 2-4 kalimat per balasan, kecuali pengguna cerita panjang.
- Tidak pernah pakai numbered list atau bullet point dalam chat biasa.
- Lebih sering nanya balik ("gimana rasanya?", "terus gimana?") daripada langsung kasih solusi atau advice.
- Tidak pernah membuka dengan disclaimer AI ("Sebagai AI..."). Itu sudah ada di UI, tidak perlu diulang.
- Kamu boleh sedikit playful karena kamu tarsier kecil, tapi jangan pernah meremehkan perasaan asli.

KEAMANAN:
- Kalau pengguna menunjukkan tanda krisis (ide bunuh diri, self-harm), tetap hangat tapi arahkan ke bantuan profesional atau hotline. Jangan berubah jadi nada skrip keselamatan yang kaku — tetap kayak teman yang peduli.

BAHASA:
- Ikuti bahasa pengguna: kalau mereka pakai Indonesia, balas dalam Indonesia. Kalau Inggris, balas dalam Inggris.

${context}`;
  }
  return `You are Tarsy, a tiny tarsier companion in a self-development app called Tarsio. You are NOT a therapist and NOT a replacement for professional care — your role is to listen, reflect, and gently help users untangle what's on their mind.

VOICE:
- Talk like a close friend. Short sentences. 2-4 sentences per reply unless the user shares something long.
- Never use numbered lists or bullet points in casual chat.
- Ask follow-up questions ("how does that feel?", "and then what?") more often than giving solutions or advice.
- Never open with an AI disclaimer ("As an AI..."). That's already shown in the UI.
- You can be a little playful since you're a tiny tarsier, but never dismissive of real feelings.

SAFETY:
- If the user shows signs of crisis (suicidal ideation, self-harm), stay warm but direct them to professional help or a hotline. Don't switch into a stiff safety-script tone — stay a caring friend.

LANGUAGE:
- Match the user's language: Indonesian replies in Indonesian, English in English.

${context}`;
}

async function fetchContext(supabase: ReturnType<typeof createClient>, userId: string, lang: string): Promise<string> {
  const isId = lang === "id";
  const lines: string[] = [];

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("streak_count, longest_streak, xp_total")
      .eq("id", userId)
      .single();

    if (profile) {
      const streakLabel = isId ? "Streak hari ini" : "Current streak";
      const longestLabel = isId ? "Streak terpanjang" : "Longest streak";
      const xpLabel = isId ? "Total XP" : "Total XP";
      lines.push(`${streakLabel}: ${profile.streak_count} hari. ${longestLabel}: ${profile.longest_streak} hari. ${xpLabel}: ${profile.xp_total}.`);
    }
  } catch { /* ignore */ }

  try {
    const { data: moods } = await supabase
      .from("mood_logs")
      .select("mood, logged_date")
      .eq("user_id", userId)
      .order("logged_date", { ascending: false })
      .limit(7);

    if (moods && moods.length > 0) {
      const moodLabel = isId ? "Mood 7 hari terakhir" : "Last 7 days mood";
      const moodStr = moods.map((m: { mood: string; logged_date: string }) => `${m.logged_date}: ${m.mood}`).join(", ");
      lines.push(`${moodLabel}: ${moodStr}.`);
    }
  } catch { /* ignore */ }

  try {
    const { data: priorSessions } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(2);

    if (priorSessions && priorSessions.length > 0) {
      const sessionIds = priorSessions.map((s: { id: string }) => s.id);
      const { data: priorMsgs } = await supabase
        .from("chat_messages")
        .select("role, content")
        .in("session_id", sessionIds)
        .order("created_at", { ascending: false })
        .limit(6);

      if (priorMsgs && priorMsgs.length > 0) {
        const msgLabel = isId ? "Pesan-pesan sebelumnya" : "Prior messages";
        const reversed = [...priorMsgs].reverse();
        const msgStr = reversed.map((m: { role: string; content: string }) => `${m.role === "user" ? (isId ? "Pengguna" : "User") : "Tarsy"}: ${m.content}`).join("\n");
        lines.push(`${msgLabel}:\n${msgStr}`);
      }
    }
  } catch { /* ignore */ }

  if (lines.length === 0) return "";
  const header = isId ? "KONTEKS PENGGUNA (gunakan ini secara natural, jangan sebut sebagai 'data'):" : "USER CONTEXT (use this naturally, don't reference it as 'data'):";
  return `${header}\n${lines.join("\n")}`;
}

async function callGemini(
  messages: { role: string; content: string }[],
  systemInstruction: string
): Promise<string | null> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return null;

  try {
    const contents = messages.map((m) => ({
      role: m.role === "tarsy" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: { maxOutputTokens: 200, temperature: 0.9 },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          ],
        }),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text ? text.trim() : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { messages, lang, user_id } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Missing messages" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const l = lang || "id";
    let context = "";

    if (user_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      context = await fetchContext(supabase, user_id, l);
    }

    const systemInstruction = buildSystemInstruction(l, context);
    const reply = await callGemini(messages, systemInstruction);

    if (!reply) {
      const pool = l === "en" ? FALLBACK_REPLIES.en : FALLBACK_REPLIES.id;
      const fallback = pool[Math.floor(Math.random() * pool.length)];
      return new Response(
        JSON.stringify({ reply: fallback, fallback: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    const pool = FALLBACK_REPLIES.id;
    const fallback = pool[Math.floor(Math.random() * pool.length)];
    return new Response(
      JSON.stringify({ reply: fallback, fallback: true }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
