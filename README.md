# Resolv Points Dilution Calculator

This application calculates the dilution of Resolv points for Ethereum addresses.

## Project Structure

- `backend/`: Supabase Edge Functions
  - `functions/cron/`: Daily points stats collection
  - `functions/api/`: API endpoints for dilution calculation
- `frontend/`: Vue 3 frontend application

## Backend Setup (Supabase)

1. Create a new Supabase project
2. Copy `.env.example` to `.env` and fill in your Supabase credentials
3. Deploy the Edge Functions:
   ```bash
   cd backend
   supabase functions deploy cron
   supabase functions deploy api
   ```
4. The cron job will run automatically at 00:05 UTC daily

## Frontend Setup (Netlify)

1. Create a new Netlify site
2. Configure the following environment variables in Netlify:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_API_ENDPOINT`: Your Supabase Edge Function API endpoint

## API Endpoints

### GET /api/dilution?address={ethereum_address}
Calculate dilution for a specific address

Response:
```json
{
  "address": "0x...",
  "currentPoints": 100,
  "dilutionPercentage": "5.2",
  "minPointsNeeded": 10
}
```

### GET /api/min-points
Get minimum points needed to avoid dilution

Response:
```json
{
  "minPointsNeeded": 10
}
```

## Development

1. Install dependencies:
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd frontend
   npm install
   ```

2. Run locally:
   ```bash
   # Backend
   supabase start

   # Frontend
   npm run dev
   ```

## Features

- Calculate points dilution for any Ethereum address
- Display minimum points needed to avoid dilution
- Daily updates of total points and dilution rates
- Modern, responsive UI with Tailwind CSS

## Deployment

### Backend (Supabase)

1. Install Supabase CLI
2. Link your project:
```bash
supabase link --project-ref your-project-ref
```
3. Deploy the Edge Function:
```bash
cd backend
npm run deploy
```

4. Set up the cron job in Supabase dashboard to run every day at 00:05 UTC

### Frontend (Netlify)

1. Push your code to a Git repository
2. Connect your repository to Netlify
3. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Set the environment variables in Netlify dashboard
5. Deploy! 