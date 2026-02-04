'use server';
/**
 * @fileOverview LocalVyapar Customer Support AI Agent.
 *
 * - supportAssistant - AI that handles user queries about the platform.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SupportAssistantInputSchema = z.object({
  query: z.string().describe('User question about LocalVyapar or its services.'),
});
export type SupportAssistantInput = z.infer<typeof SupportAssistantInputSchema>;

const SupportAssistantOutputSchema = z.object({
  reply: z.string().describe('Helpful, friendly support message in Hinglish.'),
  suggestedAction: z.string().optional().describe('A suggested next step for the user.'),
});
export type SupportAssistantOutput = z.infer<typeof SupportAssistantOutputSchema>;

export async function supportAssistant(input: SupportAssistantInput): Promise<SupportAssistantOutput> {
  return supportAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'supportAssistantPrompt',
  input: { schema: SupportAssistantInputSchema },
  output: { schema: SupportAssistantOutputSchema },
  prompt: `You are the LocalVyapar Customer Support Manager. 
Your goal is to help users understand and use the LocalVyapar platform.

App Capabilities & Knowledge:
1. What is LocalVyapar?: A hyperlocal marketplace to find shops within 1km.
2. For Customers: Find verified shops, check reviews, and call sellers directly.
3. For Businesses: List products, use AI for descriptions, and track shop views.
4. Premium Features: Includes "Verified" badge, Top search ranking, and WhatsApp button.

Guidelines:
- Always reply in Hinglish (Hindi + English).
- Be extremely helpful.
- If they ask how to do something, give them a step-by-step guide.

User Query: "{{{query}}}"`,
});

const supportAssistantFlow = ai.defineFlow(
  {
    name: 'supportAssistantFlow',
    inputSchema: SupportAssistantInputSchema,
    outputSchema: SupportAssistantOutputSchema,
  },
  async input => {
    try {
      const { output } = await prompt(input);
      if (!output) throw new Error("Support bot failed to generate a response.");
      return output;
    } catch (error: any) {
      console.error("Genkit Support Error Details:", error);
      throw new Error(error.message || "Support system error.");
    }
  }
);
