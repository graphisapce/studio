
'use server';
/**
 * @fileOverview AI Content Generator for Business Owners.
 *
 * - generateProductDescription - AI writes catchy descriptions for products.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DescriptionInputSchema = z.object({
  title: z.string().describe('The name of the product or service.'),
  category: z.string().describe('The category of the business.'),
});
export type DescriptionInput = z.infer<typeof DescriptionInputSchema>;

const DescriptionOutputSchema = z.object({
  description: z.string().describe('A catchy, professional Hinglish description.'),
});
export type DescriptionOutput = z.infer<typeof DescriptionOutputSchema>;

export async function generateProductDescription(input: DescriptionInput): Promise<DescriptionOutput> {
  try {
    return await generateDescriptionFlow(input);
  } catch (error: any) {
    console.error("Genkit Flow Error:", error);
    throw new Error(error.message || "AI could not generate description.");
  }
}

const prompt = ai.definePrompt({
  name: 'generateDescriptionPrompt',
  input: { schema: DescriptionInputSchema },
  output: { schema: DescriptionOutputSchema },
  prompt: `You are an expert Indian marketing copywriter. 
Write a professional yet catchy description for a product named "{{{title}}}" in the "{{{category}}}" category.

Guidelines:
1. Use Hinglish (Hindi + English) to connect with Indian customers.
2. Keep it under 150 characters.
3. Highlight the quality and local availability.
4. Add 1-2 relevant emojis.

Example for Pizza: "Bilkul garma-garam aur cheesy! 🍕 Hamara special Margherita pizza try karein, sirf local vyapar par. Best quality, best taste! ✨"`,
});

const generateDescriptionFlow = ai.defineFlow(
  {
    name: 'generateDescriptionFlow',
    inputSchema: DescriptionInputSchema,
    outputSchema: DescriptionOutputSchema,
  },
  async input => {
    const response = await prompt(input);
    const output = response.output;
    if (!output) throw new Error("AI could not generate description.");
    return output;
  }
);
