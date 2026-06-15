// src/lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Order, PredictBreachResponse } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_INSTRUCTION = `You are an operations AI for an eyewear fulfilment company.
You analyze orders and predict SLA breach risk based on:
- Lens type and its typical complexity
- Current stage in the fulfilment pipeline
- Time already elapsed vs SLA
- Whether lens was in stock or needs sourcing
- Historical QC failure patterns (lens type specific)
- Time of day/week effects

Respond ONLY with a valid JSON object with no extra text, no markdown, no explanation outside the JSON:
{
  "breach_probability": 0.0-1.0,
  "predicted_breach": true|false,
  "risk_level": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL",
  "reasoning": "2-3 sentence plain English explanation",
  "recommended_action": "specific action for the team"
}`;

export interface PredictBreachInput {
  order: Order;
  storeName: string;
  qcFailureCount: number;
  hoursElapsed: number;
  hoursRemaining: number;
  dayOfWeek: string;
}

export async function predictBreach(
  input: PredictBreachInput
): Promise<PredictBreachResponse> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
      maxOutputTokens: 512,
    },
  });

  const userPrompt = `Order details:
- Order #: ${input.order.order_number}
- Lens Type: ${input.order.lens_type} (SLA: ${input.order.sla_hours}h)
- Current Status: ${input.order.status}
- Hours Elapsed: ${input.hoursElapsed.toFixed(1)}
- Hours Remaining in SLA: ${input.hoursRemaining.toFixed(1)}
- Lens In Stock: ${input.order.lens_in_stock}
- Coating: ${input.order.coating ?? 'None'}
- QC Failures on this order: ${input.qcFailureCount}
- Store: ${input.storeName}
- Day of week: ${input.dayOfWeek}
Predict breach probability.`;

  try {
    const result = await model.generateContent(userPrompt);
    const text = result.response.text();

    // Parse JSON — strip any accidental markdown fencing
    const jsonText = text.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonText) as PredictBreachResponse;

    // Validate & clamp
    return {
      breach_probability: Math.max(0, Math.min(1, parsed.breach_probability ?? 0.5)),
      predicted_breach: parsed.predicted_breach ?? parsed.breach_probability > 0.5,
      risk_level: parsed.risk_level ?? 'MEDIUM',
      reasoning: parsed.reasoning ?? 'Unable to generate reasoning.',
      recommended_action: parsed.recommended_action ?? 'Monitor order closely.',
    };
  } catch (error) {
    console.error('[Gemini] Prediction error:', error);
    // Return safe default on failure
    return {
      breach_probability: 0.5,
      predicted_breach: false,
      risk_level: 'MEDIUM',
      reasoning: 'AI prediction unavailable. Manual review recommended.',
      recommended_action: 'Check order status manually.',
    };
  }
}
