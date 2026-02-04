
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Genkit Configuration - v1.x Standard
 * Fixed: Removed invalid direct model import and used string ID instead.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY || 'AIzaSyBvUq_RBNnP_B5roqcLedrL9O_nuhqGeig',
    })
  ],
  model: 'googleai/gemini-1.5-flash', 
});
