'use client';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {config} from 'dotenv';

config();

if (!process.env.GOOGLE_API_KEY) {
  const errorMessage =
    'GOOGLE_API_KEY environment variable not set. Please add it to your .env file.';
  console.error(errorMessage);
  // Throw an error to prevent the app from trying to initialize Genkit without a key.
  // In a real application, you might handle this more gracefully.
  if (typeof window === 'undefined') {
     // Throw on the server, but maybe not on the client.
     // For this app, we will throw to make it obvious.
     throw new Error(errorMessage);
  }
}

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
