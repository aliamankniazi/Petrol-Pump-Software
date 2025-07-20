# Petrol Pump Management Software

This is a comprehensive management software for petrol pumps, built with a modern technology stack. It helps manage sales, inventory, customers, finances, and more, with AI-powered analytics. This project was bootstrapped with Firebase Studio.

## Features

- **Sales Terminal**: An intuitive interface for processing fuel sales by amount or volume.
- **Unified Ledger**: Track all financial transactions including sales, purchases, expenses, and investments in a central ledger.
- **Customer & Supplier Management**: Manage customer and supplier information, track balances, and view individual ledgers.
- **Inventory Control**: Monitor fuel stock levels with manual and automatic adjustments from sales and purchases.
- **Financial Reporting**: View summaries of revenue, expenses, and profits.
- **AI-Powered Summaries**: Generate summaries of daily sales data using Google's generative AI.
- **Role-Based Access Control (RBAC)**: Create custom roles and manage user permissions.
- **Invoice Generation**: Print detailed invoices for sales and purchases.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Authentication & Hosting**: [Firebase](https://firebase.google.com/)
- **AI Integration**: [Genkit (Google AI)](https://firebase.google.com/docs/genkit)

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/en) (v20 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Firebase CLI](https://firebase.google.com/docs/cli)

## Setup and Installation

Follow these steps to get your development environment set up.

### 1. Clone the Repository

```bash
git clone https://github.com/aliamankniazi/Petrol-Pump-Software.git
cd Petrol-Pump-Software
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Firebase

This application uses Firebase for authentication and hosting.

- Create a new project in the [Firebase Console](https://console.firebase.google.com/).
- In your project's settings, add a new Web App.
- Copy the `firebaseConfig` object provided.
- Open `src/lib/firebase.ts` and replace the placeholder configuration with your actual `firebaseConfig` object.

### 4. Configure Environment Variables

The application requires an API key for Google's Generative AI features.

- Create a `.env` file in the root of the project.
- Add your Google AI API key to this file. You can obtain a key from [Google AI Studio](https://aistudio.google.com/app/apikey).

```env
# .env
GOOGLE_API_KEY="YOUR_SECRET_API_KEY"
```

### 5. Running the Application

The application consists of two parts that need to be run concurrently in separate terminal windows: the Next.js frontend and the Genkit AI server.

- **Terminal 1: Run the Next.js App**
  ```bash
  npm run dev
  ```
  This will start the main application, typically on `http://localhost:3000`.

- **Terminal 2: Run the Genkit AI Server**
  ```bash
  npm run genkit:dev
  ```
  This starts the local server that handles AI-powered features.

## Deployment

This application is configured for easy deployment with **Firebase App Hosting**.

1.  **Set Up App Hosting**: Make sure you have enabled App Hosting in your Firebase project.
2.  **Add AI API Key to Backend**: For the deployed app's AI features to work, you must add your `GOOGLE_API_KEY` as a secret in the App Hosting environment.
    - Go to your Firebase project > App Hosting.
    - Select your backend and navigate to the **Settings** tab.
    - Under "Secret Manager", add your `GOOGLE_API_KEY`.
3.  **Deploy**: Run the following command from your project root:
    ```bash
    firebase deploy --only apphosting
    ```

After the deployment is complete, the Firebase CLI will provide you with the URL to your live application.
