import { config } from 'dotenv';
config();

if (!process.env.GOOGLE_API_KEY) {
  console.error(
    'GOOGLE_API_KEY environment variable not set. Please add it to your .env file.'
  );
  // In a real application, you might handle this more gracefully.
  // For this app, we will throw to make it obvious.
  throw new Error('GOOGLE_API_KEY environment variable not set.');
}

import '@/ai/flows/generate-sales-summary.ts';
