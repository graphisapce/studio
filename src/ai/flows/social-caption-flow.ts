'use server';
/**
 * @fileOverview AI Social Media Caption Generator for Business Owners.
 *
 * - generateSocialCaption - Writes catchy WhatsApp/Instagram captions for products.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SocialCaptionInputSchema = z.object({
  shopName: z.string(),
  productName: z.string(),
  price: z.number(),
  category: z.string(),
});
export type SocialCaptionInput = z.infer<typeof SocialCaptionInputSchema>;

const SocialCaptionOutputSchema = z.object({
  caption: z.string().describe('A catchy, viral-style Hinglish caption for WhatsApp/Instagram.'),
});
export type SocialCaptionOutput = z.infer<typeof SocialCaptionOutputSchema>;

export async function generateSocialCaption(input: SocialCaptionInput): Promise<SocialCaptionOutput> {
  if (!process.env.GOOGLE_GENAI_API_KEY) {
    throw new Error("API Key missing.");
  }
  return socialCaptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSocialCaptionPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: SocialCaptionInputSchema },
  output: { schema: SocialCaptionOutputSchema },
  prompt: `You are an expert Social Media Manager for Indian local shops.
Create a viral-style social media caption (WhatsApp Status / Instagram) for the following:

Shop Name: {{{shopName}}}
Product: {{{productName}}}
Price: ₹{{{price}}}
Category: {{{category}}}

Guidelines:
1. Language: Hinglish (Hindi + English).
2. Tone: Energetic, friendly, and convincing.
3. Length: Short and sweet (under 200 characters).
4. Structure: 
   - Hook (Something to grab attention)
   - Value (Why buy this?)
   - Call to Action (Visit us or Call us)
5. Add relevant emojis.
6. Mention that it's available on LocalVyapar.

Example: "Ab khana hoga aur bhi swadist! 😋 Try our {{{productName}}} at {{{shopName}}} today. Best quality only at ₹{{{price}}}. Visit us now! ✨"`,
});

const socialCaptionFlow = ai.defineFlow(
  {
    name: 'socialCaptionFlow',
    inputSchema: SocialCaptionInputSchema,
    outputSchema: SocialCaptionOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) throw new Error("AI could not generate caption.");
    return output;
  }
);
