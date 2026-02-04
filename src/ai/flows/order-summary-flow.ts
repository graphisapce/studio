
'use server';
/**
 * @fileOverview AI Voice Briefing for Riders.
 * 
 * - generateOrderVoiceBrief - Generates a 5-10s audio script for the rider.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import wav from 'wav';

const OrderBriefInputSchema = z.object({
  productTitle: z.string(),
  shopName: z.string(),
  customerName: z.string(),
  address: z.string(),
});

export async function generateOrderVoiceBrief(input: z.infer<typeof OrderBriefInputSchema>) {
  return orderSummaryFlow(input);
}

const orderSummaryFlow = ai.defineFlow(
  {
    name: 'orderSummaryFlow',
    inputSchema: OrderBriefInputSchema,
    outputSchema: z.object({ media: z.string() }),
  },
  async input => {
    const script = `Naya order mila hai. ${input.shopName} se ${input.productTitle} uthana hai aur ${input.customerName} ko ${input.address} par deliver karna hai. Drive safe!`;

    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: script,
    });

    if (!media) throw new Error('Audio failed');

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

async function toWav(pcmData: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({ channels: 1, sampleRate: 24000, bitDepth: 16 });
    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', d => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));
    writer.write(pcmData);
    writer.end();
  });
}
