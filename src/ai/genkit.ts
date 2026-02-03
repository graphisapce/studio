import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit Configuration
 * 
 * Using 'gemini-1.5-flash' as it is the most compatible model 
 * for both free and pay-as-you-go tiers, and significantly faster.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash', 
});
