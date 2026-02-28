import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Model + pricing constants
// ---------------------------------------------------------------------------

export const WAITER_MODEL      = "claude-sonnet-4-20250514" as const;
export const WAITER_MAX_TOKENS = 1024;

// Sonnet 4 pricing — $3 / MTok input, $15 / MTok output
export const COST_PER_INPUT_TOKEN  = 3  / 1_000_000;
export const COST_PER_OUTPUT_TOKEN = 15 / 1_000_000;

// ---------------------------------------------------------------------------
// Client singleton (server-side only)
// ---------------------------------------------------------------------------

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set.");
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

// ---------------------------------------------------------------------------
// streamChat
//
// Returns an Anthropic Stream object. Callers can:
//   for await (const event of stream) { ... }
//   const final = await stream.finalMessage();  // after the loop
// ---------------------------------------------------------------------------

export type ChatMessage = { role: "user" | "assistant"; content: string };

export function streamChat(systemPrompt: string, messages: ChatMessage[]) {
  return getClient().messages.stream({
    model:      WAITER_MODEL,
    max_tokens: WAITER_MAX_TOKENS,
    system:     systemPrompt,
    messages,
  });
}

// ---------------------------------------------------------------------------
// estimateCost — simple helper for usage logging
// ---------------------------------------------------------------------------

export function estimateCost(inputTokens: number, outputTokens: number): number {
  return inputTokens * COST_PER_INPUT_TOKEN + outputTokens * COST_PER_OUTPUT_TOKEN;
}
