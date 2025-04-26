
// Get user groups function
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { p_user_id } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    console.log('Fetching groups for user:', p_user_id);
    
    // Improved query to only fetch groups the user is a member of (through the group_members junction table)
    // This ensures we only get currently valid groups
    const { data: userGroups, error } = await supabaseClient
      .from('groups')
      .select('*')
      .in('id', 
        supabaseClient.from('group_members')
          .select('group_id')
          .eq('user_id', p_user_id)
      );
    
    if (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
    
    console.log('Found groups for user:', userGroups?.length || 0);
    
    return new Response(JSON.stringify(userGroups || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get_user_groups:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
