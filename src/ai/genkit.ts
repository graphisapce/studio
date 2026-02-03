import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Genkit Configuration
 * 
 * To use a different model (like Gemini 3 when released), 
 * simply change the 'model' string below.
 * Current most advanced: 'googleai/gemini-1.5-pro'
 * For Gemini 3 (future): 'googleai/gemini-3.0-flash'
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-pro', 
});
