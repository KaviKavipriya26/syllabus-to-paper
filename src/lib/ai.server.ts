/**
 * Independent AI service layer.
 * Provider/model configurable through environment variables:
 *   AI_GATEWAY_URL (default Lovable AI Gateway), AI_MODEL, LOVABLE_API_KEY
 */

export class AiError extends Error {}

interface AiJsonArgs {
  system: string;
  prompt: string;
  schemaName: string;
  schema: Record<string, unknown>;
}

const friendly = (status: number, message: string) => {
  if (status === 402)
    return message || "AI credits are exhausted. Please add credits to continue.";
  if (status === 403)
    return message || "AI access is currently blocked for this workspace.";
  if (status === 429) return "The AI service is busy right now. Please try again in a moment.";
  if (status === 401) return "The AI service is not configured correctly.";
  if (status >= 500) return "The AI service is temporarily unavailable. Please try again.";
  return "The AI service could not process this request.";
};

export async function aiJson<T>({ system, prompt, schemaName, schema }: AiJsonArgs): Promise<T> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError("The AI service is not configured correctly.");
  const baseUrl = process.env["AI_GATEWAY_URL"] ?? "https://ai.gateway.lovable.dev/v1";
  const model = process.env["AI_MODEL"] ?? "openai/gpt-5.6-terra";

  const res = await fetch(`${baseUrl}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model,
      instructions: system,
      input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
      stream: true,
      reasoning: { effort: "low", summary: "auto" },
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!res.ok || !res.body) {
    let message = "";
    try {
      const body = (await res.json()) as { error?: { message?: string }; message?: string };
      message = body?.error?.message ?? body?.message ?? "";
    } catch {
      /* ignore */
    }
    throw new AiError(friendly(res.status, message));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: { output_text?: string };
        };
        if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
          text += evt.delta;
        } else if (evt.type === "response.completed" && evt.response?.output_text) {
          if (!text) text = evt.response.output_text;
        }
      } catch {
        /* ignore keep-alive/partial events */
      }
    }
  }

  if (!text.trim()) throw new AiError("The AI service returned an empty response.");

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AiError("The AI response was not in a valid format. Please try again.");
  }
}
