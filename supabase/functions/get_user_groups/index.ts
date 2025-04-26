
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
    
    // First get groups where the user is a member
    const { data: memberGroups, error: memberError } = await supabaseClient
      .from('groups')
      .select('*')
      .eq('created_by', p_user_id);
    
    if (memberError) {
      console.error('Error fetching created groups:', memberError);
      throw memberError;
    }
    
    console.log('Found created groups:', memberGroups);
    
    // Then get groups where the user is a member through group_members
    const { data: joinedGroups, error: joinedError } = await supabaseClient
      .from('groups')
      .select('*')
      .in('id', (
        await supabaseClient
          .from('group_members')
          .select('group_id')
          .eq('user_id', p_user_id)
      ).data?.map(m => m.group_id) || []);
    
    if (joinedError) {
      console.error('Error fetching joined groups:', joinedError);
      throw joinedError;
    }
    
    console.log('Found joined groups:', joinedGroups);
    
    // Combine and deduplicate groups
    const allGroups = [...memberGroups, ...joinedGroups].filter((group, index, self) =>
      index === self.findIndex((g) => g.id === group.id)
    );
    
    console.log('All groups:', allGroups);
    
    return new Response(JSON.stringify(allGroups), {
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
