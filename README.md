# Resolv Points Dilution Calculator

This application calculates the dilution of Resolv points for Ethereum addresses.

## Project Structure

- `backend/`: Supabase Edge Functions
  - `functions/cron/`: Daily points stats collection
  - `functions/api/`: API endpoints for dilution calculation
- `frontend/`: Vue 3 frontend application

## Environment Setup

### Backend (Supabase)
1. Create a new Supabase project
2. Copy `supabase/.env.example` to `supabase/.env` and fill in your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
3. Deploy the Edge Functions:
   ```bash
   cd backend
   supabase functions deploy cron
   supabase functions deploy api
   ```
4. The cron job will run automatically at 00:05 UTC daily

### Frontend
1. Copy `frontend/.env.example` to `frontend/.env` and configure:
   ```
   VITE_API_URL=your_supabase_functions_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
2. Install dependencies and run locally:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## API Endpoints

### GET /api/dilution?address={ethereum_address}
Calculate dilution for a specific address

Response:
```json
{
  "address": "0x...",
  "currentPoints": 100,
  "totalPoints": 1000,
  "dilutionPercentage": "5.2"
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

### GET /api/points-stats
Get current points statistics

Response:
```json
{
  "today": 1000000,
  "yesterday": 900000,
  "change": 100000,
  "changePercentage": 11.11
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

## Security Notes

1. Never commit `.env` files to the repository
2. Keep your Supabase service role key secure and never expose it publicly
3. The frontend only uses the anon key for public API access
4. All sensitive operations are protected by Row Level Security (RLS) in Supabase

## Deployment

### Backend (Supabase)

1. Install Supabase CLI
2. Link your project:
```bash
supabase link --project-ref your-project-ref
```
3. Deploy the Edge Functions:
```bash
cd backend
supabase functions deploy
```

4. Set up the cron job in Supabase dashboard to run every day at 00:05 UTC

### Frontend (Netlify)

1. Push your code to a Git repository
2. Connect your repository to Netlify
3. Configure environment variables in Netlify's dashboard
4. Deploy! 