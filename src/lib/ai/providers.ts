type GeminiResponse = {
  candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
};

type GroqResponse = {
  choices: Array<{ message: { content: string } }>;
};

type AnthropicResponse = {
  content: Array<{ type: string; text: string }>;
};

async function callGemini(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) throw new Error("gemini_request_failed");
  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("gemini_empty_response");
  return text;
}

async function callGroq(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error("groq_request_failed");
  const data = (await res.json()) as GroqResponse;
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("groq_empty_response");
  return text;
}

async function callAnthropic(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) throw new Error("anthropic_request_failed");
  const data = (await res.json()) as AnthropicResponse;
  const text = data.content?.[0]?.text;
  if (!text) throw new Error("anthropic_empty_response");
  return text;
}

export async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (geminiKey) return callGemini(systemPrompt, userPrompt, geminiKey);
  if (groqKey) return callGroq(systemPrompt, userPrompt, groqKey);
  if (anthropicKey) return callAnthropic(systemPrompt, userPrompt, anthropicKey);

  throw new Error("no_ai_provider_configured");
}
