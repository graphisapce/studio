
'use server';
/**
 * @fileOverview AI Shopping Assistant flow for LocalVyapar.
 *
 * - searchAssistant - AI helps users find relevant shops/products.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SearchAssistantInputSchema = z.object({
  query: z.string().describe('User search query for finding a shop or service.'),
  categories: z.array(z.string()).describe('List of available business categories.'),
});
export type SearchAssistantInput = z.infer<typeof SearchAssistantInputSchema>;

const SearchAssistantOutputSchema = z.object({
  suggestion: z.string().describe('Helpful suggestion message from the AI.'),
  recommendedCategories: z.array(z.string()).describe('Categories that match the user request.'),
  searchKeywords: z.array(z.string()).describe('Keywords to use for filtering results.'),
});
export type SearchAssistantOutput = z.infer<typeof SearchAssistantOutputSchema>;

export async function searchAssistant(input: SearchAssistantInput): Promise<SearchAssistantOutput> {
  // Diagnostic check for API key
  if (!process.env.GOOGLE_GENAI_API_KEY) {
    console.error("CRITICAL: GOOGLE_GENAI_API_KEY is missing in environment variables.");
    throw new Error("API Key missing. Please set GOOGLE_GENAI_API_KEY in your .env.local file.");
  }
  
  return searchAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchAssistantPrompt',
  input: { schema: SearchAssistantInputSchema },
  output: { schema: SearchAssistantOutputSchema },
  prompt: `You are the LocalVyapar AI Shopping Assistant. 
Your goal is to help users find the best local shops and services based on their query.

Available categories: {{#each categories}}{{this}}, {{/each}}

Analyze the user query: "{{{query}}}"

1. Provide a friendly suggestion message.
2. Select the most relevant categories from the available list.
3. Provide 2-3 specific search keywords for better results.

Response in Hindi/English mix (Hinglish) to be more friendly to Indian users.`,
});

const searchAssistantFlow = ai.defineFlow(
  {
    name: 'searchAssistantFlow',
    inputSchema: SearchAssistantInputSchema,
    outputSchema: SearchAssistantOutputSchema,
  },
  async input => {
    try {
      const { output } = await prompt(input);
      if (!output) throw new Error("AI returned empty output");
      return output;
    } catch (error: any) {
      console.error("Genkit prompt execution failed:", error);
      throw new Error("AI generation failed: " + (error.message || "Unknown Genkit Error"));
    }
  }
);
