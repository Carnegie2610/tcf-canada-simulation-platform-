export interface AiResult {
  text: string;
  provider: string;
  model: string;
  durationMs: number;
}

type GeminiResponse = {
  candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
};

type OpenAiCompatibleResponse = {
  choices: Array<{ message: { content: string } }>;
};

type AnthropicResponse = {
  content: Array<{ type: string; text: string }>;
};

export interface StructuredOutput {
  name: string;
  schema: Record<string, unknown>;
}

async function callGemini(systemPrompt: string, userPrompt: string, apiKey: string): Promise<AiResult> {
  const start = Date.now();
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 16384,
        },
      }),
    }
  );
  if (!res.ok) throw new Error("gemini_request_failed");
  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("gemini_empty_response");
  return { text, provider: "gemini", model: "gemini-2.5-flash", durationMs: Date.now() - start };
}

async function callGroq(systemPrompt: string, userPrompt: string, apiKey: string): Promise<AiResult> {
  const start = Date.now();
  const model = "llama-3.3-70b-versatile";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 16384,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error(`[callGroq] HTTP ${res.status}:`, errBody);
    throw new Error(`groq_request_failed:${res.status}`);
  }
  const data = (await res.json()) as OpenAiCompatibleResponse;
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("groq_empty_response");
  return { text, provider: "groq", model, durationMs: Date.now() - start };
}

async function callOpenAI(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  structuredOutput?: StructuredOutput
): Promise<AiResult> {
  const start = Date.now();
  // Structured Outputs strict mode (when a schema is supplied) mechanically guarantees every
  // field declared in the schema is present in the response — plain json_object mode only
  // guarantees syntactically valid JSON, which let the model silently omit fields under load.
  const response_format = structuredOutput
    ? {
        type: "json_schema" as const,
        json_schema: {
          name: structuredOutput.name,
          strict: true,
          schema: structuredOutput.schema,
        },
      }
    : { type: "json_object" as const };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format,
      max_tokens: 16384,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error(`[callOpenAI] HTTP ${res.status}:`, errBody);
    throw new Error(`openai_request_failed:${res.status}`);
  }
  const data = (await res.json()) as OpenAiCompatibleResponse;
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("openai_empty_response");
  return { text, provider: "openai", model: "gpt-4o-mini", durationMs: Date.now() - start };
}

async function callAnthropic(systemPrompt: string, userPrompt: string, apiKey: string): Promise<AiResult> {
  const start = Date.now();
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
  return { text, provider: "anthropic", model: "claude-sonnet-4-6", durationMs: Date.now() - start };
}

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  structuredOutput?: StructuredOutput
): Promise<AiResult> {
  const active = process.env.ACTIVE_AI_PROVIDER;
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  type ProviderFn = () => Promise<AiResult>;
  const ordered: ProviderFn[] = [];

  // Preferred provider goes first
  if (active === "gemini" && geminiKey)            ordered.push(() => callGemini(systemPrompt, userPrompt, geminiKey));
  else if (active === "groq" && groqKey)           ordered.push(() => callGroq(systemPrompt, userPrompt, groqKey));
  else if (active === "openai" && openaiKey)       ordered.push(() => callOpenAI(systemPrompt, userPrompt, openaiKey, structuredOutput));
  else if (active === "anthropic" && anthropicKey) ordered.push(() => callAnthropic(systemPrompt, userPrompt, anthropicKey));

  // Remaining providers queued as automatic fallbacks (skipped if already queued as active)
  if (active !== "gemini" && geminiKey)            ordered.push(() => callGemini(systemPrompt, userPrompt, geminiKey));
  if (active !== "groq" && groqKey)                ordered.push(() => callGroq(systemPrompt, userPrompt, groqKey));
  if (active !== "openai" && openaiKey)            ordered.push(() => callOpenAI(systemPrompt, userPrompt, openaiKey, structuredOutput));
  if (active !== "anthropic" && anthropicKey)      ordered.push(() => callAnthropic(systemPrompt, userPrompt, anthropicKey));

  if (ordered.length === 0) throw new Error("no_ai_provider_configured");

  let lastError: Error = new Error("no_ai_provider_configured");
  for (const fn of ordered) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error("[callAI] provider failed:", lastError.message, "— trying next provider");
    }
  }
  throw lastError;
}
