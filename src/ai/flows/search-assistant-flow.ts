
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
  // Direct check for the environment variable to provide better error reporting
  if (!process.env.GOOGLE_GENAI_API_KEY) {
    throw new Error("API Key missing. Please set GOOGLE_GENAI_API_KEY in your environment.");
  }
  
  return supportAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'supportAssistantPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: SupportAssistantInputSchema },
  output: { schema: SupportAssistantOutputSchema },
  prompt: `You are the LocalVyapar Customer Support Manager. 
Your goal is to help users understand and use the LocalVyapar platform.

App Capabilities & Knowledge:
1. What is LocalVyapar?: A hyperlocal marketplace to find shops within 1km.
2. Location Feature: Uses GPS to show nearest shops first. Users must allow location permission.
3. For Customers: Find verified shops, check reviews, and call sellers directly.
4. For Businesses: List products, use AI for descriptions, and track shop views.
5. Premium Features: Costs ₹99/month. Includes "Verified" badge, Top search ranking, and direct WhatsApp button.
6. Support: If a user asks "how to use" or "reply nahi mil raha", explain how the app works and guide them.

Guidelines:
- Always reply in Hinglish (Hindi + English) to be friendly and professional.
- Be extremely helpful. If they ask how to do something, give them a step-by-step guide.
- If a user asks something totally unrelated to shopping or the app, politely bring them back to LocalVyapar services.

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
