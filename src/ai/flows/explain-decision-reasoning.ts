'use server';

/**
 * @fileOverview Explains the reasoning behind the traffic light duration decision.
 *
 * - explainDecisionReasoning - A function that explains the traffic light duration decision.
 * - ExplainDecisionReasoningInput - The input type for the explainDecisionReasoning function.
 * - ExplainDecisionReasoningOutput - The return type for the explainDecisionReasoning function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainDecisionReasoningInputSchema = z.object({
  group: z.enum(['NS', 'EW']).describe('The chosen traffic group (North-South or East-West).'),
  ns_green_s: z.number().describe('The green light duration for North-South in seconds.'),
  ew_green_s: z.number().describe('The green light duration for East-West in seconds.'),
  delta_used_s: z.number().describe('The delta (adjustment) value used in seconds.'),
  ns_queue: z.number().describe('The queue length for North-South.'),
  ew_queue: z.number().describe('The queue length for East-West.'),
  ns_count: z.number().describe('The vehicle count for North-South.'),
  ew_count: z.number().describe('The vehicle count for East-West.'),
  ns_mean: z.number().describe('The mean demand for North-South.'),
  ew_mean: z.number().describe('The mean demand for East-West.'),
  ns_weight: z.number().describe('The weight index for North-South.'),
  ew_weight: z.number().describe('The weight index for East-West.'),
  ns_emergency: z.boolean().describe('Whether there is an emergency for North-South.'),
  ew_emergency: z.boolean().describe('Whether there is an emergency for East-West.'),
});
export type ExplainDecisionReasoningInput = z.infer<
  typeof ExplainDecisionReasoningInputSchema
>;

const ExplainDecisionReasoningOutputSchema = z.object({
  explanation: z.string().describe('The explanation of the traffic light duration decision.'),
});
export type ExplainDecisionReasoningOutput = z.infer<
  typeof ExplainDecisionReasoningOutputSchema
>;

export async function explainDecisionReasoning(
  input: ExplainDecisionReasoningInput
): Promise<ExplainDecisionReasoningOutput> {
  return explainDecisionReasoningFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainDecisionReasoningPrompt',
  input: {schema: ExplainDecisionReasoningInputSchema},
  output: {schema: ExplainDecisionReasoningOutputSchema},
  prompt: `You are a traffic AI. Provide a concise, one-sentence explanation for the green light decision for the {{group}} direction.

If an emergency is active (e.g., {{#if ns_emergency}}NS emergency{{/if}}{{#if ew_emergency}}EW emergency{{/if}}), mention it was detected by sound sensors picking up siren frequencies.
Prioritize the most impactful factor: emergency, then queue length, then vehicle weight/type.

Data:
Group: {{group}}
Green Time: {{#if (eq group "NS")}}{{ns_green_s}}{{else}}{{ew_green_s}}{{/if}}s (Δ: {{delta_used_s}}s)
NS Queue: {{ns_queue}}, EW Queue: {{ew_queue}}
NS Emergency: {{ns_emergency}}, EW Emergency: {{ew_emergency}}
`,
});

const explainDecisionReasoningFlow = ai.defineFlow(
  {
    name: 'explainDecisionReasoningFlow',
    inputSchema: ExplainDecisionReasoningInputSchema,
    outputSchema: ExplainDecisionReasoningOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
