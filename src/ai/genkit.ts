import {genkit,
        Plugin,
        Prompter,
        Model,
        NoopModel,
        NoopRetriever,
        Retriever,
} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// This function creates a no-op plugin that will be used when the Google AI
// plugin is not configured. This prevents the app from crashing if the API key
// is missing.
function noopPlugin(): Plugin<void> {
  const noopModel = new NoopModel();
  const noopRetriever = new NoopRetriever();
  return {
    name: 'noop',
    configure: async () => {
      return {
        async start() {},
        async close() {},
        model(name: string): Model | undefined {
          return noopModel;
        },
        retriever(name: string): Retriever | undefined {
          return noopRetriever;
        },
        prompter(name: string): Prompter | undefined {
          return undefined;
        },
      };
    },
  };
}

export const ai = genkit({
  plugins: [
    process.env.GOOGLE_API_KEY
      ? googleAI()
      : // This is a fallback plugin that will be used if the Google AI plugin
        // is not configured. This prevents the app from crashing if the API
        // key is missing.
        noopPlugin(),
  ],
  model: 'googleai/gemini-2.0-flash',
});
