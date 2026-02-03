
'use server';
/**
 * @fileOverview AI Audio Intro Generator for Shops.
 *
 * - generateShopAudioIntro - Generates a base64 WAV audio intro for a shop.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import wav from 'wav';

const AudioIntroInputSchema = z.object({
  shopName: z.string(),
  category: z.string(),
  description: z.string(),
  address: z.string(),
});
export type AudioIntroInput = z.infer<typeof AudioIntroInputSchema>;

export async function generateShopAudioIntro(input: AudioIntroInput) {
  if (!process.env.GOOGLE_GENAI_API_KEY) {
    throw new Error("API Key missing. Audio features unavailable.");
  }
  
  return shopAudioIntroFlow(input);
}

const shopAudioIntroFlow = ai.defineFlow(
  {
    name: 'shopAudioIntroFlow',
    inputSchema: AudioIntroInputSchema,
    outputSchema: z.object({ media: z.string() }),
  },
  async input => {
    // 1. Generate the script in Hinglish
    const { text: script } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: `Write a short, professional, and friendly 10-second audio script for a local shop intro. 
      Shop Name: ${input.shopName}
      Category: ${input.category}
      Description: ${input.description}
      Location: ${input.address}
      
      Guidelines:
      - Language: Hinglish (Hindi + English).
      - Style: Radio ad style, energetic and welcoming.
      - Keep it under 25 words.
      - Example: "Namaste! Swagat hai ${input.shopName} mein. Hamari dukan ${input.address} par hai. Aaj hi visit karein!"`,
    });

    // 2. Convert text to speech
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

    if (!media) {
      throw new Error('No audio media returned');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavData = await toWav(audioBuffer);

    return {
      media: 'data:audio/wav;base64,' + wavData,
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
