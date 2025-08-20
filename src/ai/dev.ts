import { config } from 'dotenv';
config();

// In production, the GOOGLE_API_KEY is provided by the App Hosting environment.
// This check is only for local development.
if (process.env.NODE_ENV !== 'production' && !process.env.GOOGLE_API_KEY) {
  console.warn(
    'GOOGLE_API_KEY environment variable not set. Please add it to your .env file for local development. AI features will be disabled.'
  );
}

import '@/ai/flows/generate-sales-summary.ts';
