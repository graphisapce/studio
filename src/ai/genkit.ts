
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit Configuration
 * 
 * Using 'gemini-1.5-flash' explicitly as it has the highest compatibility
 * and avoids 404 errors common with 'pro' models in some regions/tiers.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash', 
});
