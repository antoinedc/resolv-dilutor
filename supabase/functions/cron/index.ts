import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Database } from "../_shared/types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables:', { 
        supabaseUrl: !!supabaseUrl,
        serviceKey: !!supabaseKey 
      });
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    // Fetch current total points from Resolv API
    console.log('Fetching points from Resolv API...');
    const response = await fetch('https://api.resolv.im/points/stats');
    const data = await response.json();
    console.log('Resolv API response:', data);
    const totalPoints = data.totalPoints;

    // Get yesterday's stats
    console.log('Fetching previous stats from database...');
    const { data: yesterdayStats, error: statsError } = await supabase
      .from('points_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (statsError) {
      console.error('Database error:', statsError);
      throw statsError;
    }

    // Calculate minimum points needed to avoid dilution
    let minPointsNeeded = 0;
    if (yesterdayStats && yesterdayStats.length > 0) {
      const yesterdayTotal = yesterdayStats[0].total_points;
      const dilutionRate = (totalPoints - yesterdayTotal) / yesterdayTotal;
      minPointsNeeded = Math.ceil(dilutionRate * 100);
      console.log('Calculated values:', { yesterdayTotal, totalPoints, dilutionRate, minPointsNeeded });
    } else {
      console.log('No previous stats found, using initial values');
    }

    // Store today's stats
    console.log('Storing new stats...');
    const { error: insertError } = await supabase
      .from('points_stats')
      .insert({
        total_points: totalPoints,
        min_points_needed: minPointsNeeded,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    return new Response(JSON.stringify({
      success: true,
      totalPoints,
      minPointsNeeded,
    }), {
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