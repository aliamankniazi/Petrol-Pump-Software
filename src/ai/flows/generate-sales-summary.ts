'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating daily sales summaries using an LLM.
 *
 * - generateSalesSummary - A function that generates the daily sales summary.
 * - GenerateSalesSummaryInput - The input type for the generateSalesSummary function.
 * - GenerateSalesSummaryOutput - The return type for the generateSalesSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSalesSummaryInputSchema = z.object({
  dailySalesData: z.string().describe('The daily sales data in JSON format.'),
});
export type GenerateSalesSummaryInput = z.infer<typeof GenerateSalesSummaryInputSchema>;

const GenerateSalesSummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the daily sales data.'),
});
export type GenerateSalesSummaryOutput = z.infer<typeof GenerateSalesSummaryOutputSchema>;

export async function generateSalesSummary(input: GenerateSalesSummaryInput): Promise<GenerateSalesSummaryOutput> {
  return generateSalesSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSalesSummaryPrompt',
  input: {schema: GenerateSalesSummaryInputSchema},
  output: {schema: GenerateSalesSummaryOutputSchema},
  prompt: `You are an expert sales data analyst. Generate a concise summary of the daily sales data provided in JSON format.\n\nSales Data: {{{dailySalesData}}}`,
});

const generateSalesSummaryFlow = ai.defineFlow(
  {
    name: 'generateSalesSummaryFlow',
    inputSchema: GenerateSalesSummaryInputSchema,
    outputSchema: GenerateSalesSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
