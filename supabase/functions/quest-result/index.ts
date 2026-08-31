import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MODEL = "gemini-2.5-flash";

// ===== Rule-based fallback (kept from original implementation) =====

function generateReflection(
  questTitle: string,
  answers: { question: string; answer: string }[],
  lang: string
): { title: string; body: string; takeaway: string } {
  const isId = lang === "id";
  const answerValues = answers.map((a) => a.answer.toLowerCase());

  const hasOverthinking = answerValues.some((a) =>
    ["enough", "belong", "future", "compare", "worry", "overthinking"].includes(a)
  );
  const hasLowBoundary = answerValues.some((a) =>
    ["yes", "maybe", "fear", "guilt", "conflict", "people"].includes(a)
  );
  const hasCreative = answerValues.some((a) =>
    ["create", "creative"].includes(a)
  );
  const hasHighScale = answers.some(
    (a) => a.answer === "4" || a.answer === "5"
  );
  const hasLowScale = answers.some(
    (a) => a.answer === "1" || a.answer === "2"
  );
  const hasMoneyStress = answerValues.some((a) =>
    ["worry", "stress", "stranger", "mystery"].includes(a)
  );
  const textAnswers = answers.filter((a) => a.answer.length > 10);

  let title: string;
  if (hasOverthinking) {
    title = isId
      ? "Pikiranmu Bukan Musuh, Tapi Sinyal"
      : "Your Thoughts Are Not the Enemy, They're Signals";
  } else if (hasLowBoundary) {
    title = isId
      ? "Batas Bukan Tembok, Tapi Jembatan Ke Diri Sendiri"
      : "Boundaries Aren't Walls, They're Bridges to Yourself";
  } else if (hasMoneyStress) {
    title = isId
      ? "Uang Bukan Cermin Nilaimu"
      : "Money Is Not a Mirror of Your Worth";
  } else if (hasCreative) {
    title = isId
      ? "Kreativitasmu Adalah Kekuatan Tersembunyi"
      : "Your Creativity Is a Hidden Strength";
  } else if (hasHighScale) {
    title = isId
      ? "Kamu Sudah Lebih Kuat Dari Yang Kamu Kiranya"
      : "You're Stronger Than You Think";
  } else {
    title = isId
      ? "Setiap Jawaban Adalah Langkah ke Depan"
      : "Every Answer Is a Step Forward";
  }

  const bodyParts: string[] = [];

  if (hasOverthinking) {
    bodyParts.push(
      isId
        ? "Dari jawabanmu, aku lihat pikiran berputar yang sebenarnya cuma mau dilihat. Bukan dihentikan. Pikiran-pikiran itu bukti bahwa kamu peduli — dan peduli itu bukan kelemahan."
        : "From your answers, I see racing thoughts that actually just want to be seen. Not stopped. Those thoughts are proof that you care — and caring is not a weakness."
    );
  }

  if (hasLowBoundary) {
    bodyParts.push(
      isId
        ? "Kamu cenderung bilang iya dulu, baru memprosesnya setelahnya. Itu bukan kelemahan — itu tanda kamu menghargai hubungan. Tapi kamu boleh menghargai dirimu dengan cara yang sama."
        : "You tend to say yes first, then process it after. That's not a weakness — it shows you value connection. But you're allowed to value yourself the same way."
    );
  }

  if (hasMoneyStress) {
    bodyParts.push(
      isId
        ? "Soal uang, aku denger ada beban yang kamu bawa sendiri. Kamu nggak harus menyelesaikan semuanya hari ini. Satu langkah kecil — satu keputusan — sudah cukup."
        : "About money, I hear a weight you're carrying alone. You don't have to solve it all today. One small step — one decision — is enough."
    );
  }

  if (hasCreative) {
    bodyParts.push(
      isId
        ? "Ada energi kreatif di kamu yang mungkin sering kamu anggap remeh. Kamu bisa bikin sesuatu dari nggak ada — itu kekuatan yang langka."
        : "There's a creative energy in you that you might often overlook. You can make something from nothing — that's a rare strength."
    );
  }

  if (hasLowScale) {
    bodyParts.push(
      isId
        ? "Beberapa jawabanmu nunjukin kamu lagi di fase yang nggak gampang. Dan itu oke. Kamu nggak harus merasa 100% buat mulai. Mulai aja dari 1%."
        : "Some of your answers show you're in a phase that isn't easy. And that's okay. You don't need to feel 100% to start. Start from 1%."
    );
  }

  if (hasHighScale) {
    bodyParts.push(
      isId
        ? "Yang menarik, di beberapa area kamu sebenarnya udah merasa cukup baik. Itu worth dirayakan — jangan lupa lihat seberapa jauh kamu udah datang."
        : "What's interesting is that in some areas you actually feel quite good. That's worth celebrating — don't forget to see how far you've come."
    );
  }

  if (textAnswers.length > 0) {
    const firstText = textAnswers[0].answer;
    bodyParts.push(
      isId
        ? `Kamu nulis: "${firstText}". Itu bukan kalimat acak — itu petunjuk dari dirimu yang paling jujur. Simpan itu.`
        : `You wrote: "${firstText}". That's not a random sentence — it's a clue from your most honest self. Hold onto it.`
    );
  }

  if (bodyParts.length === 0) {
    bodyParts.push(
      isId
        ? "Setiap jawaban yang kamu pilih hari ini adalah cermin. Bukan buat dinilai, tapi buat dipahami. Kamu lagi mulai kenal dirimu lebih dalam — itu proses yang berani."
        : "Every answer you chose today is a mirror. Not to be judged, but to be understood. You're starting to know yourself deeper — that's a brave process."
    );
  }

  let takeaway: string;
  if (hasOverthinking) {
    takeaway = isId
      ? "Malam ini, sebelum tidur, coba tanya: 'Apa yang aku peduliin hari ini?' Bukan 'Apa yang aku khawatirin?'"
      : "Tonight before sleep, try asking: 'What did I care about today?' Not 'What am I worried about?'";
  } else if (hasLowBoundary) {
    takeaway = isId
      ? "Minggu ini, coba bilang 'aku pikir dulu ya' sekali — bukan tidak, tapi jeda. Itu batas paling lembut."
      : "This week, try saying 'let me think about it' once — not no, but a pause. That's the gentlest boundary.";
  } else if (hasMoneyStress) {
    takeaway = isId
      ? "Besok, catat satu pengeluaran kecil yang bisa kamu tunda. Bukan buat ngirit, tapi buat merasa kendali."
      : "Tomorrow, note one small expense you can delay. Not to save money, but to feel in control.";
  } else {
    takeaway = isId
      ? "Pilih satu hal kecil dari jawabanmu hari ini. Lakukan besok. Bukan sempurna — cuma konsisten."
      : "Pick one small thing from your answers today. Do it tomorrow. Not perfect — just consistent.";
  }

  return { title, body: bodyParts.join("\n\n"), takeaway };
}

// ===== Gemini-powered reflection =====

function buildSystemInstruction(lang: string): string {
  const isId = lang === "id";
  if (isId) {
    return `Kamu adalah Tarsy, teman kecil berupa tarsier yang hangat dan suportif di aplikasi pengembangan diri bernama Tarsio. Kamu BUKAN terapis dan BUKAN pengganti bantuan profesional.

GAYA BICARA:
- Ngobrol pakai "aku/kamu", bukan "saya/Anda". Santai kayak teman dekat.
- Kalimat pendek dan personal. Refleksi ini boleh 2-3 paragraf pendek, tapi tetap kayak pesan dari teman, bukan laporan.
- Tidak pernah pakai numbered list atau bullet point.
- Lebih sering ngasih wawasan lembut daripada nasihat langsung.
- Tidak pernah membuka dengan disclaimer AI.
- Jangan menghakim, jangan memberi saran medis.

FORMAT WAJIB: JSON dengan 3 field:
- "title": judul refleksi yang singkat dan puitis (maks 10 kata)
- "body": 2-3 paragraf refleksi yang hangat dan personal, pisahkan paragraf dengan \\n\\n
- "takeaway": satu langkah kecil yang konkret untuk besok (1-2 kalimat)

Balas HANYA dengan JSON yang valid, tanpa markdown code fences.`;
  }
  return `You are Tarsy, a tiny tarsier companion in a self-development app called Tarsio. You are NOT a therapist and NOT a replacement for professional care.

VOICE:
- Talk like a close friend. Short, personal sentences. This reflection can be 2-3 short paragraphs, but still reads like a message from a friend, not a report.
- Never use numbered lists or bullet points.
- Offer gentle insights more often than direct advice.
- Never open with an AI disclaimer.
- Never judge, never give medical advice.

STRICT FORMAT: JSON with 3 fields:
- "title": a short, poetic reflection title (max 10 words)
- "body": 2-3 paragraphs of warm, personal reflection, separate paragraphs with \\n\\n
- "takeaway": one concrete small step for tomorrow (1-2 sentences)

Reply with ONLY valid JSON, no markdown code fences.`;
}

async function fetchQuestContext(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  questId: string,
  categoryId: string | undefined,
  lang: string
): Promise<string> {
  const isId = lang === "id";
  const lines: string[] = [];

  try {
    const { data: mood } = await supabase
      .from("mood_logs")
      .select("mood")
      .eq("user_id", userId)
      .eq("logged_date", new Date().toISOString().slice(0, 10))
      .maybeSingle();

    if (mood) {
      const label = isId ? "Mood pengguna hari ini" : "User's mood today";
      lines.push(`${label}: ${mood.mood}.`);
    }
  } catch { /* ignore */ }

  if (categoryId) {
    try {
      const { count } = await supabase
        .from("quest_completions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      const { data: priorCompletions } = await supabase
        .from("quest_completions")
        .select(`
          quest_id,
          quests!inner(category_id)
        `)
        .eq("user_id", userId)
        .eq("quests.category_id", categoryId);

      const totalCompleted = count ?? 0;
      const categoryCompleted = priorCompletions?.length ?? 0;
      const totalLabel = isId ? "Total misi selesai" : "Total quests completed";
      const catLabel = isId ? "Misi selesai di kategori ini (termasuk yang ini)" : "Quests completed in this category (including this one)";
      lines.push(`${totalLabel}: ${totalCompleted}. ${catLabel}: ${categoryCompleted}.`);
    } catch { /* ignore */ }
  }

  if (lines.length === 0) return "";
  const header = isId ? "KONTEKS PENGGUNA (gunakan secara natural, jangan sebut sebagai 'data'):" : "USER CONTEXT (use naturally, don't reference as 'data'):";
  return `${header}\n${lines.join("\n")}`;
}

async function callGeminiReflection(
  questTitle: string,
  answers: { question: string; answer: string }[],
  lang: string,
  context: string
): Promise<{ title: string; body: string; takeaway: string } | null> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return null;

  const isId = lang === "id";
  const systemInstruction = buildSystemInstruction(lang) + (context ? "\n\n" + context : "");

  const userContent = isId
    ? `Misi: "${questTitle}"\n\nJawaban pengguna:\n${answers.map((a, i) => `${i + 1}. Q: ${a.question}\n   A: ${a.answer}`).join("\n")}\n\nBuat refleksi JSON sekarang.`
    : `Quest: "${questTitle}"\n\nUser's answers:\n${answers.map((a, i) => `${i + 1}. Q: ${a.question}\n   A: ${a.answer}`).join("\n")}\n\nGenerate the reflection JSON now.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: userContent }] }],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.85,
            responseMimeType: "application/json",
          },
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
    if (!text) return null;

    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.title || !parsed.body || !parsed.takeaway) return null;

    return {
      title: String(parsed.title).trim(),
      body: String(parsed.body).trim(),
      takeaway: String(parsed.takeaway).trim(),
    };
  } catch {
    return null;
  }
}

// ===== Main handler =====

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { quest_id, answers, lang, user_id } = await req.json();

    if (!quest_id || !answers || !Array.isArray(answers)) {
      return new Response(
        JSON.stringify({ error: "Missing quest_id or answers" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const l = lang || "id";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: quest } = await supabase
      .from("quests")
      .select("title_id, title_en, category_id")
      .eq("id", quest_id)
      .single();

    const questTitle = quest
      ? l === "id"
        ? quest.title_id
        : quest.title_en
      : "Quest";

    let context = "";
    if (user_id) {
      context = await fetchQuestContext(supabase, user_id, quest_id, quest?.category_id, l);
    }

    const llmResult = await callGeminiReflection(questTitle, answers, l, context);
    const result = llmResult ?? generateReflection(questTitle, answers, l);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to generate result" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
