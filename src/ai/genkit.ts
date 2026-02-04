
import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/google-genai';

/**
 * Genkit Configuration - v1.x Standard
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY || 'AIzaSyBvUq_RBNnP_B5roqcLedrL9O_nuhqGeig',
    })
  ],
  model: gemini15Flash, 
});
