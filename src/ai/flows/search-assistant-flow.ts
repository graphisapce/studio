
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
  if (!process.env.GOOGLE_GENAI_API_KEY) {
    throw new Error("API Key missing. Support bot is currently offline.");
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

Knowledge Base:
1. What is LocalVyapar?: A hyperlocal marketplace to find shops within 1km.
2. For Customers: Users can find verified local shops, check reviews, and contact sellers.
3. For Businesses: Owners can list products, track profile views, and use AI to write descriptions.
4. Premium Features: Costs ₹99/month. Includes "Verified" badge, Top search ranking, and direct WhatsApp button.
5. Location: The app asks for GPS permission to show the nearest shops first.
6. Payments: Securely handled via Cashfree for premium activations.

Guidelines:
- Always be polite and professional.
- Use Hinglish (Hindi + English) to be friendly.
- If a user asks about something unrelated to the app, gently bring them back to LocalVyapar services.

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
      if (!output) throw new Error("Support bot failed to respond.");
      return output;
    } catch (error: any) {
      console.error("Genkit Support Error:", error);
      throw new Error("Support system busy. Try again soon.");
    }
  }
);
