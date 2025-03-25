import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Database } from "../_shared/types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    console.log('Request path:', path);

    // Remove /api prefix from path for routing
    const routePath = path.replace(/^\/api/, '');
    console.log('Route path:', routePath);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    // Get latest points stats
    console.log('Fetching stats from database...');
    const { data: latestStats, error: statsError } = await supabase
      .from('points_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2);

    if (statsError) {
      console.error('Database error:', statsError);
      throw statsError;
    }

    if (!latestStats || latestStats.length < 2) {
      console.log('Insufficient data:', { count: latestStats?.length ?? 0 });
      return new Response(JSON.stringify({ error: 'Insufficient data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [today, yesterday] = latestStats;
    console.log('Stats retrieved:', { today, yesterday });

    // Handle minimum points endpoint
    if (routePath === '/min-points') {
      return new Response(JSON.stringify({
        minPointsNeeded: today.min_points_needed,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle points statistics endpoint
    if (routePath === '/points-stats') {
      const change = today.total_points - yesterday.total_points;
      const changePercentage = (change / yesterday.total_points) * 100;

      return new Response(JSON.stringify({
        today: today.total_points,
        yesterday: yesterday.total_points,
        change,
        changePercentage
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle dilution endpoint
    if (routePath.startsWith('/dilution')) {
      const address = url.searchParams.get('address');
      
      if (!address) {
        return new Response(JSON.stringify({ error: 'Address required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Fetching points for address:', address);
      const response = await fetch(`https://api.resolv.im/points?address=${address}`);
      const data = await response.json();
      console.log('Resolv API response:', data);
      const userPoints = data.dailyPoints;
      const totalPoints = data.totalPoints;

      // Calculate user's share of total points for today and yesterday
      const userShareToday = (totalPoints / today.total_points) * 100;
      const userShareYesterday = ((totalPoints - userPoints) / yesterday.total_points) * 100;
      
      // Calculate the percentage change in user's share
      const userDilution = userShareYesterday - userShareToday;

      // Calculate minimum points needed for 0% dilution
      // At 0% dilution: userShareToday = userShareYesterday
      // (totalPoints / today.total_points) = ((totalPoints - minPoints) / yesterday.total_points)
      // Solve for minPoints:
      const minPointsForZeroDilution = Math.ceil(
        totalPoints * (today.total_points / yesterday.total_points - 1)
      );
      
      console.log('Calculated values:', { 
        userShareToday,
        userShareYesterday,
        userDilution,
        userPoints,
        totalPoints,
        minPointsForZeroDilution
      });

      return new Response(JSON.stringify({
        address,
        currentPoints: userPoints,
        totalPoints: totalPoints,
        dilutionPercentage: userDilution,
        minPointsNeeded: today.min_points_needed,
        minPointsForZeroDilution
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Detailed error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 