'use server';

/**
 * @fileOverview Calculates the adjustment (Δ) for green light times each phase using the provided formula.
 *
 * Exports:
 * - `calculateDelta`: An async function that calculates the delta value.
 * - `CalculateDeltaInput`: The input type for the `calculateDelta` function.
 * - `CalculateDeltaOutput`: The output type for the `calculateDelta` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateDeltaInputSchema = z.object({
  emergencyBonus: z
    .number()
    .describe('Bonus time added due to emergency vehicles (seconds).'),
  meanDemand: z.number().describe('Mean demand score for the group.'),
  avgMean: z.number().describe('Average mean demand across all groups.'),
  weightIndex: z.number().describe('Weight index for the group.'),
  avgWeight: z.number().describe('Average weight index across all groups.'),
  alpha: z
    .number()
    .describe('Coefficient for mean demand influence on delta.'),
  beta: z.number().describe('Coefficient for weight index influence on delta.'),
  maxAdjust: z.number().describe('Maximum adjustment allowed (seconds).'),
});
export type CalculateDeltaInput = z.infer<typeof CalculateDeltaInputSchema>;

const CalculateDeltaOutputSchema = z.object({
  delta: z
    .number()
    .describe(
      'The calculated delta value (adjustment to green light time in seconds).' + 'Clamped between -maxAdjust and +maxAdjust.'
    ),
});
export type CalculateDeltaOutput = z.infer<typeof CalculateDeltaOutputSchema>;

export async function calculateDelta(input: CalculateDeltaInput): Promise<CalculateDeltaOutput> {
  return calculateDeltaFlow(input);
}

const calculateDeltaPrompt = ai.definePrompt({
  name: 'calculateDeltaPrompt',
  input: {schema: CalculateDeltaInputSchema},
  output: {schema: CalculateDeltaOutputSchema},
  prompt: `You are a traffic engineer calculating the delta (Δ) value to adjust green light times.

Use the following formula to calculate Δ:
Δ = Emergency_Bonus + α * (mean_demand - avg_mean) + β * (weight_index - avg_weight)

Where:
- Emergency_Bonus = {{{emergencyBonus}}}
- α (alpha) = {{{alpha}}}
- mean_demand = {{{meanDemand}}}
- avg_mean = {{{avgMean}}}
- β (beta) = {{{beta}}}
- weight_index = {{{weightIndex}}}
- avg_weight = {{{avgWeight}}}

Clamp the final Δ value between -{{{maxAdjust}}} and +{{{maxAdjust}}}.

Return the clamped Δ value.`,
});

const calculateDeltaFlow = ai.defineFlow(
  {
    name: 'calculateDeltaFlow',
    inputSchema: CalculateDeltaInputSchema,
    outputSchema: CalculateDeltaOutputSchema,
  },
  async input => {
    const {output} = await calculateDeltaPrompt(input);
    return output!;
  }
);
