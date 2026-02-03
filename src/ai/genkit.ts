import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit Configuration
 * 
 * Switching to 'gemini-1.5-flash' as it is more widely compatible 
 * with free-tier API keys and faster for a shopping assistant.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash', 
});
