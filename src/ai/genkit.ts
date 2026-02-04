import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit Configuration
 * 
 * Using 'gemini-1.5-flash' for reliability.
 * Explicitly passing the API key from environment variables.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    })
  ],
  model: 'googleai/gemini-1.5-flash', 
});
